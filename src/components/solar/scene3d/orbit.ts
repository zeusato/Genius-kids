import * as THREE from 'three';
import { BELT_CENTER, SUN_RADIUS, scenePeriodSeconds } from './scale';
import { initialPhase } from './sceneParams';

// Toán quỹ đạo + camera THUẦN (không React) — test được bằng vitest.
//
// Quy ước hướng: trục +Y là phía BẮC (texture hành tinh đặt cực bắc ở +Y). Nhìn từ bắc xuống,
// mọi hành tinh quay quanh Mặt Trời NGƯỢC chiều kim đồng hồ (+X → −Z), cùng chiều tự quay
// (rotation.y dương) — đúng thực tế. α đo từ +X ngược chiều kim đồng hồ = kinh độ hoàng đạo.

const UP = new THREE.Vector3(0, 1, 0);

// Điểm trên quỹ đạo elip bán trục lớn d, tâm sai e, Mặt Trời ở tiêu điểm (gốc tọa độ)
export function orbitPoint(d: number, e: number, alpha: number, out = new THREE.Vector3()): THREE.Vector3 {
    const b = d * Math.sqrt(1 - e * e);
    return out.set(Math.cos(alpha) * d - d * e, 0, -Math.sin(alpha) * b);
}

// Góc quỹ đạo hiện tại của hành tinh theo đồng hồ mô phỏng
export function orbitAngle(id: string, periodYears: number, t: number): number {
    return initialPhase(id) + t * ((2 * Math.PI) / scenePeriodSeconds(periodYears));
}

// Phần trăm đĩa hành tinh được chiếu sáng nhìn từ camera (Mặt Trời ở gốc)
export function litFraction(planetPos: THREE.Vector3, cameraPos: THREE.Vector3): number {
    const toSun = planetPos.clone().multiplyScalar(-1).normalize();
    const toCam = cameraPos.clone().sub(planetPos).normalize();
    return (1 + toSun.dot(toCam)) / 2;
}

export interface CameraPose {
    position: THREE.Vector3;
    target: THREE.Vector3;
}

export interface HeroPoseOptions {
    // góc lệch (ngang) so với hướng Mặt Trời: 0° = sau lưng camera là Mặt Trời (đĩa sáng tròn,
    // phẳng), 90° = nửa sáng nửa tối. ~45° cho khối 3D rõ + lằn ranh ngày/đêm đẹp nhất.
    phaseDeg?: number;
    elevationDeg?: number;
    currentCamera?: THREE.Vector3; // chọn phía (trái/phải) gần camera hiện tại → bay ngắn hơn
    ringNormal?: THREE.Vector3;    // hành tinh có vành: luôn nhìn vành "mở" (không nhìn cạnh)
    distanceScale?: number;
}

export function heroDistance(radius: number): number {
    return Math.max(radius * 6.5, 3.2);
}

// Góc "anh hùng" khi bay tới hành tinh: đặt camera theo hướng Mặt Trời thay vì offset cố định
// (offset cố định cho ra lưỡi liềm tối om ở ~1/3 vị trí quỹ đạo).
export function heroPose(planetPos: THREE.Vector3, radius: number, opts: HeroPoseOptions = {}): CameraPose {
    const phase = THREE.MathUtils.degToRad(opts.phaseDeg ?? 45);
    let elev = THREE.MathUtils.degToRad(opts.elevationDeg ?? 20);

    const toSun = new THREE.Vector3(-planetPos.x, 0, -planetPos.z);
    if (toSun.lengthSq() < 1e-6) toSun.set(0, 0, 1);
    toSun.normalize();

    const left = toSun.clone().applyAxisAngle(UP, phase);
    const right = toSun.clone().applyAxisAngle(UP, -phase);
    let horiz = left;
    if (opts.currentCamera) {
        const cur = opts.currentCamera.clone().sub(planetPos).setY(0).normalize();
        horiz = cur.dot(right) > cur.dot(left) ? right : left;
    }

    const dir = new THREE.Vector3();
    const build = () => dir.copy(horiz).multiplyScalar(Math.cos(elev)).addScaledVector(UP, Math.sin(elev)).normalize();
    build();
    if (opts.ringNormal) {
        const n = opts.ringNormal.clone().normalize();
        while (Math.abs(dir.dot(n)) < 0.38 && elev < THREE.MathUtils.degToRad(60)) {
            elev += THREE.MathUtils.degToRad(4);
            build();
        }
    }

    const dist = heroDistance(radius) * (opts.distanceScale ?? 1);
    return {
        position: planetPos.clone().addScaledVector(dir, dist),
        target: planetPos.clone()
    };
}

// Góc nhìn Mặt Trời: giữ hướng hiện tại của camera (nếu có) nhưng luôn nghiêng ≥18° trên mặt phẳng quỹ đạo
export function sunPose(currentCamera?: THREE.Vector3): CameraPose {
    const dir = currentCamera && currentCamera.lengthSq() > 1e-6
        ? currentCamera.clone().normalize()
        : new THREE.Vector3(0.45, 0.4, 0.85).normalize();
    const minY = Math.sin(THREE.MathUtils.degToRad(18));
    if (dir.y < minY) {
        const h = new THREE.Vector3(dir.x, 0, dir.z);
        if (h.lengthSq() < 1e-6) h.set(0, 0, 1);
        h.normalize().multiplyScalar(Math.cos(Math.asin(minY)));
        dir.set(h.x, minY, h.z);
    }
    return { position: dir.multiplyScalar(SUN_RADIUS * 6), target: new THREE.Vector3() };
}

// Góc nhìn "lướt giữa vành đai tiểu hành tinh": camera nằm trong vành, nhìn dọc theo chiều quay
export function beltPose(azimuth: number): CameraPose {
    const at = (a: number, y: number) => new THREE.Vector3(Math.cos(a) * BELT_CENTER, y, -Math.sin(a) * BELT_CENTER);
    return { position: at(azimuth, 0.55), target: at(azimuth + 0.55, 0.05) };
}

export function azimuthOf(v: THREE.Vector3): number {
    return Math.atan2(-v.z, v.x);
}

const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

export interface FlightPlan {
    duration: number; // giây
    sample: (s: number, outPos: THREE.Vector3, outTarget: THREE.Vector3) => void; // s ∈ [0,1] thời gian
    minSunDistance: number;
}

// Đường bay có kiểm soát: thời lượng cố định (thay damping đuôi dài 3–5s của camera-controls)
// + vòng cung lên trên mặt phẳng quỹ đạo, nâng dần cho tới khi KHÔNG đi gần Mặt Trời.
export function planFlight(from: CameraPose, to: CameraPose, opts: { reducedMotion?: boolean; duration?: number } = {}): FlightPlan {
    const p0 = from.position.clone(), p1 = to.position.clone();
    const t0 = from.target.clone(), t1 = to.target.clone();
    const travel = p0.distanceTo(p1) + t0.distanceTo(t1) * 0.5;

    const hardMin = SUN_RADIUS * 1.35;
    const safe = Math.max(hardMin, Math.min(SUN_RADIUS * 2.4, p0.length(), p1.length()));

    const tmp = new THREE.Vector3();
    const pathAt = (e: number, lift: number, out: THREE.Vector3) =>
        out.lerpVectors(p0, p1, e).addScaledVector(UP, lift * Math.sin(Math.PI * e));
    const minDist = (lift: number) => {
        let m = Infinity;
        for (let i = 0; i <= 64; i++) m = Math.min(m, pathAt(i / 64, lift, tmp).length());
        return m;
    };

    // vòng cung nền nhỏ cho cảm giác "bay" + nâng thêm nếu cần né Mặt Trời
    let lift = Math.min(travel * 0.12, 10);
    let md = minDist(lift);
    for (let k = 0; k < 40 && md < safe; k++) {
        lift += 1.5;
        md = minDist(lift);
    }

    const duration = opts.reducedMotion ? 0.35 : opts.duration ?? THREE.MathUtils.clamp(1.25 + travel / 70, 1.3, 2.2);
    return {
        duration,
        minSunDistance: md,
        sample(s, outPos, outTarget) {
            const e = easeInOutCubic(THREE.MathUtils.clamp(s, 0, 1));
            pathAt(e, lift, outPos);
            outTarget.lerpVectors(t0, t1, e);
        }
    };
}
