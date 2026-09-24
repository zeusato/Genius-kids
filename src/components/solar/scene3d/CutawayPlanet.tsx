import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { CutawayBody } from '../../../data/planetLayersData';
import { DETAIL_SPHERE, getGlowTexture, texUrl } from './core';
import { getLayerTexture, layerKind, LayerTextureKind } from './layerTextures';
import { GLSL_NOISE } from './glslNoise';
import { AtmosphereRim, ATMOSPHERE_COLORS } from './AtmosphereRim';

// Hành tinh cắt múi: mỗi lớp địa tầng là một quả cầu đồng tâm bị "khoét múi"
// bằng 2 clipping plane (clipIntersection=true → chỉ vùng GIỮA 2 mặt phẳng bị cắt).
// Múi được che kín bởi các mặt cắt bán khuyên phẳng → không lộ ruột rỗng.
// Toàn bộ animation (mở múi, xoay, rung khi chém) chạy qua mutable ref trong
// useFrame — KHÔNG setState mỗi frame (quy ước chung của scene3d/).
//
// Vết cắt DÁN CHẶT vào hành tinh (tâm múi lưu theo tọa độ LOCAL): xoay hành tinh
// là cả khối lẫn vết cắt xoay theo như một chỉnh thể — mặt cắt nằm trong group
// spin, còn normal của 2 clipping plane (world space) được cộng thêm góc xoay
// hiện tại mỗi frame để khớp. Chỉ tự xoay chậm khi múi còn KHÉP, mở ra thì đứng
// yên cho trẻ tự xoay ngắm.

export interface CutawayControls {
    targetRotY: number;   // góc xoay hành tinh (rad) — kéo ngang cộng dồn vào đây
    targetAngle: number;  // độ mở múi (rad, 0..π)
    targetCenter: number; // hướng tâm múi theo LOCAL của hành tinh (rad)
    curRotY: number;      // góc xoay thực tại (component ghi mỗi frame) — để UI đổi world→local
    shake: number;        // 1 → 0: rung nhẹ sau nhát chém
    autoSpin: boolean;    // tự xoay chậm khi múi còn khép
    // Toạ độ neo của lớp đang chọn trên mặt cắt, chiếu ra pixel CSS trong canvas
    // (component ghi mỗi frame) — UI vẽ đường chỉ dẫn xuống thẻ diễn giải
    anchorX: number;
    anchorY: number;
    anchorOn: boolean;
}

export function createCutawayControls(): CutawayControls {
    return {
        targetRotY: 0, targetAngle: 0, targetCenter: Math.PI / 2, curRotY: 0,
        shake: 0, autoSpin: true, anchorX: 0, anchorY: 0, anchorOn: false
    };
}

// Vector tạm cho phép chiếu neo — tránh cấp phát trong vòng frame
const _anchorA = new THREE.Vector3();
const _anchorB = new THREE.Vector3();
// Vĩ độ đặt neo trên mặt cắt bán nguyệt (~ +9°, hơi cao trên xích đạo để chấm neo
// không bao giờ bị thẻ diễn giải nổi ở đáy-trái canvas che mất)
const ANCHOR_PSI = 0.15;

// Nhiệt độ cao nhất (°C) đọc từ chuỗi dữ liệu NASA của lớp: "~4.000 – 5.000°C", "15 triệu °C",
// "2 triệu → 5.500°C", "mát mẻ dễ chịu" (→ null)
export function maxTemperatureC(text: string): number | null {
    const million = /(\d+(?:[.,]\d+)?)\s*triệu/.exec(text);
    if (million) return parseFloat(million[1].replace(',', '.')) * 1e6;
    const nums = [...text.matchAll(/-?\d{1,3}(?:\.\d{3})+|-?\d+/g)].map((m) => parseInt(m[0].replace(/\./g, ''), 10));
    return nums.length ? Math.max(...nums) : null;
}

// Độ "nóng phát sáng" của lớp trên mặt cắt (0 = không phát sáng) — theo NHIỆT ĐỘ THẬT của lớp
// chứ không theo loại chất liệu: manti Trái Đất ~3.700°C chỉ âm ỉ (đá rắn chảy rất chậm), lõi
// ~5.000°C rực, ruột Mặt Trời hàng triệu độ chói nhất; băng/đá/khí lạnh thì không phát sáng.
function layerHeat(bodyId: string, kind: LayerTextureKind, temperature: string): number {
    // Mặt Trời: vừa đủ rực — quá 1 là tone mapping Neutral khử bão hoà thành màu phấn nhạt
    if (bodyId === 'sun') return kind === 'gas' ? 0.4 : 0.55;
    const t = maxTemperatureC(temperature);
    if (t === null) return 0;
    return THREE.MathUtils.clamp((t - 1600) / 4200, 0, 1) * 0.95;
}

interface FaceUniforms {
    uInner: { value: number };
    uOuter: { value: number };
    uHeat: { value: number };
    uHot: { value: THREE.Color };
    uTime: { value: number };
    uSel: { value: number };
    uPulseR: { value: number };
    uPulseA: { value: number };
    uRimEdge: { value: number }; // 1 = lớp ngoài cùng → viền sáng "vết cắt mới" ở mép hành tinh
}

// Vá vật liệu mặt cắt (vẫn ăn đèn như MeshStandard): đường ranh tối giữa các lớp (như ảnh
// minh hoạ địa tầng → đọc ra từng vỏ lồng nhau), lõi nóng phát sáng + dòng đối lưu trôi chậm,
// sóng sáng chạy từ vỏ vào lõi khi vừa mở múi, viền sáng ở mép vết cắt, lớp đang chọn rực hơn.
function patchFaceMaterial(mat: THREE.MeshStandardMaterial, u: FaceUniforms) {
    mat.customProgramCacheKey = () => 'cutaway-face';
    mat.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, u);
        shader.vertexShader = shader.vertexShader
            .replace('#include <common>', '#include <common>\nvarying vec2 vFaceXY;')
            .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFaceXY = position.xy;');
        shader.fragmentShader = shader.fragmentShader
            .replace('#include <common>', `#include <common>
varying vec2 vFaceXY;
uniform float uInner, uOuter, uHeat, uTime, uSel, uPulseR, uPulseA, uRimEdge;
uniform vec3 uHot;
${GLSL_NOISE}`)
            .replace('#include <map_fragment>', `#include <map_fragment>
float faceR = length(vFaceXY);
float seamW = 0.028;
float seamIn = uInner > 0.001 ? smoothstep(0.0, seamW, faceR - uInner) : 1.0;
float seamOut = smoothstep(0.0, seamW * 0.8, uOuter - faceR);
diffuseColor.rgb *= mix(0.42, 1.0, seamIn * seamOut);`)
            .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
if (uHeat > 0.0) {
    float flow = snoise(vec3(vFaceXY * 5.5, uTime * 0.18)) * 0.5 + 0.5;
    float cells = snoise(vec3(vFaceXY * 13.0 + vec2(uTime * 0.05, 0.0), uTime * 0.3)) * 0.5 + 0.5;
    float glow = uHeat * (0.35 + 0.65 * flow) * (0.75 + 0.35 * cells);
    totalEmissiveRadiance += uHot * glow * mix(0.55, 1.0, seamIn * seamOut);
}
totalEmissiveRadiance += vec3(1.0, 0.95, 0.8) * exp(-pow((faceR - uPulseR) / 0.035, 2.0)) * uPulseA;
totalEmissiveRadiance += vec3(1.0) * smoothstep(uOuter - 0.012, uOuter, faceR) * uRimEdge * 0.35;
totalEmissiveRadiance += uHot * uSel * (0.25 + 0.15 * sin(uTime * 4.0));`);
    };
}

interface CutawayPlanetProps {
    body: CutawayBody;
    controls: React.MutableRefObject<CutawayControls>;
    peelCount: number; // số lớp NGOÀI đã bóc kiểu củ hành
    selectedLayerId: string | null;
    onSelectLayer: (id: string) => void;
}

export const CutawayPlanet: React.FC<CutawayPlanetProps> = ({
    body, controls, peelCount, selectedLayerId, onSelectLayer
}) => {
    const rootRef = useRef<THREE.Group>(null);
    const spinRef = useRef<THREE.Group>(null);
    const faceARef = useRef<THREE.Group>(null);
    const faceBRef = useRef<THREE.Group>(null);

    // Giá trị hiện tại được damp về target mỗi frame
    const cur = useRef({ rotY: 0, angle: 0, center: Math.PI / 2 });
    // Hiệu ứng: sóng sáng chạy vào lõi khi mở múi + tia lửa khi chém
    const fx = useRef({ pulseT: 9, prevShake: 0, prevOpen: false });
    const sparksRef = useRef<THREE.Points>(null);

    const texture = useTexture(texUrl(body.id === 'earth' ? 'earth_day' : body.id));
    texture.colorSpace = THREE.SRGBColorSpace;

    // 2 mặt phẳng cắt qua trục Y (world space, đi qua tâm) — normal cập nhật mỗi frame
    const planes = useMemo(
        () => [new THREE.Plane(new THREE.Vector3(1, 0, 0), 0), new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0)],
        []
    );

    const isSun = body.id === 'sun';
    const outerIdx = body.layers.length - 1;

    // Vật liệu từng lớp: cầu (bị clip múi) + mặt cắt (không clip, DoubleSide che kín múi).
    // Vân procedural (layerTextures) vẽ SẴN màu lớp → color trắng để không nhuộm 2 lần;
    // texture nằm trong cache toàn cục, material.dispose() không đụng tới.
    const mats = useMemo(() => {
        return body.layers.map((layer, i) => {
            const isOuter = i === outerIdx;
            const grain = getLayerTexture(layerKind(body.id, layer.id), layer.color);
            let sphereMat: THREE.MeshStandardMaterial | THREE.MeshBasicMaterial;
            if (isSun && isOuter) {
                sphereMat = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
            } else {
                sphereMat = new THREE.MeshStandardMaterial({
                    color: '#ffffff',
                    // Lớp ngoài cùng giữ texture NASA; lớp trong dùng vân chất liệu
                    map: isOuter ? texture : grain,
                    roughness: 1,
                    metalness: 0,
                    emissive: new THREE.Color(layer.color),
                    // Ruột Mặt Trời tự phát sáng; hành tinh khác chỉ sáng khi được chọn
                    emissiveIntensity: isSun ? 0.55 : 0
                });
            }
            sphereMat.clippingPlanes = planes;
            sphereMat.clipIntersection = true;

            // Mặt cắt phát sáng NHẸ (Mặt Trời thì rực): đủ để màu địa tầng rõ nhưng vẫn
            // ăn bóng đèn hướng — xoay đi thì tối dần, giữ cảm giác khối đặc bị bổ
            const faceMat = new THREE.MeshStandardMaterial({
                color: '#ffffff',
                map: grain,
                roughness: 0.9,
                metalness: 0,
                side: THREE.DoubleSide,
                emissive: new THREE.Color(layer.color),
                emissiveIntensity: isSun ? 0.16 : 0.08
            });
            const kind = layerKind(body.id, layer.id);
            const faceUniforms: FaceUniforms = {
                uInner: { value: i === 0 ? 0 : body.layers[i - 1].radiusFrac },
                uOuter: { value: layer.radiusFrac },
                uHeat: { value: layerHeat(body.id, kind, layer.temperature) },
                uHot: { value: new THREE.Color(layer.color).lerp(new THREE.Color('#ffb347'), 0.35) },
                uTime: { value: 0 },
                uSel: { value: 0 },
                uPulseR: { value: 2 },
                uPulseA: { value: 0 },
                uRimEdge: { value: isOuter ? 1 : 0 }
            };
            patchFaceMaterial(faceMat, faceUniforms);
            return { sphereMat, faceMat, faceUniforms, baseSphere: isSun ? 0.55 : 0, baseFace: isSun ? 0.16 : 0.08 };
        });
    }, [body, texture, planes, isSun, outerIdx]);

    // Bán khuyên mặt cắt: lớp trong cùng là nửa hình tròn, các lớp ngoài là nửa vành khuyên
    const faceGeos = useMemo(() => {
        return body.layers.map((layer, i) => {
            const inner = i === 0 ? 0 : body.layers[i - 1].radiusFrac;
            return i === 0
                ? new THREE.CircleGeometry(layer.radiusFrac, 64, -Math.PI / 2, Math.PI)
                : new THREE.RingGeometry(inner, layer.radiusFrac, 64, 1, -Math.PI / 2, Math.PI);
        });
    }, [body]);

    // Tia lửa khi chém: 90 hạt, chỉ cập nhật CPU khi đang bay (≤ 1 giây sau nhát chém)
    const sparks = useMemo(() => createSparks(90), []);

    useEffect(() => {
        return () => {
            mats.forEach(m => { m.sphereMat.dispose(); m.faceMat.dispose(); });
            faceGeos.forEach(g => g.dispose());
        };
    }, [mats, faceGeos]);

    // Highlight lớp được chọn qua emissive — đổi hiếm, không cần chạy trong frame loop
    useEffect(() => {
        body.layers.forEach((layer, i) => {
            const sel = layer.id === selectedLayerId;
            const m = mats[i];
            if ('emissiveIntensity' in m.sphereMat) {
                (m.sphereMat as THREE.MeshStandardMaterial).emissiveIntensity = sel
                    ? Math.max(m.baseSphere, 0.45)
                    : m.baseSphere;
            }
            m.faceMat.emissiveIntensity = sel ? m.baseFace + 0.25 : m.baseFace;
            m.faceUniforms.uSel.value = sel ? 1 : 0;
        });
    }, [selectedLayerId, body, mats]);

    const visibleLayers = body.layers.length - peelCount;

    // Bầu khí quyển (hành tinh đá): lớp NGOÀI bề mặt, bị cắt cùng múi, có mặt cắt riêng.
    // Bóc lớp vỏ đầu tiên là khí quyển "bay" mất trước (nó ở ngoài cùng).
    const atmosphere = body.atmosphere;
    const atmoVisible = !!atmosphere && peelCount === 0;
    const atmoSelected = !!atmosphere && selectedLayerId === atmosphere.id;
    const atmoFace = useMemo(() => (atmosphere ? createAtmosphereFace(atmosphere.color, atmosphere.heightFrac) : null), [atmosphere]);
    useEffect(() => () => { atmoFace?.geo.dispose(); atmoFace?.mat.dispose(); }, [atmoFace]);
    useEffect(() => { if (atmoFace) atmoFace.mat.uniforms.uSel.value = atmoSelected ? 1 : 0; }, [atmoFace, atmoSelected]);

    // Lớp đang chọn + bán kính giữa dải của nó — cho điểm neo đường chỉ dẫn
    const selectedIdx = atmoSelected ? body.layers.length : body.layers.findIndex(l => l.id === selectedLayerId);
    const anchorR = atmoSelected
        ? (1 + atmosphere!.heightFrac) / 2
        : selectedIdx >= 0
            ? ((selectedIdx === 0 ? 0 : body.layers[selectedIdx - 1].radiusFrac) + body.layers[selectedIdx].radiusFrac) / 2
            : 0;

    useFrame((state, delta) => {
        const root = rootRef.current;
        const spin = spinRef.current;
        const faceA = faceARef.current;
        const faceB = faceBRef.current;
        if (!root || !spin || !faceA || !faceB) return;

        const c = controls.current;
        const ease = (lambda: number) => 1 - Math.exp(-lambda * delta);

        // Chỉ tự xoay khi múi còn khép — mở ra rồi thì để trẻ tự xoay ngắm
        if (c.autoSpin && c.targetAngle < 0.05) c.targetRotY += delta * 0.07;
        cur.current.rotY += (c.targetRotY - cur.current.rotY) * ease(6);
        spin.rotation.y = cur.current.rotY;
        c.curRotY = cur.current.rotY;

        cur.current.angle += (c.targetAngle - cur.current.angle) * ease(7);
        let dC = c.targetCenter - cur.current.center;
        dC = Math.atan2(Math.sin(dC), Math.cos(dC)); // đường xoay ngắn nhất
        cur.current.center += dC * ease(7);

        // Múi = vùng azimuth LOCAL (fa, fb); mặt cắt là con của group spin nên chỉ cần
        // góc local, còn clipping plane nằm ở world space → quy đổi theo góc xoay.
        // LƯU Ý DẤU: rotation.y = θ biến azimuth local α thành world α − θ
        // (azimuth đo bằng atan2(z, x)) — cộng nhầm dấu là mặt cắt và múi khoét
        // xoay NGƯỢC chiều nhau, hở ruột thành các lưỡi liềm.
        // dist<0 cho CẢ 2 plane ⇔ nằm trong múi → bị clip
        const half = cur.current.angle / 2;
        const fa = cur.current.center - half;
        const fb = cur.current.center + half;
        const faW = fa - cur.current.rotY;
        const fbW = fb - cur.current.rotY;
        planes[0].normal.set(Math.sin(faW), 0, -Math.cos(faW));
        planes[1].normal.set(-Math.sin(fbW), 0, Math.cos(fbW));
        faceA.rotation.y = -fa;
        faceB.rotation.y = -fb;
        const open = cur.current.angle > 0.04;
        faceA.visible = open;
        faceB.visible = open;

        // --- Hiệu ứng mặt cắt ---
        const f = fx.current;
        if ((open && !f.prevOpen) || c.shake > f.prevShake + 0.5) {
            f.pulseT = 0; // vừa mở múi / vừa chém → sóng sáng chạy từ vỏ vào lõi
            if (c.shake > f.prevShake + 0.5) spawnSparks(sparks, cur.current.center - cur.current.rotY);
        }
        f.prevOpen = open;
        f.prevShake = c.shake;
        f.pulseT += delta;
        const pulseR = 1.02 - f.pulseT / 1.3;
        const pulseA = f.pulseT < 1.3 ? Math.sin(Math.PI * Math.min(1, f.pulseT / 1.3)) * 0.9 : 0;
        const t = state.clock.elapsedTime;
        mats.forEach((m, i) => {
            m.faceUniforms.uTime.value = t;
            m.faceUniforms.uPulseR.value = pulseR;
            m.faceUniforms.uPulseA.value = pulseA;
            // lớp đang chọn "nổi" lên khỏi mặt cắt, nhô vào khoảng trống của múi
            const lift = m.faceUniforms.uSel.value * 0.035;
            const a = faceA.children[i], b = faceB.children[i];
            if (a) a.position.z += (lift - a.position.z) * ease(10);
            if (b) b.position.z += (-lift - b.position.z) * ease(10);
        });
        updateSparks(sparks, sparksRef.current, delta);

        // Rung nhẹ toàn cục sau nhát chém
        if (c.shake > 0.001) {
            c.shake *= Math.exp(-6 * delta);
            root.position.x = Math.sin(state.clock.elapsedTime * 65) * 0.04 * c.shake;
        } else {
            root.position.x = 0;
        }

        // Neo đường chỉ dẫn: điểm giữa dải lớp đang chọn trên mặt cắt. Ưu tiên mặt
        // nằm về phía PHẢI màn hình (thẻ diễn giải nổi ở góc trái-dưới, tránh bị che);
        // nếu mặt đó quay lưng về camera thì rơi về mặt còn lại.
        if (atmoFace) atmoFace.mat.uniforms.uTime.value = state.clock.elapsedTime;
        const anchorVisible = atmoSelected ? atmoVisible : selectedIdx >= 0 && selectedIdx < visibleLayers;
        if (anchorVisible && cur.current.angle > 0.15) {
            faceA.updateWorldMatrix(true, false);
            faceB.updateWorldMatrix(true, false);
            _anchorA.set(anchorR * Math.cos(ANCHOR_PSI), anchorR * Math.sin(ANCHOR_PSI), 0);
            _anchorB.copy(_anchorA);
            faceA.localToWorld(_anchorA);
            faceB.localToWorld(_anchorB);
            // Ngưỡng "hướng về camera" phải TƯƠNG ĐỐI theo bán kính neo: lớp trong
            // cùng nằm sát trục nên z tuyệt đối luôn nhỏ — dùng ngưỡng cứng là line
            // của lõi không bao giờ hiện
            const zMin = Math.max(0.02, anchorR * 0.08);
            let p = _anchorA.x >= _anchorB.x ? _anchorA : _anchorB;
            if (p.z < zMin) p = p === _anchorA ? _anchorB : _anchorA;
            if (p.z > zMin) {
                p.project(state.camera);
                c.anchorX = (p.x * 0.5 + 0.5) * state.size.width;
                c.anchorY = (-p.y * 0.5 + 0.5) * state.size.height;
                c.anchorOn = true;
            } else {
                c.anchorOn = false; // cả 2 mặt cắt đều quay lưng — ẩn line
            }
        } else {
            c.anchorOn = false;
        }
    });

    // Chạm vào bề mặt cầu: nếu điểm chạm rơi vào vùng múi đã khoét (mesh bị clip,
    // mắt không thấy nhưng raycaster vẫn trúng) → NHƯỜNG sự kiện cho mặt cắt phía sau.
    // e.point ở world space → về local bằng CỘNG góc xoay (world = local − rotY).
    const handleSphereClick = (layerId: string) => (e: any) => {
        const p = e.point as THREE.Vector3;
        const phi = Math.atan2(p.z, p.x) + cur.current.rotY;
        let d = phi - cur.current.center;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        if (Math.abs(d) < cur.current.angle / 2 + 0.02) return;
        e.stopPropagation();
        if (e.delta < 8) onSelectLayer(layerId);
    };

    const handleFaceClick = (layerId: string) => (e: any) => {
        e.stopPropagation();
        if (e.delta < 8) onSelectLayer(layerId);
    };

    // Quầng: hành tinh đá dùng độ dày khí quyển của dữ liệu; Sao Thiên Vương/Hải Vương (lớp khí
    // ngoài cùng đã nằm trong layers) chỉ có quầng mỏng. Vỏ khí bị khoét CÙNG 2 mặt phẳng dao.
    const haloColor = ATMOSPHERE_COLORS[body.id];
    const showHalo = !!haloColor && peelCount === 0;

    return (
        <group ref={rootRef}>
            {showHalo && (
                <AtmosphereRim
                    radius={1}
                    thickness={atmosphere?.heightFrac ?? 1.05}
                    color={haloColor}
                    strength={body.id === 'mars' ? 0.35 : 0.55}
                    lightDir={[2.5, 3, 5]}
                    clippingPlanes={planes}
                />
            )}
            <points ref={sparksRef} geometry={sparks.geo} material={sparks.mat} frustumCulled={false} visible={false} />
            {/* Cầu lớp + mặt cắt cùng nằm trong group spin → xoay như một chỉnh thể */}
            <group ref={spinRef}>
                {body.layers.map((layer, i) => (
                    <mesh
                        key={layer.id}
                        geometry={DETAIL_SPHERE}
                        material={mats[i].sphereMat}
                        scale={layer.radiusFrac}
                        visible={i < visibleLayers}
                        onClick={handleSphereClick(layer.id)}
                    />
                ))}

                {/* 2 mặt cắt phẳng che kín múi — mỗi mặt gồm các bán khuyên xếp lớp */}
                <group ref={faceARef} visible={false}>
                    {body.layers.map((layer, i) => (
                        <mesh
                            key={layer.id}
                            geometry={faceGeos[i]}
                            material={mats[i].faceMat}
                            visible={i < visibleLayers}
                            onClick={handleFaceClick(layer.id)}
                        />
                    ))}
                    {atmosphere && atmoFace && (
                        <mesh
                            geometry={atmoFace.geo}
                            material={atmoFace.mat}
                            visible={atmoVisible}
                            renderOrder={3}
                            onClick={handleFaceClick(atmosphere.id)}
                        />
                    )}
                </group>
                <group ref={faceBRef} visible={false}>
                    {body.layers.map((layer, i) => (
                        <mesh
                            key={layer.id}
                            geometry={faceGeos[i]}
                            material={mats[i].faceMat}
                            visible={i < visibleLayers}
                            onClick={handleFaceClick(layer.id)}
                        />
                    ))}
                    {atmosphere && atmoFace && (
                        <mesh
                            geometry={atmoFace.geo}
                            material={atmoFace.mat}
                            visible={atmoVisible}
                            renderOrder={3}
                            onClick={handleFaceClick(atmosphere.id)}
                        />
                    )}
                </group>
            </group>
        </group>
    );
};

// ---------- Tia lửa khi chém ----------
interface Sparks {
    geo: THREE.BufferGeometry;
    mat: THREE.PointsMaterial;
    vel: Float32Array;
    life: number;
}

function createSparks(n: number): Sparks {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const mat = new THREE.PointsMaterial({
        map: getGlowTexture(), // hạt tròn mềm — thiếu map là PointsMaterial vẽ ô vuông
        size: 0.07,
        color: '#ffd28a',
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });
    return { geo, mat, vel: new Float32Array(n * 3), life: 0 };
}

// Phát tia lửa dọc theo đường chém (kinh tuyến ở phương vị world `az`, trên mặt cầu bán kính 1)
function spawnSparks(s: Sparks, az: number) {
    const pos = s.geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
        const lat = (Math.random() - 0.5) * Math.PI * 0.9;
        const x = Math.cos(lat) * Math.cos(az), y = Math.sin(lat), z = Math.cos(lat) * Math.sin(az);
        pos.setXYZ(i, x, y, z);
        const sp = 0.6 + Math.random() * 1.4;
        s.vel.set([x * sp + (Math.random() - 0.5) * 0.8, y * sp + Math.random() * 0.6, z * sp + (Math.random() - 0.5) * 0.8], i * 3);
    }
    pos.needsUpdate = true;
    s.life = 1;
}

function updateSparks(s: Sparks, points: THREE.Points | null, dt: number) {
    if (!points) return;
    if (s.life <= 0) { points.visible = false; return; }
    points.visible = true;
    s.life = Math.max(0, s.life - dt * 1.3);
    const pos = s.geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
        s.vel[i * 3 + 1] -= dt * 1.6; // rơi nhẹ
        pos.setXYZ(i, pos.getX(i) + s.vel[i * 3] * dt, pos.getY(i) + s.vel[i * 3 + 1] * dt, pos.getZ(i) + s.vel[i * 3 + 2] * dt);
    }
    pos.needsUpdate = true;
    s.mat.opacity = s.life;
}

// ---------- Mặt cắt bầu khí quyển ----------
// Dải bán khuyên từ mặt đất (r=1) ra mép khí quyển, TRONG MỜ: mật độ giảm theo hàm mũ khi lên cao
// (thang độ cao — không khí thật loãng dần), đậm sát mặt đất, tan dần vào vũ trụ. Vài gợn khí trôi
// nhẹ cho thấy đây là chất khí chứ không đặc như đá. Được chọn thì sáng lên.
function createAtmosphereFace(color: string, heightFrac: number) {
    const geo = new THREE.RingGeometry(1, heightFrac, 96, 8, -Math.PI / 2, Math.PI);
    const mat = new THREE.ShaderMaterial({
        uniforms: {
            uColor: { value: new THREE.Color(color) },
            uH: { value: heightFrac },
            uTime: { value: 0 },
            uSel: { value: 0 }
        },
        vertexShader: /* glsl */`
            varying vec2 vXY;
            void main() {
                vXY = position.xy;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: /* glsl */`
            uniform vec3 uColor;
            uniform float uH;
            uniform float uTime;
            uniform float uSel;
            varying vec2 vXY;
            ${GLSL_NOISE}
            void main() {
                float r = length(vXY);
                float h = clamp((r - 1.0) / (uH - 1.0), 0.0, 1.0);   // 0 = mặt đất, 1 = mép vũ trụ
                float density = exp(-h * 3.0) * (1.0 - smoothstep(0.8, 1.0, h));
                float wisps = snoise(vec3(vXY * vec2(3.0, 9.0), uTime * 0.15)) * 0.5 + 0.5;
                float a = density * (0.55 + 0.25 * wisps) * (0.85 + 0.35 * uSel);
                vec3 col = mix(uColor * 1.25, uColor * 0.7, h) + uColor * uSel * (0.25 + 0.15 * sin(uTime * 4.0));
                // vệt sáng mỏng sát mặt đất — ranh giới đất/khí
                col += vec3(1.0) * (1.0 - smoothstep(0.0, 0.04, h)) * 0.25;
                gl_FragColor = vec4(col, clamp(a, 0.0, 0.92));
                #include <tonemapping_fragment>
                #include <colorspace_fragment>
            }
        `,
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false
    });
    return { geo, mat };
}
