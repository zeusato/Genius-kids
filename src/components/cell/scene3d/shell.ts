import * as THREE from 'three';
import { createRandom, randomDirection } from './noise';

// === Vỏ "hướng tâm" dùng chung cho màng tế bào, thành tế bào, vỏ nhầy, màng nhân ===
//
// Mọi vỏ là MỘT mặt cầu đơn vị được shader đẩy ra điểm   p(d) = d · r(d) · (1 + δ(d, t)) · pinch(d)
//   - r(d): khoảng cách từ tâm tới mặt siêu elip theo hướng d (cầu, hộp bo tròn, hình que)
//   - δ(d, t): sóng màng — TỔNG VÀI HÀM SIN (không phải simplex) để JS và GLSL cho kết quả
//     giống hệt nhau. Nhờ vậy dải mặt cắt tính trên CPU khớp tuyệt đối với vỏ đang phập phồng.
//   - pinch: thắt eo quanh mặt phẳng x = 0 (phân chia tế bào / vi khuẩn nhân đôi)
// Cửa sổ cắt = bỏ các fragment có hướng (chuẩn hóa theo cutHalf) nằm trong nón quanh trục camera.

export const WAVE_COUNT = 5;

export interface ShellShape {
    half: [number, number, number]; // nửa kích thước (scene units)
    exp: number;                     // số mũ siêu elip: 2 = elip, 4–6 = hộp bo tròn
    round?: boolean;                 // true = tiết diện vuông góc trục x luôn tròn (hình que vi khuẩn)
}

export interface ShellWaves {
    dirs: THREE.Vector4[]; // xyz = hướng * tần số, w = pha
    ta: THREE.Vector2[];   // x = tốc độ góc (rad/s), y = trọng số biên độ (tổng = 1)
}

export function createWaves(seed: string, opts: { freq: number; speed: number }): ShellWaves {
    const rand = createRandom(seed);
    const dirs: THREE.Vector4[] = [];
    const ta: THREE.Vector2[] = [];
    let total = 0;
    const weights: number[] = [];
    for (let i = 0; i < WAVE_COUNT; i++) {
        const w = 1 / (1 + i * 0.85);
        weights.push(w);
        total += w;
    }
    for (let i = 0; i < WAVE_COUNT; i++) {
        const [x, y, z] = randomDirection(rand);
        const f = opts.freq * (1 + i * 0.6) * (0.85 + rand() * 0.3);
        dirs.push(new THREE.Vector4(x * f, y * f, z * f, rand() * Math.PI * 2));
        const sp = opts.speed * (0.55 + rand() * 0.9) * (rand() < 0.5 ? -1 : 1);
        ta.push(new THREE.Vector2(sp, weights[i] / total));
    }
    return { dirs, ta };
}

// Sóng tĩnh (biên độ 0) — cho vỏ cứng như thành tế bào
export const NO_WAVES: ShellWaves = {
    dirs: Array.from({ length: WAVE_COUNT }, () => new THREE.Vector4(0, 0, 0, 0)),
    ta: Array.from({ length: WAVE_COUNT }, () => new THREE.Vector2(0, 0))
};

export interface ShellState {
    shape: ShellShape;
    waves: ShellWaves;
    amp: number;    // biên độ sóng tương đối (0.02 = ±2% bán kính)
    pinch: number;  // 0..1 thắt eo
    pinchWidth: number;
}

// ---------------- JS (khớp từng phép tính với GLSL bên dưới) ----------------

export function shellRadius(dx: number, dy: number, dz: number, shape: ShellShape): number {
    const [a, b, c] = shape.half;
    const e = shape.exp;
    const qx = Math.abs(dx / a), qy = Math.abs(dy / b), qz = Math.abs(dz / c);
    const s = shape.round
        ? Math.pow(qx, e) + Math.pow(qy * qy + qz * qz, e * 0.5)
        : Math.pow(qx, e) + Math.pow(qy, e) + Math.pow(qz, e);
    return Math.pow(s, -1 / e);
}

export function shellWave(dx: number, dy: number, dz: number, waves: ShellWaves, amp: number, time: number): number {
    if (amp === 0) return 0;
    let w = 0;
    for (let i = 0; i < WAVE_COUNT; i++) {
        const k = waves.dirs[i];
        const t = waves.ta[i];
        w += t.y * Math.sin(dx * k.x + dy * k.y + dz * k.z + k.w + time * t.x);
    }
    return w * amp;
}

export function shellPinch(dx: number, pinch: number, width: number): number {
    if (pinch === 0) return 1;
    const u = dx / width;
    return 1 - pinch * Math.exp(-u * u);
}

// Điểm trên vỏ theo hướng đơn vị d (toạ độ local của vỏ)
export function shellPoint(out: THREE.Vector3, d: THREE.Vector3, st: ShellState, time: number): THREE.Vector3 {
    const r = shellRadius(d.x, d.y, d.z, st.shape)
        * (1 + shellWave(d.x, d.y, d.z, st.waves, st.amp, time))
        * shellPinch(d.x, st.pinch, st.pinchWidth);
    return out.copy(d).multiplyScalar(r);
}

// ---------------- GLSL ----------------

export const SHELL_GLSL = /* glsl */`
uniform vec3 uShellHalf;
uniform float uShellExp;
uniform float uShellRound;
uniform vec4 uWave[${WAVE_COUNT}];
uniform vec2 uWaveTA[${WAVE_COUNT}];
uniform float uWaveAmp;
uniform vec2 uPinch;

float shellRadius(vec3 d) {
    vec3 q = abs(d / uShellHalf);
    float s;
    if (uShellRound > 0.5) {
        s = pow(q.x, uShellExp) + pow(q.y * q.y + q.z * q.z, uShellExp * 0.5);
    } else {
        s = pow(q.x, uShellExp) + pow(q.y, uShellExp) + pow(q.z, uShellExp);
    }
    return pow(s, -1.0 / uShellExp);
}
float shellWave(vec3 d) {
    float w = 0.0;
    for (int i = 0; i < ${WAVE_COUNT}; i++) {
        w += uWaveTA[i].y * sin(dot(d, uWave[i].xyz) + uWave[i].w + uTime * uWaveTA[i].x);
    }
    return w * uWaveAmp;
}
float shellPinch(vec3 d) {
    float u = d.x / max(uPinch.y, 1e-3);
    return 1.0 - uPinch.x * exp(-u * u);
}
vec3 shellPoint(vec3 d) {
    return d * (shellRadius(d) * (1.0 + shellWave(d)) * shellPinch(d));
}
`;

// Uniform của một vỏ — tạo một lần, chia sẻ cho mặt ngoài / mặt trong / protein neo trên vỏ
export interface ShellUniforms {
    uShellHalf: { value: THREE.Vector3 };
    uShellExp: { value: number };
    uShellRound: { value: number };
    uWave: { value: THREE.Vector4[] };
    uWaveTA: { value: THREE.Vector2[] };
    uWaveAmp: { value: number };
    uPinch: { value: THREE.Vector2 };
}

export function createShellUniforms(st: ShellState): ShellUniforms {
    return {
        uShellHalf: { value: new THREE.Vector3(...st.shape.half) },
        uShellExp: { value: st.shape.exp },
        uShellRound: { value: st.shape.round ? 1 : 0 },
        uWave: { value: st.waves.dirs },
        uWaveTA: { value: st.waves.ta },
        uWaveAmp: { value: st.amp },
        uPinch: { value: new THREE.Vector2(st.pinch, st.pinchWidth) }
    };
}

// Đồng bộ state JS → uniform (khi thí nghiệm đổi kích thước / thắt eo)
export function syncShellUniforms(u: ShellUniforms, st: ShellState): void {
    u.uShellHalf.value.set(...st.shape.half);
    u.uShellExp.value = st.shape.exp;
    u.uShellRound.value = st.shape.round ? 1 : 0;
    u.uWaveAmp.value = st.amp;
    u.uPinch.value.set(st.pinch, st.pinchWidth);
}

// ---------------- Cửa sổ cắt ----------------

export const CUT_GLSL_FRAG = /* glsl */`
uniform vec3 uCutAxis;
uniform float uCutCos;
uniform vec3 uCutHalf;
`;

export interface CutUniforms {
    uCutAxis: { value: THREE.Vector3 };   // trục nón (không gian chuẩn hóa theo cutHalf, local của tế bào)
    uCutCos: { value: number };           // cos nửa góc mở; > 1 = đóng hẳn
    uCutHalf: { value: THREE.Vector3 };   // nửa kích thước tham chiếu CHUNG cho mọi lớp của một tế bào
}

export function createCutUniforms(half: [number, number, number]): CutUniforms {
    return {
        uCutAxis: { value: new THREE.Vector3(0, 0, 1) },
        uCutCos: { value: 2 },
        uCutHalf: { value: new THREE.Vector3(...half) }
    };
}

// Hướng d (local) có nằm trong cửa sổ cắt không — dùng cho nhãn, raycast xuyên cửa sổ
export function inCutWindow(p: THREE.Vector3, cut: CutUniforms, margin = 0): boolean {
    if (cut.uCutCos.value >= 1) return false;
    const h = cut.uCutHalf.value;
    const x = p.x / h.x, y = p.y / h.y, z = p.z / h.z;
    const len = Math.hypot(x, y, z) || 1;
    const a = cut.uCutAxis.value;
    return (x * a.x + y * a.y + z * a.z) / len > cut.uCutCos.value - margin;
}
