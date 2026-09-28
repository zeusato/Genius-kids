import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { createRandom, randomDirection } from './noise';
import { bakedShell } from './geo';
import { createOrganicMaterial, useDisposable } from './materials';
import type { QualityTier } from './params';

interface TissueProps {
    cellId: string;
    tier: QualityTier;
    heroReady: boolean;   // tế bào chi tiết ở giữa đã biên dịch xong → bỏ bản "đóng thế" ở tâm
    viewFrom: [number, number, number];
    visible: boolean;     // luôn mount (để shader được biên dịch sẵn cùng tế bào), chỉ hiện khi lặn
}

interface Inst { p: THREE.Vector3; q: THREE.Quaternion; s: THREE.Vector3; phase: number; hero: boolean }

// Mô nhiều tế bào cho cảnh "lặn" (Powers of Ten): nhìn qua kính thấy cả mô → lao vào tế bào ở
// giữa. Instanced + vật liệu Standard đơn giản (2–3 draw call), mờ dần khi camera tới gần.
export const Tissue: React.FC<TissueProps> = ({ cellId, tier, heroReady, viewFrom, visible }) => {
    const bodyRef = useRef<THREE.InstancedMesh>(null);
    const coreRef = useRef<THREE.InstancedMesh>(null);
    const dotRef = useRef<THREE.InstancedMesh>(null);

    const layout = useMemo(() => {
        const rand = createRandom(`tissue-${cellId}`);
        const cells: Inst[] = [];
        const dots: THREE.Matrix4[] = [];
        const view = new THREE.Vector3(...viewFrom).normalize();
        const qFace = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), view);
        const up = new THREE.Vector3(0, 1, 0);
        if (cellId === 'plant') {
            // lớp biểu bì lá: tế bào hình hộp xếp như gạch, mỗi ô lấm tấm lục lạp
            for (let row = -4; row <= 4; row++) {
                for (let col = -4; col <= 4; col++) {
                    const x = col * 6.25 + (row % 2 ? 3.1 : 0);
                    const y = row * 4.45;
                    const p = new THREE.Vector3(x, y, 0).applyQuaternion(qFace);
                    const hero = row === 0 && col === 0;
                    cells.push({ p, q: qFace.clone(), s: new THREE.Vector3(1, 1, 1).multiplyScalar(hero ? 1 : 0.96 + rand() * 0.06), phase: rand() * 6.28, hero });
                    for (let k = 0; k < 11; k++) {
                        const lx = (rand() - 0.5) * 4.6, ly = (rand() - 0.5) * 3.0, lz = (rand() > 0.5 ? 1 : -1) * (1.2 + rand() * 0.4);
                        const dp = new THREE.Vector3(x + lx, y + ly, lz).applyQuaternion(qFace);
                        dots.push(new THREE.Matrix4().compose(dp, new THREE.Quaternion(), new THREE.Vector3(0.34, 0.22, 0.28)));
                    }
                }
            }
        } else if (cellId === 'bacteria') {
            // giọt nước: vi khuẩn bơi tứ tung
            let guard = 0;
            cells.push({ p: new THREE.Vector3(), q: new THREE.Quaternion(), s: new THREE.Vector3(1, 1, 1), phase: 0, hero: true });
            while (cells.length < (tier === 'high' ? 80 : 45) && guard++ < 4000) {
                const [dx, dy, dz] = randomDirection(rand);
                const r = 5 + rand() * 20;
                const p = new THREE.Vector3(dx, dy * 0.7, dz).multiplyScalar(r);
                if (cells.some((c) => c.p.distanceTo(p) < 4.2)) continue;
                const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), new THREE.Vector3(...randomDirection(rand)));
                cells.push({ p, q, s: new THREE.Vector3(1, 1, 1).multiplyScalar(0.8 + rand() * 0.35), phase: rand() * 6.28, hero: false });
            }
        } else {
            // mô động vật: 2 lớp tế bào tròn xếp tổ ong, lớp sau lệch nửa ô
            for (let layer = 0; layer < 2; layer++) {
                for (let row = -4; row <= 4; row++) {
                    for (let col = -4; col <= 4; col++) {
                        const x = col * 4.9 + (row % 2 ? 2.45 : 0) + layer * 2.45;
                        const y = row * 4.25 + layer * 1.4;
                        if (Math.hypot(x, y) > 21) continue;
                        const hero = layer === 0 && row === 0 && col === 0;
                        const p = new THREE.Vector3(x + (hero ? 0 : (rand() - 0.5) * 0.6), y + (hero ? 0 : (rand() - 0.5) * 0.6), -layer * 4.6).applyQuaternion(qFace);
                        const k = hero ? 1 : 0.9 + rand() * 0.16;
                        cells.push({ p, q: new THREE.Quaternion().setFromAxisAngle(up, rand() * 6.28), s: new THREE.Vector3(k, k * (0.92 + rand() * 0.1), k), phase: rand() * 6.28, hero });
                    }
                }
            }
        }
        return { cells, dots };
    }, [cellId, tier, viewFrom]);

    const geo = useMemo(() => {
        if (cellId === 'plant') return bakedShell({ half: [3.0, 2.1, 1.95], exp: 5 }, 32, 24);
        if (cellId === 'bacteria') return bakedShell({ half: [2.5, 1.02, 1.02], exp: 3.2, round: true }, 32, 20);
        return bakedShell({ half: [2.45, 2.28, 2.36], exp: 2 }, 32, 24);
    }, [cellId]);
    const coreGeo = useMemo(() => new THREE.SphereGeometry(1, 20, 14), []);
    const palette = cellId === 'plant'
        ? { body: '#65a30d', core: '#a855f7', dot: '#16a34a' }
        : cellId === 'bacteria'
            ? { body: '#fb923c', core: '#f59e0b', dot: '#f59e0b' }
            : { body: '#7dd3fc', core: '#a855f7', dot: '#a855f7' };
    const bodyMat = useMemo(() => createOrganicMaterial({
        color: palette.body, roughness: 0.3, emissive: palette.body, emissiveIntensity: 0.18,
        jelly: { center: cellId === 'plant' ? 0.35 : 0.22, edge: 0.95, power: 2 }
    }, tier).material, [palette.body, cellId, tier]);
    // transparent NGAY TỪ ĐẦU (depthWrite vẫn bật): đổi opaque→transparent giữa chừng là đổi program
    // (#define OPAQUE) → biên dịch lại đồng bộ ngay giữa cảnh lặn (đo được: khựng ~1,7 s)
    const coreMat = useMemo(() => createOrganicMaterial({ color: palette.core, roughness: 0.4, emissive: palette.core, emissiveIntensity: 0.35, transparent: true, depthWrite: true }, tier).material, [palette.core, tier]);
    const dotMat = useMemo(() => createOrganicMaterial({ color: palette.dot, roughness: 0.4, emissive: palette.dot, emissiveIntensity: 0.4, transparent: true, depthWrite: true }, tier).material, [palette.dot, tier]);
    useDisposable(geo, coreGeo, bodyMat, coreMat, dotMat);

    const tmp = useMemo(() => ({ m: new THREE.Matrix4(), p: new THREE.Vector3(), q: new THREE.Quaternion(), s: new THREE.Vector3(), a: new THREE.Vector3(1, 0, 0) }), []);

    const writeMatrices = (t: number) => {
        const body = bodyRef.current, core = coreRef.current;
        if (!body || !core) return;
        layout.cells.forEach((c, i) => {
            tmp.p.copy(c.p);
            if (cellId === 'bacteria' && !c.hero) {
                // bơi dọc trục thân + lắc nhẹ
                tmp.a.set(1, 0, 0).applyQuaternion(c.q);
                tmp.p.addScaledVector(tmp.a, Math.sin(t * 0.4 + c.phase) * 1.2);
            }
            const hide = c.hero && heroReady ? 0 : 1; // tế bào thật đã sẵn sàng → bỏ bản đóng thế
            tmp.s.copy(c.s).multiplyScalar(hide);
            tmp.m.compose(tmp.p, c.q, tmp.s);
            body.setMatrixAt(i, tmp.m);
            // nhân / vùng nhân lệch tâm một chút
            const cs = cellId === 'plant' ? 0.5 : cellId === 'bacteria' ? 0.5 : 0.82;
            tmp.s.set(cs, cellId === 'bacteria' ? 0.32 : cs, cellId === 'bacteria' ? 0.32 : cs).multiplyScalar(hide * c.s.x);
            tmp.q.copy(c.q);
            tmp.m.compose(tmp.p, tmp.q, tmp.s);
            core.setMatrixAt(i, tmp.m);
        });
        body.instanceMatrix.needsUpdate = true;
        core.instanceMatrix.needsUpdate = true;
    };

    useEffect(() => {
        writeMatrices(0);
        const d = dotRef.current;
        if (d) {
            layout.dots.forEach((m, i) => d.setMatrixAt(i, m));
            d.instanceMatrix.needsUpdate = true;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layout, heroReady]);

    // mờ dần khi camera lao vào gần (tế bào chi tiết thay chỗ)
    useFrame(({ camera, clock }) => {
        if (!visible) return;
        const dist = camera.position.length();
        const k = THREE.MathUtils.smoothstep(dist, 11, 22);
        (bodyMat as THREE.MeshStandardMaterial).opacity = k;
        coreMat.opacity = k;
        dotMat.opacity = k;
        if (cellId === 'bacteria') writeMatrices(clock.elapsedTime);
    });

    return (
        <group visible={visible}>
            <instancedMesh ref={coreRef} args={[coreGeo, coreMat, layout.cells.length]} frustumCulled={false} raycast={() => null} />
            {layout.dots.length > 0 && (
                <instancedMesh ref={dotRef} args={[coreGeo, dotMat, layout.dots.length]} frustumCulled={false} raycast={() => null} />
            )}
            <instancedMesh ref={bodyRef} args={[geo, bodyMat, layout.cells.length]} frustumCulled={false} raycast={() => null} renderOrder={2} />
        </group>
    );
};
