import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
import { texUrl } from './core';
import { sceneLighting } from './sceneParams';

// Bầu trời THẬT (xem scripts/build-sky.mjs):
//  - 9.096 sao của Yale Bright Star Catalogue vẽ bằng MỘT Points: nét ở mọi DPR, cỡ theo cấp sáng,
//    màu theo chỉ số B–V (sao nóng xanh trắng, sao nguội cam đỏ). KHÔNG nhấp nháy — ngoài vũ trụ
//    sao không lấp lánh (lấp lánh là do khí quyển Trái Đất).
//  - Dải Ngân Hà: ảnh 1K đã tách sao + làm mờ, vẽ trên cầu lộn trong bám theo camera.
//    Bản cũ gán equirect vào scene.background → three đổi sang cubemap cạnh = chiều cao ảnh
//    + mipmap: ~180MB VRAM với ảnh 4K. Bản này ~3MB.
//  - Khung toạ độ: mặt phẳng quỹ đạo của scene = hoàng đạo thật → chòm sao hoàng đạo (Bọ Cạp,
//    Sư Tử...) nằm dọc quỹ đạo các hành tinh, dải Ngân Hà cắt nghiêng ~60° như trời thật.

const SKY_R = 420; // < camera.far (500) — nhóm bám theo camera nên luôn nằm trong tầm nhìn

interface SkyMeta {
    milkyWay: { gain: number; lonSign: number; lonOffset: number; latSign: number };
    sceneToGalactic: number[];
}
interface Constellation { id: string; name: string; segments: [number, number][] }

// Nhiệt độ từ B–V (Ballesteros 2012) → màu vật đen gần đúng
function bvToColor(bv: number, out: THREE.Color): THREE.Color {
    const t = 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62));
    const k = t / 100;
    let r: number, g: number, b: number;
    if (k <= 66) { r = 255; g = 99.47 * Math.log(k) - 161.12; b = k <= 19 ? 0 : 138.52 * Math.log(k - 10) - 305.04; }
    else { r = 329.7 * Math.pow(k - 60, -0.1332); g = 288.12 * Math.pow(k - 60, -0.0755); b = 255; }
    const c = (x: number) => Math.min(255, Math.max(0, x)) / 255;
    // làm nhạt 35% về trắng — mắt người thấy sao nhạt màu hơn phổ vật đen
    return out.setRGB(c(r), c(g), c(b), THREE.SRGBColorSpace).lerp(new THREE.Color(1, 1, 1), 0.35);
}

let skyDataPromise: Promise<{ stars: ArrayBuffer; meta: SkyMeta; cons: Constellation[] }> | null = null;
function loadSkyData() {
    if (!skyDataPromise) {
        const base = `${import.meta.env.BASE_URL}sky/`;
        skyDataPromise = Promise.all([
            fetch(`${base}stars.bin`).then((r) => r.arrayBuffer()),
            fetch(`${base}sky-meta.json`).then((r) => r.json()),
            fetch(`${base}constellations.json`).then((r) => r.json())
        ]).then(([stars, meta, cons]) => ({ stars, meta, cons }));
        skyDataPromise.catch(() => { skyDataPromise = null; });
    }
    return skyDataPromise;
}

interface StarsBackgroundProps {
    quality?: 'high' | 'low';
    showConstellations?: boolean;
}

export function StarsBackground({ quality = 'high', showConstellations = false }: StarsBackgroundProps) {
    const groupRef = useRef<THREE.Group>(null);
    const camera = useThree((s) => s.camera);
    const dpr = useThree((s) => s.viewport.dpr);
    const mwTex = useTexture(texUrl('milkyway'));
    const [data, setData] = useState<{ stars: ArrayBuffer; meta: SkyMeta; cons: Constellation[] } | null>(null);

    useEffect(() => {
        let alive = true;
        loadSkyData().then((d) => alive && setData(d)).catch(() => { /* thiếu dữ liệu sao: vẫn còn dải Ngân Hà */ });
        return () => { alive = false; };
    }, []);

    useEffect(() => {
        mwTex.colorSpace = THREE.SRGBColorSpace;
        mwTex.generateMipmaps = false; // tránh vệt ở mối nối kinh độ (đạo hàm nhảy)
        mwTex.minFilter = THREE.LinearFilter;
        mwTex.wrapS = THREE.RepeatWrapping;
        mwTex.needsUpdate = true;
    }, [mwTex]);

    const milkyWay = useMemo(() => {
        if (!data) return null;
        const m = data.meta.sceneToGalactic;
        // Matrix3.set nhận thứ tự hàng-chính, khớp sky-meta.json (three tự đổi sang cột-chính cho GLSL)
        const mat = new THREE.Matrix3().set(m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8]);
        return new THREE.ShaderMaterial({
            uniforms: {
                uTex: { value: mwTex },
                uToGal: { value: mat },
                uLon: { value: new THREE.Vector2(data.meta.milkyWay.lonSign, data.meta.milkyWay.lonOffset) },
                uLatSign: { value: data.meta.milkyWay.latSign },
                uIntensity: { value: 0.16 / data.meta.milkyWay.gain * 9 }
            },
            vertexShader: /* glsl */`
                varying vec3 vDir;
                void main() {
                    vDir = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: /* glsl */`
                uniform sampler2D uTex;
                uniform mat3 uToGal;
                uniform vec2 uLon;
                uniform float uLatSign;
                uniform float uIntensity;
                varying vec3 vDir;
                float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
                void main() {
                    vec3 g = uToGal * normalize(vDir);
                    float l = atan(g.y, g.x);
                    float b = asin(clamp(g.z, -1.0, 1.0));
                    float u = 0.5 + uLon.y + uLon.x * l / 6.2831853;
                    float row = 0.5 - uLatSign * b / 3.1415927;
                    vec3 c = texture2D(uTex, vec2(u, 1.0 - row)).rgb;
                    // ảnh gốc ngả xanh: kéo về trắng ngà như Ngân Hà nhìn bằng mắt
                    float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
                    c = mix(vec3(lum) * vec3(1.0, 0.95, 0.86), c, 0.35);
                    c *= uIntensity;
                    // dither chống phân tầng ở vùng gần đen
                    c += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
                    gl_FragColor = vec4(max(c, 0.0), 1.0);
                    #include <colorspace_fragment>
                }
            `,
            side: THREE.BackSide,
            depthWrite: false,
            depthTest: false,
            blending: THREE.AdditiveBlending
        });
    }, [data, mwTex]);

    const stars = useMemo(() => {
        if (!data) return null;
        const view = new DataView(data.stars);
        const n = data.stars.byteLength / 8;
        const maxMag = quality === 'high' ? 6.6 : 5.4;
        const pos: number[] = [], col: number[] = [], size: number[] = [];
        const c = new THREE.Color();
        for (let i = 0; i < n; i++) {
            const mag = view.getUint8(i * 8 + 6) / 25 - 2;
            if (mag > maxMag) continue;
            const x = view.getInt16(i * 8, true) / 32767, y = view.getInt16(i * 8 + 2, true) / 32767, z = view.getInt16(i * 8 + 4, true) / 32767;
            pos.push(x * SKY_R * 0.98, y * SKY_R * 0.98, z * SKY_R * 0.98);
            bvToColor(view.getUint8(i * 8 + 7) / 85 - 0.5, c);
            // độ sáng tương đối (flux) — sao cấp 0 sáng gấp 100 lần sao cấp 5
            const flux = Math.pow(10, -0.4 * (mag - 1));
            const brightness = Math.min(1, 0.22 + Math.sqrt(flux) * 0.55);
            col.push(c.r * brightness, c.g * brightness, c.b * brightness);
            size.push(Math.min(7, 1.3 + Math.sqrt(flux) * 2.6));
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
        geo.setAttribute('aSize', new THREE.Float32BufferAttribute(size, 1));
        const mat = new THREE.ShaderMaterial({
            uniforms: { uDpr: { value: 1 } },
            vertexShader: /* glsl */`
                attribute float aSize;
                varying vec3 vColor;
                varying float vSize;
                uniform float uDpr;
                void main() {
                    vColor = color;
                    vSize = aSize;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = aSize * uDpr * 1.6;
                }
            `,
            fragmentShader: /* glsl */`
                varying vec3 vColor;
                varying float vSize;
                void main() {
                    float d = length(gl_PointCoord - 0.5) * 2.0;
                    float core = exp(-d * d * 7.0);
                    float halo = exp(-d * 3.2) * smoothstep(3.0, 6.0, vSize) * 0.35;
                    gl_FragColor = vec4(vColor * (core + halo), 1.0);
                    #include <colorspace_fragment>
                }
            `,
            vertexColors: true,
            depthWrite: false,
            depthTest: false,
            blending: THREE.AdditiveBlending
        });
        return { geo, mat, positions: pos };
    }, [data, quality]);

    // Đường nối chòm sao + nhãn tên tiếng Việt (dùng lại toạ độ sao)
    const constellations = useMemo(() => {
        if (!data) return null;
        const view = new DataView(data.stars);
        const dir = (i: number) => new THREE.Vector3(
            view.getInt16(i * 8, true), view.getInt16(i * 8 + 2, true), view.getInt16(i * 8 + 4, true)
        ).divideScalar(32767).multiplyScalar(SKY_R * 0.97);
        const pts: number[] = [];
        const labels: { name: string; pos: THREE.Vector3 }[] = [];
        for (const con of data.cons) {
            const centroid = new THREE.Vector3();
            let k = 0;
            for (const [a, b] of con.segments) {
                const pa = dir(a), pb = dir(b);
                pts.push(pa.x, pa.y, pa.z, pb.x, pb.y, pb.z);
                centroid.add(pa).add(pb);
                k += 2;
            }
            labels.push({ name: con.name, pos: centroid.divideScalar(k).setLength(SKY_R * 0.95) });
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
        const mat = new THREE.LineBasicMaterial({ color: '#7fb4ff', transparent: true, opacity: 0.45, depthTest: false, depthWrite: false });
        return { geo, mat, labels };
    }, [data]);

    useFrame(() => {
        // bầu trời "ở vô cực": bám theo camera nên không có thị sai khi camera bay.
        // Thu nhỏ theo camera.far — modal/Cắt hành tinh dùng far 50–100 < SKY_R, thiếu bước này
        // là cả bầu trời bị cắt mất (cỡ điểm sao tính bằng pixel nên không đổi khi thu nhỏ).
        if (groupRef.current) {
            groupRef.current.position.copy(camera.position);
            const far = (camera as THREE.PerspectiveCamera).far ?? 500;
            groupRef.current.scale.setScalar(Math.min(1, (far * 0.85) / SKY_R));
        }
        if (stars) stars.mat.uniforms.uDpr.value = dpr;
        // thanh "độ sáng": dải Ngân Hà rõ hơn một chút cho bầu trời bớt "tăm tối"
        if (milkyWay && data) milkyWay.uniforms.uIntensity.value = (0.16 / data.meta.milkyWay.gain) * 9 * (1 + 0.9 * sceneLighting.brightness);
    });

    useEffect(() => () => {
        milkyWay?.dispose();
        stars?.geo.dispose();
        stars?.mat.dispose();
    }, [milkyWay, stars]);

    return (
        <group ref={groupRef}>
            {milkyWay && (
                <mesh material={milkyWay} scale={SKY_R} renderOrder={-10} frustumCulled={false}>
                    <sphereGeometry args={[1, 48, 24]} />
                </mesh>
            )}
            {stars && <points geometry={stars.geo} material={stars.mat} renderOrder={-9} frustumCulled={false} />}
            {constellations && showConstellations && (
                <>
                    <lineSegments geometry={constellations.geo} material={constellations.mat} renderOrder={-8} frustumCulled={false} />
                    {constellations.labels.map((l) => (
                        <Html key={l.name} position={l.pos} center zIndexRange={[20, 0]} wrapperClass="pointer-events-none">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-sky-100/90 bg-sky-900/30 border border-sky-300/20 whitespace-nowrap select-none">
                                {l.name}
                            </span>
                        </Html>
                    ))}
                </>
            )}
        </group>
    );
}
