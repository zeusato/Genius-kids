import type { Mission, Socket, Design, Difficulty } from './model';
import { emptyDesign } from './model';
const TITLES = ['Một làn gió mới', 'Nước về vườn nhỏ', 'Chuyến tàu bí mật', 'Cây cầu ngủ quên', 'Khu vườn thức giấc', 'Đồng hồ sao'];
const SUBTITLES = ['Đánh thức chiếc quạt', 'Bắc cầu cho chuyển động', 'Nghĩ trước khi bật máy', 'Tìm điều khiến máy bị kẹt', 'Một nguồn, hai công việc', 'Làm chủ tốc độ'];
const STORIES = ['Bé Bu-lông nóng quá! Nối bộ truyền để chiếc quạt tạo một làn gió mát.', 'Những mầm cây đang khát. Đưa chuyển động qua khe nước để máy bơm hoạt động.', 'Tàu đồ chơi chỉ khởi hành khi em dự đoán đúng chuyển động. Cùng lần theo đường từ nguồn nhé!', 'Thuyền giấy đang chờ qua cầu. Có linh kiện làm bộ truyền bị kẹt. Tìm và tháo đúng chỗ.', 'Cánh quạt và máy tưới đều cần được đánh thức. Hãy đưa chuyển động tới cả hai!', 'Chiếc đồng hồ cần nhịp quay thật chính xác. Chọn cỡ bánh đầu ra và loại đai phù hợp.'];
export const MACHINE_NAMES = ['Quạt mây', 'Bơm mầm xanh', 'Tàu tí hon', 'Cầu cầu vồng', 'Vườn gió', 'Đồng hồ sao'];
export function missionFor(id: number, difficulty: Difficulty = 'easy', seed = 1): Mission {
    id = Math.max(0, Math.min(5, Math.floor(id))); const rank = difficulty === 'easy' ? 0 : difficulty === 'medium' ? 1 : 2;
    const reverse = seed % 2 === 0;
    const sockets: Socket[] = [], initial = emptyDesign(), solution = emptyDesign();
    const socket = (sid: string, x: number, y: number, role: Socket['role'] = 'gear', teeth?: number, locked = false, pulley = false) => {
        sockets.push({ id: sid, x, y: y > 150 ? y - 30 : y, role, teeth, locked, pulley, label: role === 'motor' ? 'Nguồn' : role === 'target' ? sid === 'target2' ? 'Đầu ra B' : 'Đầu ra A' : sid.toUpperCase() });
    };
    const belt = (d: Design, a: string, b: string, crossed = false) => d.belts.push({ id: `${a}:${b}`, a, b, kind: crossed ? 'belt-crossed' : 'belt' });
    let goals: Mission['goals'] = [], maxBelts = 0, par = 0;
    let river: Mission['river']; const mode: Mission['mode'] = id === 2 ? 'guess' : id === 3 ? 'repair' : 'build';
    const dir = (value: number): 1 | -1 => value > 0 ? 1 : -1;
    if (id === 0 || id === 2) {
        const steps = (id === 0 ? 2 : 3) + rank, x = 360 - steps * 36;
        for (let i = 0; i <= steps; i++) {
            const sid = i === 0 ? 'motor' : i === steps ? 'target' : `g${i}`;
            socket(sid, x + i * 72, 238, i === 0 ? 'motor' : i === steps ? 'target' : 'gear', i === 0 || i === steps || id === 2 ? 12 : undefined, i === 0 || i === steps || id === 2);
            if (i > 0 && i < steps && id !== 2) solution.gears[sid] = 12;
        }
        goals = [{ id: 'target', label: id === 0 ? 'Cánh quạt' : 'Bánh tàu', dir: dir((-1) ** steps) }];
        if (id === 2 && rank > 0) goals.push({ id: 'g2', label: 'Bánh giữa', dir: 1 });
        if (id === 2) goals.forEach(g => { solution.guesses[g.id] = g.dir; }); par = steps - 1;
    } else if (id === 1) {
        socket('motor', 160, 238, 'motor', 12, true); socket('a', 232, 238, 'gear', rank === 0 ? 12 : undefined, rank === 0, true);
        socket('b', 480, 238, 'gear', undefined, false, true); socket('target', 552, 238, 'target', 12, true);
        if (rank !== 0) solution.gears.a = 12; solution.gears.b = 12;
        const crossed = (rank === 2) !== reverse; belt(solution, 'a', 'b', crossed);
        goals = [{ id: 'target', label: 'Máy bơm', dir: crossed ? -1 : 1 }]; maxBelts = 1; par = rank === 0 ? 2 : 3; river = { x: 326, width: 65 };
    } else if (id === 3) {
        socket('motor', 252, 260, 'motor', 12, true, rank > 0); socket('a', 324, 260, 'gear', undefined, false, rank > 0);
        socket('b', 288, 260 - Math.sqrt(3) * 36); socket('target', 396, 260, 'target', 12, true);
        initial.gears = { a: 12, b: 12 }; solution.gears.a = 12;
        if (rank > 0) { belt(initial, 'motor', 'a'); maxBelts = 1; }
        if (rank === 2) { socket('c', 360, 260 - Math.sqrt(3) * 36); initial.gears.c = 12; }
        goals = [{ id: 'target', label: 'Tay nâng cầu', dir: 1 }]; par = 1;
    } else if (id === 4) {
        socket('motor', 300, 238, 'motor', 12, true, true); socket('a', 228, 238); socket('target', 156, 238, 'target', 12, true);
        socket('b', 480, 238, 'gear', rank === 0 ? 12 : undefined, rank === 0, true); socket('target2', 552, 238, 'target', 12, true);
        solution.gears.a = 12; if (rank !== 0) solution.gears.b = 12;
        const crossed = (rank === 2) !== reverse; belt(solution, 'motor', 'b', crossed);
        goals = [{ id: 'target', label: 'Cánh quạt', dir: 1 }, { id: 'target2', label: 'Vòi tưới', dir: crossed ? 1 : -1 }]; maxBelts = 1; par = rank === 0 ? 2 : 3;
    } else {
        socket('motor', 170, 250, 'motor', 16, true); socket('a', 254, 250, 'gear', 12, true, true);
        socket('target', 500, 250, 'target', undefined, false, true);
        solution.gears.target = rank === 0 ? 16 : 8; const crossed = (rank > 0) !== reverse; belt(solution, 'a', 'target', crossed);
        goals = [{ id: 'target', label: 'Kim đồng hồ', dir: crossed ? 1 : -1, speed: rank === 0 ? 1 : 2 }]; maxBelts = 1; par = 2;
        if (rank === 2) {
            socket('target2', 500, 100, 'target', undefined, false, true); solution.gears.target2 = 16; belt(solution, 'target', 'target2');
            goals.push({ id: 'target2', label: 'Ngôi sao', dir: crossed ? 1 : -1, speed: 1 }); maxBelts = 2; par = 4;
        }
    }
    const predictionId = id === 0 ? `g${1+rank}` : id === 1 || id === 4 ? 'b' : 'a';
    const predictions = mode === 'guess' ? goals.map(({id,label})=>({id,label})) : [{id:predictionId,label:`Bánh ${predictionId.toUpperCase()}`}];
    const hints = [
        ['Hai bánh chạm nhau quay ngược chiều. Em hãy nối từ bánh Nguồn.', 'Khoảng trống giữa các trục hợp với bánh 12 răng.', 'Đặt bánh 12 răng vào các trục trống rồi bấm Chạy thử.'],
        ['Bánh răng không đi qua khe nước, nhưng dây đai có thể bắc qua.', 'Hai trục có viền dây là cổng puli. Đặt bánh vào đó trước khi nối đai.', `Nối A với B bằng đai ${goals[0].dir === -1 ? 'chéo' : 'thẳng'}; các vị trí còn thiếu dùng bánh 12 răng.`],
        ['Bắt đầu từ Nguồn quay ↻. Mỗi lần đi qua một cặp răng, chiều lại đảo.', 'Lần theo từng bánh từ trái qua phải; đừng bỏ qua bánh ở giữa.', 'Em có thể đặt ngón tay lên từng bánh và đọc lần lượt: ↻, ↺, ↻…'],
        ['Một vòng ba bánh tiếp xúc làm chiều quay mâu thuẫn.', 'Các bánh ở trên tạo thành vòng kín. Thử dùng công cụ Tháo.', rank === 2 ? 'Tháo B, C và dây đai Nguồn–A; giữ bánh A ở giữa.' : rank > 0 ? 'Tháo bánh B và dây đai giữa Nguồn–A; giữ bánh A để nối tới đích.' : 'Tháo bánh B ở trên; giữ bánh A ở giữa Nguồn và đích.'],
        ['Máy chỉ xong khi cả cánh quạt và vòi tưới đều chạy đúng chiều.', 'Nhánh trái cần bánh răng, nhánh phải cần dây đai.', `Dùng bánh 12 răng cho trục trống. Nối Nguồn với B bằng đai ${goals[1]?.dir === 1 ? 'chéo' : 'thẳng'}.`],
        ['Bánh nhỏ quay nhanh hơn. Bánh 8 răng quay hai vòng khi Nguồn 16 răng quay một vòng.', 'Thay bánh đầu ra để đổi tốc độ; chọn đai theo chiều yêu cầu.', `Đầu ra A dùng ${solution.gears.target || 8} răng. Dây từ trục A tới đầu ra dùng đai ${goals[0].dir === 1 ? 'chéo' : 'thẳng'}.${rank === 2 ? ' Đầu ra B dùng 16 răng, nối đai thẳng từ đầu ra A.' : ''}`],
    ][id];
    return { id, key: `workshop-${id}`, title: TITLES[id], subtitle: SUBTITLES[id], story: STORIES[id], skill: ['Ăn khớp & đổi chiều', 'Dây đai & khoảng cách', 'Quan sát & dự đoán', 'Tìm lỗi & sửa máy', 'Chia nhánh truyền động', 'Tỉ số tốc độ'][id], machine: ['fan', 'pump', 'train', 'bridge', 'garden', 'clock'][id] as Mission['machine'], difficulty, mode, sockets, initial, solution, stock: id === 2 ? {} : { 8: rank === 0 && id !== 5 ? 0 : 2, 12: 6, 16: rank === 0 && id !== 5 ? 0 : 2 }, belts: maxBelts, maxBeltLength: 260, maxParts: Math.max(par + (2 - rank), Object.keys(initial.gears).length + initial.belts.length), par, goals, predictions, hints, river, seed };
}
export const MISSIONS = Array.from({ length: 6 }, (_, id) => ({ id, title: TITLES[id], subtitle: SUBTITLES[id], machine: ['fan', 'pump', 'train', 'bridge', 'garden', 'clock'][id] as Mission['machine'] }));
