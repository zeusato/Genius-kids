// ============================================================================
//  GearsGame — Kiểu dữ liệu.
//  TÁCH BẠCH: GearSpec = nguồn sự thật (người dùng/level dựng nên);
//             GearRuntime = kết quả mô phỏng (suy ra, KHÔNG lưu trong GearSpec).
// ============================================================================

export type Dir = -1 | 0 | 1; // 1: cùng chiều kim đồng hồ, -1: ngược, 0: không quay
export type GearRole = 'motor' | 'target' | 'anchor' | 'gear';
export type GearState = 'driven' | 'idle' | 'jammed'; // đang quay / chưa nối / kẹt
export type BeltKind = 'belt' | 'belt-crossed'; // dây đai thẳng (cùng chiều) / chéo (đảo chiều)

/** NGUỒN SỰ THẬT: hình học + thuộc tính tĩnh của một bánh răng. */
export interface GearSpec {
    id: string;
    x: number;
    y: number;
    teeth: number;
    radius: number;
    fixed: boolean;
    role: GearRole;
}

/** Kết nối dây đai tường minh (ăn khớp răng thì tự suy từ hình học). */
export interface BeltSpec {
    id: string;
    a: string;
    b: string;
    kind: BeltKind;
}

/** Toàn bộ bố cục người chơi đã dựng — đầu vào thuần của engine. */
export interface GearLayout {
    gears: GearSpec[];
    belts: BeltSpec[];
}

/** Trạng thái động suy ra cho từng bánh răng sau khi mô phỏng. */
export interface GearRuntime {
    state: GearState;
    dir: Dir;
    /** Độ lớn tốc độ góc (vòng/giây). 0 nếu idle/jammed. */
    speed: number;
    /** Pha ban đầu (độ) để răng các bánh ăn khớp khi vẽ. */
    phaseDeg: number;
}

/** Kết quả mô phỏng cả mạng. */
export interface SimResult {
    runtime: Map<string, GearRuntime>;
    jammed: boolean;
    jammedGearIds: Set<string>;
    /** Các cặp [a,b] gây xung đột — để highlight cho trẻ thấy chỗ kẹt. */
    jammedEdges: Array<[string, string]>;
}

export interface MotorConfig {
    id: string;
    dir: 1 | -1;
    speed: number;
}

export interface WaterZone {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

/** Level chế độ LẮP (BUILD). layout chứa motor/target/anchor cố định sẵn. */
export interface BuildLevel {
    id: string;
    seed: number;
    difficulty: Difficulty;
    layout: GearLayout;
    waterZones: WaterZone[];
    targetDirection: 1 | -1;
    targetMinSpeed?: number;
    maxGears: number;
    maxBelts: number;
    maxBeltLength: number;
    availableGearSizes: number[];
    /** Bánh răng cố định (ngoài motor/target) bắt buộc phải quay để thắng. */
    fixedGearIds: string[];
}

/** Level chế độ ĐOÁN CHIỀU (GUESS). */
export interface GuessLevel {
    id: string;
    seed: number;
    difficulty: Difficulty;
    layout: GearLayout;
    waterZones: WaterZone[];
    motorId: string;
    gearsToGuess: string[];
}
