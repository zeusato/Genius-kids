import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { BodyRegistry } from './core';
import { createRandom } from './noise';
import { getSoftDotTexture } from './materials';

// === "Bào quan đang làm việc" — hạt minh họa công việc khi thẻ của bào quan đang mở ===
// Nguyên tắc The Inner Life of the Cell: cho thấy bào quan LÀM GÌ, không chỉ tên gọi.
//   burst : bắn ra từ bề mặt (nhân tiễn ARN qua lỗ nhân, ty thể toả ATP, Golgi gửi túi hàng)
//   rise  : nổi lên (lục lạp nhả bọt ôxi)
//   suck  : bị hút vào rồi biến mất (tiêu thể "ăn" rác, không bào hút nước)
//   orbit : chạy vòng quanh (vùng nhân / plasmid: ADN hoạt động)
//   pass  : đi xuyên qua màng từ ngoài vào trong (màng chọn lọc cho chất đi qua)
type Kind = 'burst' | 'rise' | 'suck' | 'orbit' | 'pass';

interface FxSpec {
    kind: Kind;
    color: string;
    size: number;     // world units
    count: number;
    speed: number;    // world units / s
    life: number;     // s
    reach?: number;   // hệ số bán kính (spawn / đích)
}

const SPECS: Record<string, FxSpec> = {
    nucleus: { kind: 'burst', color: '#ff7ad9', size: 0.045, count: 18, speed: 0.32, life: 2.4, reach: 1 },
    mitochondria: { kind: 'burst', color: '#fff27a', size: 0.035, count: 28, speed: 0.55, life: 1.1, reach: 0.9 },
    golgi: { kind: 'burst', color: '#ffc27a', size: 0.05, count: 10, speed: 0.22, life: 3.2, reach: 0.9 },
    er: { kind: 'burst', color: '#ffa3d4', size: 0.03, count: 20, speed: 0.2, life: 2.2, reach: 0.8 },
    ribosome: { kind: 'orbit', color: '#e9c2ff', size: 0.02, count: 16, speed: 0.4, life: 2.5, reach: 2.4 },
    lysosome: { kind: 'suck', color: '#a3b8cc', size: 0.035, count: 14, speed: 0.22, life: 2.2, reach: 3.2 },
    chloroplast: { kind: 'rise', color: '#e6fbff', size: 0.05, count: 20, speed: 0.28, life: 2.6, reach: 1 },
    vacuole: { kind: 'suck', color: '#7dd3fc', size: 0.05, count: 22, speed: 0.35, life: 2.4, reach: 1.35 },
    plasma_membrane: { kind: 'pass', color: '#bff4ff', size: 0.04, count: 26, speed: 0.4, life: 2.4, reach: 1 },
    nucleoid: { kind: 'orbit', color: '#ffd166', size: 0.03, count: 20, speed: 0.6, life: 3, reach: 1.1 },
    plasmid: { kind: 'orbit', color: '#fff3b0', size: 0.025, count: 10, speed: 0.8, life: 2, reach: 1.6 },
    centrosome: { kind: 'burst', color: '#fff6a8', size: 0.03, count: 20, speed: 0.6, life: 1.6, reach: 0.7 },
    cytoskeleton: { kind: 'burst', color: '#a5f3fc', size: 0.025, count: 24, speed: 0.8, life: 1.8, reach: 0.4 }
};

interface Particle {
    age: number;
    life: number;
    p: THREE.Vector3;
    v: THREE.Vector3;
    axis: THREE.Vector3;
    phase: number;
    alive: boolean;
}

const MAX = 32;

export const WorkFx: React.FC<{ working: string | null; registry: React.MutableRefObject<BodyRegistry> }> = ({ working, registry }) => {
    const spec = working ? SPECS[working] : undefined;
    const ref = useRef<THREE.InstancedMesh>(null);
    const rand = useMemo(() => createRandom('workfx'), []);
    const parts = useMemo<Particle[]>(() => Array.from({ length: MAX }, () => ({
        age: 0, life: 1, p: new THREE.Vector3(), v: new THREE.Vector3(), axis: new THREE.Vector3(0, 1, 0), phase: 0, alive: false
    })), []);
    const material = useMemo(() => new THREE.MeshBasicMaterial({
        color: '#ffffff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
        map: getSoftDotTexture()
    }), []);
    const geo = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
    const tmp = useMemo(() => ({ c: new THREE.Vector3(), m: new THREE.Matrix4(), q: new THREE.Quaternion(), s: new THREE.Vector3(), d: new THREE.Vector3(), w: new THREE.Vector3() }), []);
    const spawnTimer = useRef(0);
    const lastId = useRef<string | null>(null);

    const dir = (out: THREE.Vector3) => {
        const z = rand() * 2 - 1, a = rand() * Math.PI * 2, r = Math.sqrt(1 - z * z);
        return out.set(Math.cos(a) * r, Math.sin(a) * r, z);
    };

    const spawn = (pt: Particle, s: FxSpec, center: THREE.Vector3, radius: number) => {
        pt.alive = true;
        pt.age = 0;
        pt.life = s.life * (0.7 + rand() * 0.6);
        pt.phase = rand() * Math.PI * 2;
        const reach = s.reach ?? 1;
        dir(tmp.d);
        switch (s.kind) {
            case 'burst':
                pt.p.copy(center).addScaledVector(tmp.d, radius * reach);
                pt.v.copy(tmp.d).multiplyScalar(s.speed * (0.6 + rand() * 0.8));
                break;
            case 'rise':
                pt.p.copy(center).addScaledVector(tmp.d, radius * 0.6);
                pt.v.set((rand() - 0.5) * 0.08, s.speed * (0.7 + rand() * 0.6), (rand() - 0.5) * 0.08);
                break;
            case 'suck':
                pt.p.copy(center).addScaledVector(tmp.d, radius * reach);
                pt.v.copy(tmp.d).multiplyScalar(-s.speed * (0.7 + rand() * 0.6));
                break;
            case 'orbit':
                pt.axis.copy(tmp.d);
                pt.p.copy(center);
                pt.v.set(radius * reach * (0.5 + rand() * 0.5), 0, 0); // v.x = bán kính quỹ đạo
                break;
            case 'pass':
                // từ ngoài màng đi thẳng vào trong (qua kênh protein)
                pt.p.copy(center).addScaledVector(tmp.d, radius * 1.18);
                pt.v.copy(tmp.d).multiplyScalar(-s.speed);
                break;
        }
    };

    useFrame(({ camera }, delta) => {
        const mesh = ref.current;
        if (!mesh) return;
        const dt = Math.min(delta, 0.1);
        const entry = working ? registry.current[working] : undefined;
        if (working !== lastId.current) {
            lastId.current = working;
            parts.forEach((pt) => { pt.alive = false; });
            spawnTimer.current = 0;
            if (spec) material.color.set(spec.color).multiplyScalar(2.2); // HDR → bloom toả sáng
        }
        if (!spec || !entry) {
            if (mesh.count !== 0) mesh.count = 0;
            return;
        }
        entry.object.getWorldPosition(tmp.c);
        const radius = entry.radius;
        // sinh hạt đều đặn
        spawnTimer.current += dt;
        const every = spec.life / spec.count;
        while (spawnTimer.current > every) {
            spawnTimer.current -= every;
            const free = parts.find((p) => !p.alive);
            if (free) spawn(free, spec, tmp.c, radius);
        }
        let n = 0;
        tmp.q.copy(camera.quaternion); // hạt luôn quay mặt về camera (billboard)
        for (const pt of parts) {
            if (!pt.alive) continue;
            pt.age += dt;
            if (pt.age >= pt.life) { pt.alive = false; continue; }
            const k = pt.age / pt.life;
            if (spec.kind === 'orbit') {
                const ang = pt.phase + pt.age * spec.speed * 3;
                const u = tmp.d.set(0, 1, 0).cross(pt.axis);
                if (u.lengthSq() < 1e-4) u.set(1, 0, 0);
                u.normalize();
                const w = tmp.w.crossVectors(pt.axis, u);
                pt.p.copy(tmp.c).addScaledVector(u, Math.cos(ang) * pt.v.x).addScaledVector(w, Math.sin(ang) * pt.v.x);
            } else {
                pt.p.addScaledVector(pt.v, dt);
                if (spec.kind === 'rise') pt.p.x += Math.sin(pt.age * 3 + pt.phase) * dt * 0.05;
            }
            // mờ vào / mờ ra; hạt bị "hút" co lại khi tới đích
            const fade = Math.min(1, k * 6) * Math.min(1, (1 - k) * 4);
            const size = spec.size * (spec.kind === 'suck' ? 1.2 - k : 1) * (0.6 + 0.4 * fade) * 2.4;
            tmp.s.set(size, size, size);
            tmp.m.compose(pt.p, tmp.q, tmp.s);
            mesh.setMatrixAt(n, tmp.m);
            n++;
        }
        mesh.count = n;
        mesh.instanceMatrix.needsUpdate = true;
    });

    return <instancedMesh ref={ref} args={[geo, material, MAX]} frustumCulled={false} raycast={() => null} renderOrder={10} />;
};
