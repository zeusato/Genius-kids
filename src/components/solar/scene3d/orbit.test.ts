import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { SOLAR_SYSTEM_DATA } from '../../../data/solarData';
import { orbitRadius, planetRadius, SUN_RADIUS } from './scale';
import { beltPose, heroPose, litFraction, orbitPoint, planFlight, sunPose } from './orbit';
import { createRandom } from './sceneParams';

const planets = SOLAR_SYSTEM_DATA.map((p) => ({
    id: p.id,
    d: orbitRadius(p.physical!.au),
    e: p.id === 'mercury' ? p.physical!.eccentricity : 0,
    r: planetRadius(p.physical!.diameterKm)
}));

describe('hướng quỹ đạo', () => {
    it('ngược chiều kim đồng hồ nhìn từ cực bắc (+Y), cùng chiều tự quay', () => {
        for (const p of planets) {
            const a = orbitPoint(p.d, p.e, 0.3);
            const b = orbitPoint(p.d, p.e, 0.4);
            // (a × b).y > 0 ⇔ quay ngược chiều kim đồng hồ nhìn từ +Y
            expect(a.z * b.x - a.x * b.z).toBeGreaterThan(0);
            // rotation.y dương cũng quay +X về −Z (ngược chiều kim đồng hồ) — cùng chiều
            const spun = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.1);
            expect(spun.z).toBeLessThan(0);
        }
    });

    it('Mặt Trời nằm ở tiêu điểm elip của Sao Thủy (cận nhật gần hơn viễn nhật)', () => {
        const m = planets.find((p) => p.id === 'mercury')!;
        const peri = orbitPoint(m.d, m.e, 0).length();
        const aph = orbitPoint(m.d, m.e, Math.PI).length();
        expect(peri).toBeLessThan(aph);
    });
});

describe('góc anh hùng khi tới nơi', () => {
    it('mọi vị trí quỹ đạo đều thấy 70–90% đĩa sáng', () => {
        const rnd = createRandom(7);
        for (const p of planets) {
            for (let i = 0; i < 200; i++) {
                const pos = orbitPoint(p.d, p.e, rnd() * Math.PI * 2);
                const cam = new THREE.Vector3((rnd() - 0.5) * 120, rnd() * 60, (rnd() - 0.5) * 120);
                const pose = heroPose(pos, p.r, { currentCamera: cam, phaseDeg: p.id === 'earth' ? 62 : 45 });
                const lit = litFraction(pose.target, pose.position);
                expect(lit).toBeGreaterThanOrEqual(0.7);
                expect(lit).toBeLessThanOrEqual(0.9);
            }
        }
    });

    it('Sao Thổ luôn được nhìn thấy vành mở mà vẫn đủ sáng', () => {
        const n = new THREE.Vector3(0, 1, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), -THREE.MathUtils.degToRad(26.7));
        const rnd = createRandom(3);
        for (let i = 0; i < 300; i++) {
            const pos = orbitPoint(27.75, 0, rnd() * Math.PI * 2);
            const cam = new THREE.Vector3((rnd() - 0.5) * 120, rnd() * 60, (rnd() - 0.5) * 120);
            const pose = heroPose(pos, 1.33, { ringNormal: n, currentCamera: cam });
            const dir = pose.position.clone().sub(pose.target).normalize();
            expect(Math.abs(dir.dot(n))).toBeGreaterThanOrEqual(0.36);
            expect(litFraction(pose.target, pose.position)).toBeGreaterThanOrEqual(0.68);
        }
    });
});

describe('đường bay', () => {
    const tourIds = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

    it('không bao giờ xuyên qua Mặt Trời giữa các chặng tour (Monte Carlo)', () => {
        const rnd = createRandom(42);
        const pos = new THREE.Vector3(), tgt = new THREE.Vector3();
        let worst = Infinity;
        for (let trial = 0; trial < 150; trial++) {
            let from = sunPose();
            const stops = tourIds.map((id) => {
                const p = planets.find((x) => x.id === id)!;
                return heroPose(orbitPoint(p.d, p.e, rnd() * Math.PI * 2), p.r);
            });
            stops.splice(4, 0, beltPose(rnd() * Math.PI * 2));
            for (const to of stops) {
                const plan = planFlight(from, to);
                for (let i = 0; i <= 100; i++) {
                    plan.sample(i / 100, pos, tgt);
                    worst = Math.min(worst, pos.length());
                }
                from = to;
            }
        }
        expect(worst).toBeGreaterThan(SUN_RADIUS * 1.3);
    }, 20000);

    it('thời lượng bay nằm trong 1,3–2,2 giây (reduced-motion ngắn hơn)', () => {
        const a = sunPose(), b = heroPose(orbitPoint(48, 0, 1), 0.9);
        const plan = planFlight(a, b);
        expect(plan.duration).toBeGreaterThanOrEqual(1.3);
        expect(plan.duration).toBeLessThanOrEqual(2.2);
        expect(planFlight(a, b, { reducedMotion: true }).duration).toBeLessThan(0.5);
    });

    it('đi đúng điểm đầu và điểm cuối', () => {
        const a = sunPose(), b = heroPose(orbitPoint(20, 0, 2), 1.4);
        const plan = planFlight(a, b);
        const pos = new THREE.Vector3(), tgt = new THREE.Vector3();
        plan.sample(0, pos, tgt);
        expect(pos.distanceTo(a.position)).toBeLessThan(1e-6);
        plan.sample(1, pos, tgt);
        expect(pos.distanceTo(b.position)).toBeLessThan(1e-6);
        expect(tgt.distanceTo(b.target)).toBeLessThan(1e-6);
    });
});
