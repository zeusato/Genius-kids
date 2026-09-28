import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { TimelineState, useCellCtx } from '../cellContext';
import { createCutUniforms, createWaves, ShellState } from '../shell';
import { ShellLayer, ShellLayerSpec, useCutWindow } from '../ShellLayer';
import { createFx, createOrganicMaterial, useDisposable } from '../materials';
import { createNoise3, createRandom, fibonacciSphere } from '../noise';
import { colorize, merge, randomWalkInSphere, tubeThrough } from '../geo';
import { centrioleGeometry } from '../organelles/Centrosome';
import { channelProteinGeometry, glycoproteinGeometry } from '../organelles/shared';
import { ANIMAL_HALF, ANIMAL_THICK } from '../cells/layouts';
import { MITOSIS_DURATION } from '../../../../data/mitosisStages';

// === Thí nghiệm "Phân chia tế bào" (nguyên phân) ===
// Dòng thời gian t 0..1 (UI tua/phát). Mọi chuyển động tính thẳng từ t → tua tới/lui đều đúng.
//  - màng: vỏ hướng tâm dài ra theo trục x rồi THẮT EO (uPinch của shell.ts) → hai tế bào con
//  - nhiễm sắc thể: 4 cặp (hồng = từ mẹ, xanh = từ bố), mỗi chiếc 2 nhiễm sắc tử bắt chéo hình X
//  - thoi phân bào: sợi sáng từ 2 trung thể móc vào tâm động từng nhiễm sắc thể

const sstep = (a: number, b: number, x: number) => {
    const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return k * k * (3 - 2 * k);
};

interface Chromosome {
    len: number;
    color: THREE.Color;
    start: THREE.Vector3;     // vị trí lúc mới co xoắn (trong vùng nhân cũ)
    plate: THREE.Vector3;     // vị trí xếp hàng trên mặt phẳng xích đạo (x = 0)
    tilt: number;             // nghiêng nhẹ cho tự nhiên
    spin: number;
}

const CHROMATID = new THREE.CapsuleGeometry(0.075, 1, 4, 12);

export const Mitosis: React.FC<{ state: TimelineState }> = ({ state }) => {
    const { tier, registry, onSelect } = useCellCtx();
    const groupRef = useRef<THREE.Group>(null);
    const cut = useMemo(() => createCutUniforms([3.0, ANIMAL_HALF[1], ANIMAL_HALF[2]]), []);
    const open = useRef(0.95);
    useCutWindow(cut, groupRef, open);

    const membrane = useMemo<ShellLayerSpec>(() => {
        const st: ShellState = {
            shape: { half: [...ANIMAL_HALF], exp: 2 },
            waves: createWaves('mitosis-membrane', { freq: 1.5, speed: 0.4 }),
            amp: 0.03, pinch: 0, pinchWidth: 0.32
        };
        const rand = createRandom('mitosis-proteins');
        const dirs = fibonacciSphere(tier === 'high' ? 220 : 110, 1.4, rand);
        return {
            id: 'plasma_membrane',
            state: st,
            thickness: ANIMAL_THICK,
            outer: {
                physical: true, color: '#56c3f2', roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.18,
                sheen: 0.25, sheenColor: '#e0f2fe', iridescence: 1, iridescenceIOR: 1.35, iridescenceThicknessRange: [220, 680],
                emissive: '#0284c7', emissiveIntensity: 0.08, surface: { mode: 'lipid', scale: 30, color2: '#dff6ff', strength: 0.35 }
            },
            inner: {
                color: '#2c9fb0', roughness: 0.85, clearcoat: 0, emissive: '#0e6f86', emissiveIntensity: 0.22,
                surface: { mode: 'water', scale: 2.1, color2: '#a5f3fc', strength: 0.16 }
            },
            band: { mode: 'bilayer', a: '#7dd3fc', b: '#fde68a', c: '#0c4a6e' },
            cutGlow: { color: '#a5f3fc', strength: 0.7 },
            proteins: [
                { geometry: channelProteinGeometry('#f472b6', '#f9a8d4'), dirs: dirs.filter((_, i) => i % 2 === 0), lift: -ANIMAL_THICK * 0.4, scale: () => 0.05, material: { emissive: '#ec4899', emissiveIntensity: 0.2 } },
                { geometry: glycoproteinGeometry('#34d399', '#fde047'), dirs: dirs.filter((_, i) => i % 2 === 1), lift: 0.004, scale: () => 0.045, material: { emissive: '#a3e635', emissiveIntensity: 0.22 } }
            ]
        };
    }, [tier]);

    const chromosomes = useMemo<Chromosome[]>(() => {
        const rand = createRandom('mitosis-chromosomes');
        const lens = [0.62, 0.62, 0.52, 0.52, 0.42, 0.42, 0.34, 0.34];
        const mom = new THREE.Color('#f472b6'), dad = new THREE.Color('#60a5fa');
        // mặt phẳng xích đạo nhìn NGANG từ camera → xếp thành một hàng dọc như hình kỳ giữa trong SGK
        const order = [0, 3, 5, 6, 1, 2, 7, 4];
        return lens.map((len, i) => {
            const slot = order[i];
            return {
                len,
                color: (i % 2 ? dad : mom).clone(),
                start: new THREE.Vector3((rand() - 0.5) * 0.8, 0.1 + (rand() - 0.5) * 0.8, (rand() - 0.5) * 0.8),
                plate: new THREE.Vector3(0, -1.05 + slot * 0.3, (slot % 2 ? 0.14 : -0.14)),
                tilt: (rand() - 0.5) * 0.5,
                spin: rand() * Math.PI
            };
        });
    }, []);

    // Chất nhiễm sắc lúc chưa phân chia (tan dần khi cuộn thành nhiễm sắc thể)
    const chromatinGeo = useMemo(() => {
        const rand = createRandom('mitosis-chromatin');
        const noise = createNoise3('mitosis-chromatin');
        const parts: THREE.BufferGeometry[] = [];
        const pal = ['#f0abfc', '#f9a8d4', '#c4b5fd', '#e879f9'];
        for (let i = 0; i < 5; i++) {
            const start = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(0.7);
            const pts = randomWalkInSphere(rand, noise, start, 54, 0.045, new THREE.Vector3(), 0.6, i * 3.1);
            parts.push(colorize(tubeThrough(pts, 0.014, 150, 4), pal[i % pal.length]));
        }
        return merge(parts, ['position', 'normal', 'color']);
    }, []);

    const fx = useMemo(() => createFx('#ffffff'), []);
    const chromMat = useMemo(() => createOrganicMaterial({ color: '#ffffff', roughness: 0.35, clearcoat: 0.6, emissive: '#ffffff', emissiveIntensity: 0.25, fx }, tier).material, [tier, fx]);
    const centroMat = useMemo(() => createOrganicMaterial({ color: '#fde047', roughness: 0.35, emissive: '#facc15', emissiveIntensity: 0.5, fx }, tier).material, [tier, fx]);
    const chromatinMat = useMemo(() => createOrganicMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.4, emissive: '#d946ef', emissiveIntensity: 0.5, transparent: true, depthWrite: true, fx }, tier).material, [tier, fx]);
    const nucMat = useMemo(() => createOrganicMaterial({ color: '#a855f7', roughness: 0.25, emissive: '#7e22ce', emissiveIntensity: 0.2, jelly: { center: 0.12, edge: 0.75 }, fx }, tier).material, [tier, fx]);
    const newNucMat = useMemo(() => createOrganicMaterial({ color: '#a855f7', roughness: 0.25, emissive: '#7e22ce', emissiveIntensity: 0.25, jelly: { center: 0.18, edge: 0.85 }, fx }, tier).material, [tier, fx]);
    const lineMat = useMemo(() => new THREE.LineBasicMaterial({ color: new THREE.Color('#9ff7ff').multiplyScalar(1.6), transparent: true, opacity: 0, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }), []);
    const sphere = useMemo(() => new THREE.SphereGeometry(1, 40, 28), []);
    useDisposable(chromatinGeo, chromMat, centroMat, chromatinMat, nucMat, newNucMat, lineMat, sphere);

    // Thoi phân bào: 2 sợi / nhiễm sắc thể + 12 tia sao mỗi cực
    const ASTRAL = 12;
    const lineGeo = useMemo(() => {
        const g = new THREE.BufferGeometry();
        const n = (chromosomes.length * 2 + ASTRAL * 2) * 2;
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
        return g;
    }, [chromosomes.length]);
    useDisposable(lineGeo);
    const astralDirs = useMemo(() => fibonacciSphere(ASTRAL, 0.6, createRandom('astral')), []);

    const chromRef = useRef<THREE.InstancedMesh>(null);
    const centroL = useRef<THREE.Group>(null);
    const centroR = useRef<THREE.Group>(null);
    const oldNuc = useRef<THREE.Mesh>(null);
    const chromatin = useRef<THREE.Mesh>(null);
    const nucL = useRef<THREE.Mesh>(null);
    const nucR = useRef<THREE.Mesh>(null);

    useEffect(() => {
        const m = chromRef.current;
        if (!m) return;
        chromosomes.forEach((c, i) => {
            m.setColorAt(i * 2, c.color);
            m.setColorAt(i * 2 + 1, c.color);
        });
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }, [chromosomes]);

    const tmp = useMemo(() => ({
        m: new THREE.Matrix4(), q: new THREE.Quaternion(), qa: new THREE.Quaternion(), e: new THREE.Euler(),
        p: new THREE.Vector3(), s: new THREE.Vector3(), c: new THREE.Vector3(), poleL: new THREE.Vector3(), poleR: new THREE.Vector3()
    }), []);

    useFrame((_, delta) => {
        if (state.playing) {
            state.t = Math.min(1, state.t + Math.min(delta, 0.1) / MITOSIS_DURATION);
            if (state.t >= 1) state.playing = false;
        }
        const t = state.t;
        const grow = sstep(0, 0.12, t);
        const elong = sstep(0.46, 0.84, t);
        const pinch = sstep(0.64, 0.98, t);
        const kPro = sstep(0.14, 0.27, t);
        const kMeta = sstep(0.3, 0.44, t);
        const kAna = sstep(0.48, 0.63, t);
        const kTelo = sstep(0.66, 0.82, t);

        // màng: lớn lên → dài ra → thắt eo
        const g = 1 + 0.06 * grow;
        const half = membrane.state.shape.half;
        half[0] = ANIMAL_HALF[0] * g + 1.25 * elong;
        half[1] = ANIMAL_HALF[1] * g - 0.3 * elong;
        half[2] = ANIMAL_HALF[2] * g - 0.3 * elong;
        membrane.state.pinch = 0.975 * pinch;

        // hai cực (trung thể): tách nhau ở kỳ đầu, ra xa dần theo tế bào dài ra
        const poleX = 0.2 + 1.05 * sstep(0.15, 0.32, t) + 1.05 * elong;
        const poleY = 0.8 * (1 - sstep(0.15, 0.32, t));
        tmp.poleL.set(-poleX + 0.2 * (1 - sstep(0.15, 0.32, t)), poleY, 0);
        tmp.poleR.set(poleX, poleY, 0);
        centroL.current?.position.copy(tmp.poleL);
        centroR.current?.position.copy(tmp.poleR);

        // nhân cũ tan dần; 2 nhân mới hiện ở hai đầu
        const oldVis = 1 - kPro;
        if (oldNuc.current) { oldNuc.current.visible = oldVis > 0.01; (oldNuc.current.material as THREE.MeshStandardMaterial).opacity = oldVis; }
        if (chromatin.current) { chromatin.current.visible = oldVis > 0.01; chromatinMat.opacity = oldVis; }
        const newVis = kTelo;
        for (const [ref, sign] of [[nucL, -1], [nucR, 1]] as const) {
            const mesh = ref.current;
            if (!mesh) continue;
            mesh.visible = newVis > 0.01;
            mesh.position.set(sign * (poleX * 0.78), 0, 0);
            mesh.scale.setScalar(0.62 * (0.6 + 0.4 * newVis));
        }
        newNucMat.opacity = newVis;

        // nhiễm sắc thể
        const m = chromRef.current;
        if (m) {
            const size = (0.25 + 0.75 * kPro) * (1 - 0.6 * kTelo);
            chromosomes.forEach((c, i) => {
                tmp.c.lerpVectors(c.start, c.plate, kMeta);
                for (let s = 0; s < 2; s++) {
                    const sign = s === 0 ? -1 : 1;
                    // trước kỳ sau: 2 nhiễm sắc tử bắt chéo hình X, dính ở tâm động
                    const sep = 0.03 + (poleX * 0.72 - 0.03) * kAna;
                    tmp.p.set(
                        tmp.c.x + sign * sep,
                        tmp.c.y * (1 - 0.55 * kAna),
                        tmp.c.z * (1 - 0.55 * kAna)
                    );
                    // chữ X: nghiêng ±0,4 rad quanh trục nhìn; kỳ sau: bị kéo, ngả về phía cực
                    const xTilt = sign * 0.42 * (1 - kAna) + sign * 1.1 * kAna;
                    tmp.e.set(c.spin * (1 - kMeta), 0, c.tilt * (1 - kMeta) + xTilt);
                    tmp.q.setFromEuler(tmp.e);
                    tmp.s.set(size, c.len * size, size);
                    tmp.m.compose(tmp.p, tmp.q, tmp.s);
                    m.setMatrixAt(i * 2 + s, tmp.m);
                }
            });
            m.instanceMatrix.needsUpdate = true;
        }

        // thoi phân bào
        const fiber = sstep(0.18, 0.3, t) * (1 - sstep(0.7, 0.84, t));
        lineMat.opacity = fiber * 0.85;
        const pos = lineGeo.attributes.position.array as Float32Array;
        let k = 0;
        const put = (a: THREE.Vector3, b: THREE.Vector3) => {
            pos[k++] = a.x; pos[k++] = a.y; pos[k++] = a.z;
            pos[k++] = b.x; pos[k++] = b.y; pos[k++] = b.z;
        };
        const cen = new THREE.Vector3();
        chromosomes.forEach((c) => {
            tmp.c.lerpVectors(c.start, c.plate, kMeta);
            for (const sign of [-1, 1]) {
                const sep = 0.03 + (poleX * 0.72 - 0.03) * kAna;
                cen.set(tmp.c.x + sign * sep, tmp.c.y * (1 - 0.55 * kAna), tmp.c.z * (1 - 0.55 * kAna));
                put(sign < 0 ? tmp.poleL : tmp.poleR, cen);
            }
        });
        const tip = new THREE.Vector3();
        for (const [pole, sign] of [[tmp.poleL, -1], [tmp.poleR, 1]] as const) {
            astralDirs.forEach((d) => {
                tip.set(d[0] * 0.7 + sign * 0.35, d[1] * 0.7, d[2] * 0.7).add(pole);
                put(pole, tip);
            });
        }
        lineGeo.attributes.position.needsUpdate = true;
        lineGeo.computeBoundingSphere();
    });

    return (
        <group ref={groupRef}>
            <ShellLayer
                spec={membrane}
                cut={cut}
                tier={tier}
                focus="none"
                segments={tier === 'high' ? [128, 96] : [72, 54]}
                onSelect={onSelect}
                registry={registry}
                registerAs={null}
                interactive={false}
            />
            <mesh ref={oldNuc} geometry={sphere} material={nucMat} position={[0, 0.1, 0]} scale={0.82} renderOrder={2} raycast={() => null} />
            <mesh ref={chromatin} geometry={chromatinGeo} material={chromatinMat} position={[0, 0.1, 0]} raycast={() => null} />
            <mesh ref={nucL} geometry={sphere} material={newNucMat} renderOrder={2} raycast={() => null} />
            <mesh ref={nucR} geometry={sphere} material={newNucMat} renderOrder={2} raycast={() => null} />
            <instancedMesh ref={chromRef} args={[CHROMATID, chromMat, chromosomes.length * 2]} frustumCulled={false} raycast={() => null} />
            <lineSegments geometry={lineGeo} material={lineMat} frustumCulled={false} raycast={() => null} />
            {[centroL, centroR].map((r, i) => (
                <group key={i} ref={r} scale={0.8}>
                    <mesh geometry={centrioleGeometry()} material={centroMat} raycast={() => null} />
                    <mesh geometry={centrioleGeometry()} material={centroMat} rotation={[0, 0, Math.PI / 2]} position={[0.2, 0.22, 0.02]} raycast={() => null} />
                </group>
            ))}
        </group>
    );
};
