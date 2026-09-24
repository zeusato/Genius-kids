import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { SHARED_SPHERE, getGlowTexture, texUrl, SimClock, BodyRegistry } from './core';
import { SUN_RADIUS, SUN_HIT_RADIUS, spinPeriodSeconds } from './scale';
import { GLSL_NOISE } from './glslNoise';
import { prefersReducedMotion } from './sceneParams';

interface SunProps {
    clock: SimClock;
    onSelect: (id: string) => void;
    quality?: 'high' | 'low';
    registry?: React.MutableRefObject<BodyRegistry>;
}

const CORONA_EXTENT = 3.4; // bán kính vành nhật hoa (tính theo bán kính Mặt Trời)

// Mặt Trời "sống":
//  - bề mặt: giữ ảnh NASA/Solar System Scope, cho SÔI bằng flow-map 2 pha (mọi tier) + hạt
//    granule (tier cao) — các ô đối lưu thật rộng ~1.000 km
//  - TỐI RÌA (limb darkening) theo công thức thật I(μ) = 1 − 0,6·(1 − μ): nhìn vào rìa là nhìn
//    xiên qua lớp khí phía trên, nguội hơn nên tối và đỏ hơn
//  - vành nhật hoa: tia streamer trôi chậm + vòng lửa (prominence) ở rìa — thấy được khi nhật thực
//  - màu HDR (>1) để Bloom bắt; tone mapping Neutral nén thành lõi trắng-nóng (Mặt Trời thật màu
//    trắng khi nhìn từ vũ trụ)
// + pointLight decay=0 chiếu sáng các hành tinh + hit sphere vô hình cho ngón tay trẻ em.
export const Sun: React.FC<SunProps> = ({ clock, onSelect, quality = 'high', registry }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const coronaRef = useRef<THREE.Mesh>(null);
    const camera = useThree((s) => s.camera);
    const sunTex = useTexture(texUrl('sun'));
    sunTex.colorSpace = THREE.SRGBColorSpace;
    const high = quality === 'high';
    const animate = !prefersReducedMotion();

    // Mặt Trời tự quay ~25 ngày (xích đạo) → nén
    const spinSpeed = (2 * Math.PI) / spinPeriodSeconds(25 * 24);

    const surface = useMemo(() => new THREE.ShaderMaterial({
        uniforms: {
            uMap: { value: sunTex },
            uTime: { value: 0 },
            uHdr: { value: new THREE.Color(1.9, 1.5, 1.05) }
        },
        defines: high ? { GRANULES: '' } : {},
        vertexShader: /* glsl */`
            varying vec2 vUv;
            varying vec3 vObj;
            varying vec3 vNormalV;
            varying vec3 vViewPos;
            void main() {
                vUv = uv;
                vObj = position;
                vNormalV = normalize(normalMatrix * normal);
                vec4 mv = modelViewMatrix * vec4(position, 1.0);
                vViewPos = -mv.xyz;
                gl_Position = projectionMatrix * mv;
            }
        `,
        fragmentShader: /* glsl */`
            uniform sampler2D uMap;
            uniform float uTime;
            uniform vec3 uHdr;
            varying vec2 vUv;
            varying vec3 vObj;
            varying vec3 vNormalV;
            varying vec3 vViewPos;
            ${GLSL_NOISE}
            void main() {
                // flow-map 2 pha: kéo UV theo trường dòng chảy chậm, hai pha lệch nửa chu kỳ trộn chéo.
                // Trường dòng chảy lấy từ CHÍNH texture (bản thu nhỏ, trôi chậm) — rẻ hơn noise nhiều,
                // quan trọng khi zoom sát Mặt Trời phủ kín màn hình trên tablet yếu.
                vec2 flow = (texture2D(uMap, vUv * 0.37 + vec2(uTime * 0.004, uTime * 0.0023)).rg - 0.5) * 0.05;
                float ph0 = fract(uTime * 0.06);
                float ph1 = fract(uTime * 0.06 + 0.5);
                float w0 = 1.0 - abs(1.0 - 2.0 * ph0);
                vec3 c0 = texture2D(uMap, vUv + flow * ph0).rgb;
                vec3 c1 = texture2D(uMap, vUv + flow * ph1).rgb;
                vec3 col = c0 * w0 + c1 * (1.0 - w0);
            #ifdef GRANULES
                float g = snoise(vObj * 34.0 + vec3(0.0, uTime * 0.25, uTime * 0.1)) * 0.5 + 0.5;
                float g2 = snoise(vObj * 71.0 - vec3(uTime * 0.2, 0.0, 0.0)) * 0.5 + 0.5;
                col *= 0.84 + 0.22 * g + 0.1 * g2;
            #endif
                float mu = clamp(dot(normalize(vNormalV), normalize(vViewPos)), 0.0, 1.0);
                float limb = 1.0 - 0.6 * (1.0 - mu);
                vec3 limbTint = mix(vec3(1.0, 0.62, 0.36), vec3(1.0), pow(mu, 0.45));
                gl_FragColor = vec4(col * uHdr * limb * limbTint, 1.0);
                #include <tonemapping_fragment>
                #include <colorspace_fragment>
            }
        `,
        toneMapped: true
    }), [sunTex, high]);

    const corona = useMemo(() => new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        defines: high ? { FINE: '' } : {},
        vertexShader: /* glsl */`
            varying vec2 vP;
            void main() {
                vP = (uv - 0.5) * 2.0 * ${CORONA_EXTENT.toFixed(2)};
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: /* glsl */`
            uniform float uTime;
            varying vec2 vP;
            ${GLSL_NOISE}
            void main() {
                float r = length(vP);
                if (r < 0.97 || r > ${CORONA_EXTENT.toFixed(2)}) discard;
                float th = atan(vP.y, vP.x);
                vec2 cs = vec2(cos(th), sin(th));
                // tia streamer: nhiễu theo góc (toạ độ vòng tròn → không có đường nối), trôi ra ngoài chậm
                float streak = snoise(vec3(cs * 2.6, r * 0.55 - uTime * 0.05)) * 0.5 + 0.5;
                float fine = 0.5;
            #ifdef FINE
                fine = snoise(vec3(cs * 9.0, r * 1.4 - uTime * 0.09)) * 0.5 + 0.5;
            #endif
                float fall = exp(-(r - 1.0) * 2.1);
                float edge = smoothstep(${CORONA_EXTENT.toFixed(2)}, ${(CORONA_EXTENT * 0.7).toFixed(2)}, r);
                float corona = fall * edge * (0.45 + 0.55 * streak) * (0.8 + 0.4 * fine);
                // vòng lửa (prominence) sát rìa ở vài góc — chỉ tính trong dải sát rìa (tiết kiệm noise)
                float prom = 0.0;
                if (r < 1.4) {
                    float pn = snoise(vec3(cs * 4.0, uTime * 0.015));
                    if (pn > 0.5) {
                        float loops = snoise(vec3(vP * 7.0, uTime * 0.08)) * 0.5 + 0.5;
                        prom = smoothstep(0.5, 0.78, pn) * exp(-(r - 1.0) * 13.0) * (0.35 + 0.65 * loops);
                    }
                }
                vec3 col = vec3(1.0, 0.82, 0.58) * corona * 0.9 + vec3(1.35, 0.42, 0.14) * prom * 1.4;
                gl_FragColor = vec4(col, 1.0);
                #include <tonemapping_fragment>
                #include <colorspace_fragment>
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    }), [high]);

    useEffect(() => () => { surface.dispose(); corona.dispose(); }, [surface, corona]);

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * clock.timeScale * spinSpeed;
        }
        // Bề mặt vẫn sôi khi mô phỏng tạm dừng (thời gian thực) — trừ khi bé bật giảm chuyển động
        const t = animate ? state.clock.elapsedTime : 0;
        surface.uniforms.uTime.value = t;
        corona.uniforms.uTime.value = t;
        if (coronaRef.current) coronaRef.current.quaternion.copy(camera.quaternion);
    });

    return (
        <group>
            <mesh ref={meshRef} geometry={SHARED_SPHERE} material={surface} scale={SUN_RADIUS} />

            {/* Vành nhật hoa — mặt phẳng luôn quay về camera; phần sau quả cầu bị depth che */}
            <mesh ref={coronaRef} material={corona} renderOrder={2}>
                <planeGeometry args={[SUN_RADIUS * CORONA_EXTENT * 2, SUN_RADIUS * CORONA_EXTENT * 2]} />
            </mesh>

            {/* Quầng sáng xa — sprite gradient additive, gần như miễn phí */}
            <sprite scale={[SUN_RADIUS * 5, SUN_RADIUS * 5, 1]} renderOrder={3}>
                <spriteMaterial
                    map={getGlowTexture()}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    transparent
                    opacity={0.5}
                    color="#FFCC80"
                />
            </sprite>

            {/* Vùng chạm to cho trẻ em */}
            <mesh
                visible={false}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect('sun');
                }}
                onPointerOver={() => (document.body.style.cursor = 'pointer')}
                onPointerOut={() => (document.body.style.cursor = 'default')}
            >
                <sphereGeometry args={[SUN_HIT_RADIUS, 12, 12]} />
            </mesh>

            {/* Nguồn sáng duy nhất của hệ — KHÔNG shadow map (đường ranh ngày/đêm
                từ ánh sáng thường chính là "bóng" trẻ cần thấy) */}
            <pointLight intensity={2.6} decay={0} color="#FFF4E0" />

            {high && registry && <SunFlare registry={registry} />}
        </group>
    );
};

// ---------- Lens flare nhẹ (hiệu ứng ống kính máy ảnh, chỉ tier cao) ----------
// Tự làm bằng vài sprite thay vì LensFlare của postprocessing (cái đó raycast CẢ scene mỗi frame
// — gồm 1.500 viên đá — mà vẫn không xét hành tinh che). Ở đây: bóng ma dọc đường Mặt Trời → tâm
// màn hình, mờ dần khi Mặt Trời ra mép khung hoặc bị hành tinh che (giao tia với từng quả cầu).

function makeRingTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(64, 64, 30, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.7, 'rgba(255,255,255,0.35)');
    grad.addColorStop(0.85, 'rgba(255,255,255,0.12)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
}

const GHOSTS = [
    { k: 0.5, size: 0.035, color: '#ffd9a0', ring: false, alpha: 0.22 },
    { k: 0.2, size: 0.018, color: '#a8e0ff', ring: false, alpha: 0.25 },
    { k: -0.35, size: 0.05, color: '#c9a8ff', ring: true, alpha: 0.1 },
    { k: -0.65, size: 0.028, color: '#9effc6', ring: false, alpha: 0.18 },
    { k: -1.0, size: 0.07, color: '#ffc38a', ring: true, alpha: 0.08 }
];

const SunFlare: React.FC<{ registry: React.MutableRefObject<BodyRegistry> }> = ({ registry }) => {
    const groupRef = useRef<THREE.Group>(null);
    const ringTex = useMemo(() => makeRingTexture(), []);
    const vis = useRef(0);
    const tmp = useMemo(() => ({ ndc: new THREE.Vector3(), p: new THREE.Vector3(), dir: new THREE.Vector3(), c: new THREE.Vector3() }), []);

    useFrame(({ camera }, delta) => {
        const grp = groupRef.current;
        if (!grp) return;
        const cam = camera as THREE.PerspectiveCamera;
        tmp.ndc.set(0, 0, 0).project(cam);
        let target = 0;
        if (tmp.ndc.z < 1) {
            const edge = Math.max(Math.abs(tmp.ndc.x), Math.abs(tmp.ndc.y));
            target = 1 - THREE.MathUtils.smoothstep(edge, 0.75, 1.1);
            // hành tinh che Mặt Trời?
            const dist = cam.position.length();
            tmp.dir.copy(cam.position).multiplyScalar(-1 / dist);
            for (const entry of Object.values(registry.current)) {
                entry.object.getWorldPosition(tmp.c);
                const oc = tmp.c.sub(cam.position);
                const tca = oc.dot(tmp.dir);
                if (tca <= 0 || tca >= dist) continue;
                if (oc.lengthSq() - tca * tca < entry.radius * entry.radius) { target = 0; break; }
            }
            // gần quá (đang ở cạnh Mặt Trời) thì bỏ flare — chói vô ích
            target *= THREE.MathUtils.smoothstep(dist, 9, 20);
        }
        vis.current += (target - vis.current) * Math.min(1, delta * 6);
        grp.visible = vis.current > 0.01;
        if (!grp.visible) return;

        const halfH = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * 6;
        grp.children.forEach((child, i) => {
            const g = GHOSTS[i];
            tmp.p.set(tmp.ndc.x * g.k, tmp.ndc.y * g.k, 0.5).unproject(cam).sub(cam.position).normalize();
            child.position.copy(cam.position).addScaledVector(tmp.p, 6);
            const s = g.size * halfH * 2;
            child.scale.set(s, s, 1);
            ((child as THREE.Sprite).material as THREE.SpriteMaterial).opacity = g.alpha * vis.current;
        });
    });

    return (
        <group ref={groupRef}>
            {GHOSTS.map((g, i) => (
                <sprite key={i} renderOrder={20}>
                    <spriteMaterial
                        map={g.ring ? ringTex : getGlowTexture()}
                        color={g.color}
                        blending={THREE.AdditiveBlending}
                        depthTest={false}
                        depthWrite={false}
                        transparent
                    />
                </sprite>
            ))}
        </group>
    );
};
