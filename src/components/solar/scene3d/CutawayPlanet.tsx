import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { CutawayBody } from '../../../data/planetLayersData';
import { DETAIL_SPHERE, texUrl } from './core';
import { getLayerTexture, layerKind } from './layerTextures';

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
                emissiveIntensity: isSun ? 0.6 : 0.15
            });
            return { sphereMat, faceMat, baseSphere: isSun ? 0.55 : 0, baseFace: isSun ? 0.6 : 0.15 };
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
            m.faceMat.emissiveIntensity = sel ? 0.85 : m.baseFace;
        });
    }, [selectedLayerId, body, mats]);

    const visibleLayers = body.layers.length - peelCount;

    // Lớp đang chọn + bán kính giữa dải của nó — cho điểm neo đường chỉ dẫn
    const selectedIdx = body.layers.findIndex(l => l.id === selectedLayerId);
    const anchorR = selectedIdx >= 0
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
        if (selectedIdx >= 0 && selectedIdx < visibleLayers && cur.current.angle > 0.15) {
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

    return (
        <group ref={rootRef}>
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
                </group>
            </group>
        </group>
    );
};
