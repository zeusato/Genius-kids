export type GardenMechanic = 'fetch' | 'feed' | 'water' | 'decorate' | 'squeeze' | 'kite' | 'melody' | 'wash' | 'clouds' | 'path' | 'shelter' | 'bow' | 'slice' | 'yoyo';
export interface GardenActivity {
    kind: GardenMechanic;
    instruction: string;
    goal: string;
    item?: string;
    target?: string;
    steps?: number;
    order?: number[];
}
export const GARDEN_ACTIVITIES: Record<string, GardenActivity> = {
    d: { kind: 'fetch', instruction: 'Ném bóng cho Chó 3 lần. Đợi bóng lăn về rồi ném tiếp nhé!', goal: 'lần đón bóng' },
    e: { kind: 'water', instruction: 'Chọn giọt nước, rồi chạm từng bông hoa để giúp Voi tưới 3 bông nhé!', goal: 'bông hoa', item: 'water', target: 'hoa' },
    f: { kind: 'feed', instruction: 'Kéo 3 phần thức ăn xuống hồ cho Cá. Bé cũng có thể chọn thức ăn rồi chạm vào hồ.', goal: 'phần thức ăn', item: 'food', target: 'hồ cá' },
    g: { kind: 'feed', instruction: 'Kéo 3 bó cỏ cho Dê ăn. Hoặc chọn bó cỏ, rồi chạm vào Dê nhé!', goal: 'bó cỏ', item: 'grass', target: 'bạn Dê' },
    h: { kind: 'decorate', instruction: 'Gắn 3 chiếc nơ lên mũ. Chọn nơ rồi chạm ô có cùng màu nhé!', goal: 'chiếc nơ', item: 'bow', target: 'mũ' },
    i: { kind: 'decorate', instruction: 'Trang trí kem bằng 3 món ngon. Ghép từng món vào ô có cùng màu nhé!', goal: 'món trang trí', item: 'topping', target: 'kem' },
    j: { kind: 'squeeze', instruction: 'Kéo tay ép qua lại 3 lượt để vắt cam. Nhìn ly nước ép đầy dần nhé!', goal: 'lượt ép' },
    k: { kind: 'kite', instruction: 'Kéo chiếc diều nhỏ qua 3 vòng gió theo thứ tự. Hoặc chạm từng vòng nhé!', goal: 'vòng gió', order: [0, 1, 2] },
    l: { kind: 'melody', instruction: 'Gõ 3 tiếng trống theo dãy màu để cùng Sư tử hát nhé!', goal: 'nhịp trống', order: [1, 0, 2] },
    m: { kind: 'feed', instruction: 'Kéo 3 quả chuối lên cành cho Khỉ. Hoặc chọn chuối, rồi chạm vào Khỉ nhé!', goal: 'quả chuối', item: 'banana', target: 'bạn Khỉ' },
    n: { kind: 'feed', instruction: 'Đặt 3 quả trứng vào tổ, rồi xem điều bất ngờ nhé! Chọn trứng rồi chạm tổ cũng được.', goal: 'quả trứng', item: 'egg', target: 'tổ chim' },
    o: { kind: 'water', instruction: 'Chọn giọt nước, rồi tưới 3 cây cam nhỏ để cây ra quả nhé!', goal: 'cây cam', item: 'water', target: 'cây cam' },
    p: { kind: 'wash', instruction: 'Kéo bàn chải qua 3 vết bùn trên Heo. Bé cũng có thể chạm từng vết để chà sạch.', goal: 'vết bùn' },
    q: { kind: 'decorate', instruction: 'Gắn 3 viên ngọc lên vương miện. Chọn ngọc rồi tìm ô có cùng màu nhé!', goal: 'viên ngọc', item: 'gem', target: 'vương miện' },
    r: { kind: 'feed', instruction: 'Kéo 3 củ cà rốt cho Thỏ. Hoặc chọn cà rốt, rồi chạm vào Thỏ nhé!', goal: 'củ cà rốt', item: 'carrot', target: 'bạn Thỏ' },
    s: { kind: 'clouds', instruction: 'Kéo 3 đám mây sang bên để đánh thức Mặt trời. Chạm mây để thổi cũng được!', goal: 'đám mây' },
    t: { kind: 'path', instruction: 'Chạm các dấu chân từ 1 đến 3, dẫn Hổ qua suối nhé!', goal: 'bước qua suối', order: [0, 1, 2] },
    u: { kind: 'shelter', instruction: 'Kéo chiếc ô nhỏ sang trái, giữa, rồi phải để che mưa cho 3 bông hoa nhé!', goal: 'bông hoa khô ráo' },
    v: { kind: 'bow', instruction: 'Kéo vĩ đàn hết sang phải, sang trái rồi sang phải. Cùng tạo 3 nốt nhạc nhé!', goal: 'nốt nhạc' },
    w: { kind: 'slice', instruction: 'Kéo đường cắt qua lại 3 lượt để tách dưa thành những miếng nhỏ nhé!', goal: 'miếng dưa' },
    x: { kind: 'melody', instruction: 'Gõ 3 phím đàn theo dãy màu. Lắng nghe bài nhạc của bé nhé!', goal: 'nốt nhạc', order: [0, 2, 1] },
    y: { kind: 'yoyo', instruction: 'Kéo yo-yo xuống rồi lên 3 lần. Nhìn con quay xoay và sợi dây dài ra nhé!', goal: 'lượt lên xuống', steps: 6 },
    z: { kind: 'decorate', instruction: 'Ghép 3 mảnh vằn cho Ngựa vằn. Chọn mảnh rồi chạm ô cùng số nhé!', goal: 'mảnh vằn', item: 'stripe', target: 'Ngựa vằn' },
};

export interface ActivityState { done: number[]; selected: number | null; axis: number; feedback: 'ready' | 'retry' | 'good' }
export const initialActivityState = (): ActivityState => ({ done: [], selected: null, axis: 0, feedback: 'ready' });
export type ActivityAction = { type: 'select'; item: number } | { type: 'drop'; target: number; item?: number }
    | { type: 'hit'; item: number } | { type: 'axis'; value: number };
export const activityGoal = (activity: GardenActivity) => activity.steps ?? 3;
export const activityFinished = (activity: GardenActivity, state: ActivityState) => state.done.length === activityGoal(activity);

function hit(activity: GardenActivity, state: ActivityState, item: number): ActivityState {
    if (!Number.isInteger(item) || item < 0 || item >= activityGoal(activity) || state.done.includes(item)) return state;
    if (activity.order && activity.order[state.done.length] !== item) return { ...state, feedback: 'retry' };
    return { ...state, done: [...state.done, item], selected: null, feedback: 'good' };
}

/** Only completed gestures/placements advance the activity; selecting or replaying a note does not. */
export function advanceActivity(activity: GardenActivity, state: ActivityState, action: ActivityAction): ActivityState {
    if (activityFinished(activity, state)) return state;
    if (action.type === 'select') {
        return Number.isInteger(action.item) && (activity.kind === 'water' ? action.item === 0 : action.item >= 0 && action.item < 3 && !state.done.includes(action.item))
            ? { ...state, selected: action.item, feedback: 'ready' } : state;
    }
    if (action.type === 'drop') {
        const item = action.item ?? state.selected;
        if (item === null || item < 0 || item > 2 || !Number.isInteger(item)) return state;
        if (activity.kind === 'water') return item === 0 ? hit(activity, state, action.target) : state;
        if (activity.kind === 'decorate' && action.target !== item) return { ...state, feedback: 'retry' };
        if (activity.kind === 'feed' && action.target !== 0) return state;
        if (!['feed', 'decorate'].includes(activity.kind)) return state;
        return hit(activity, state, item);
    }
    if (action.type === 'axis') {
        if (!Number.isFinite(action.value) || !['bow', 'yoyo', 'squeeze', 'slice', 'shelter'].includes(activity.kind)) return state;
        const axis = Math.max(0, Math.min(100, action.value));
        const expected = activity.kind === 'shelter' ? [15, 50, 85][state.done.length] : state.done.length % 2 === 0 ? 100 : 0;
        const reached = activity.kind === 'shelter' ? Math.abs(axis - expected) <= 6 : expected === 100 ? axis >= 95 : axis <= 5;
        const next = { ...state, axis };
        return reached ? hit(activity, next, state.done.length) : next;
    }
    return hit(activity, state, action.item);
}

export const GARDEN_COLORS = ['#df865f', '#e0b950', '#72a4a0'];
export function pointInTarget(x: number, y: number, target: [number, number], radius = 12) {
    return Math.hypot(x - target[0], y - target[1]) <= radius;
}

/** When target hit areas overlap, choose the nearest centre rather than the first slot. */
export function closestTarget(x: number, y: number, targets: [number, number][], radius: number) {
    let closest = -1, distance = radius;
    targets.forEach((target, index) => {
        const next = Math.hypot(x - target[0], y - target[1]);
        if (next <= distance) { closest = index; distance = next; }
    });
    return closest;
}
