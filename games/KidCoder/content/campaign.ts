import { Action, Board, ChapterId, Command, Direction, Mission, Pos, ProgramNode, VECTORS, countBlocks, same } from '../engine/model';
import { execute } from '../engine/runtime';

export const CHAPTERS: { id: ChapterId; name: string; place: string; description: string; color: string; ground: string; rock: string; texture: string; icon: string }[] = [
    { id: 'earth', name: 'Bước chân đầu tiên', place: 'Trạm Trái Đất', description: 'Một rover nhỏ. Một hành trình lớn. Bắt đầu từ những lệnh đầu tiên!', color: '#63ddbb', ground: '#719b85', rock: '#526f66', texture: 'earth_day', icon: '🌍' },
    { id: 'moon', name: 'Dấu vết trên Mặt Trăng', place: 'Mặt Trăng', description: 'Những tinh thể đang chờ được khám phá. Mang dữ liệu về trạm nhé!', color: '#b9c7ff', ground: '#8d94ab', rock: '#626a82', texture: '', icon: '🌙' },
    { id: 'mars', name: 'Bí mật của vòng lặp', place: 'Sao Hỏa', description: 'Viết ít hơn, khám phá xa hơn. Tìm nhịp điệu trong mỗi chuyến đi.', color: '#ffb38b', ground: '#b97860', rock: '#864f48', texture: 'mars', icon: '🪐' },
    { id: 'ice', name: 'Rover biết ứng biến', place: 'Trạm băng tưởng tượng', description: 'Đường đi thay đổi! Dạy rover quan sát rồi tự chọn cách hành động.', color: '#7edcea', ground: '#91c3ca', rock: '#6a97af', texture: 'neptune', icon: '❄️' },
    { id: 'station', name: 'Chỉ huy thám hiểm', place: 'Khu nghiên cứu', description: 'Bật trạm, lắp cầu và kết nối những điều đã học. Cả đội đang chờ!', color: '#f5cb6d', ground: '#8796a7', rock: '#596b86', texture: 'earth_day', icon: '🚀' },
];
let id = 0;
const actionMap: Record<string, Action> = { F: 'forward', L: 'left', R: 'right', S: 'scan', A: 'activate', P: 'push' };
export const seq = (text: string): ProgramNode[] => [...text.replace(/\s/g, '')].map(c => ({ id: `lesson-${++id}`, type: actionMap[c] }));
const repeat = (count: number, body: ProgramNode[]): ProgramNode => ({ id: `lesson-${++id}`, type: 'repeat', count, body });
const condition = (sensor: 'clear' | 'sample', body: ProgramNode[], otherwise: ProgramNode[] = []): ProgramNode => ({ id: `lesson-${++id}`, type: 'if', sensor, body, otherwise });
function expanded(nodes: ProgramNode[]): Action[] {
    return nodes.flatMap(n => n.type === 'repeat' ? Array.from({ length: n.count }, () => expanded(n.body)).flat() : n.type === 'if' ? expanded(n.body) : [n.type]);
}
/** Authoring helper: carve the intended route, then independently validate with the gameplay engine. */
function route(program: ProgramNode[], size = 7, start: Pos = { x: 1, y: 4 }, bridge = false): Board {
    const b: Board = { size, tiles: Array(size * size).fill('wall'), start, direction: 1, exit: start, samples: [], devices: [], gates: [], boxes: [] };
    let p = { ...start }, d: Direction = 1;
    let movingBoxes: { id: string; x: number; y: number }[] = [];
    const carve = (v: Pos) => { if (v.x < 0 || v.y < 0 || v.x >= size || v.y >= size) throw new Error('Authored route outside board'); if (b.tiles[v.y * size + v.x] !== 'gap') b.tiles[v.y * size + v.x] = 'floor'; };
    carve(p);
    for (const a of expanded(program)) {
        const q = { x: p.x + VECTORS[d].x, y: p.y + VECTORS[d].y };
        if (a === 'left' || a === 'right') d = ((d + (a === 'left' ? 3 : 1)) % 4) as Direction;
        if (a === 'forward') { p = q; carve(p); }
        if (a === 'scan') { carve(q); if (!b.samples.some(v => same(v, q))) b.samples.push({ ...q, id: `sample-${b.samples.length}`, required: true }); }
        if (a === 'activate') { carve(q); if (!b.devices.some(v => same(v, q))) b.devices.push({ ...q, id: `device-${b.devices.length}` }); }
        if (a === 'push') {
            carve(q); const dest = { x: q.x + VECTORS[d].x, y: q.y + VECTORS[d].y }; carve(dest);
            let box = movingBoxes.find(v => same(v, q));
            if (!box) { box = { ...q, id: `box-${b.boxes.length}` }; b.boxes.push({ ...box }); movingBoxes.push(box); }
            if (bridge) { b.tiles[dest.y * size + dest.x] = 'gap'; movingBoxes = movingBoxes.filter(v => v.id !== box!.id); }
            else { box.x = dest.x; box.y = dest.y; }
            p = q;
        }
    }
    b.exit = { ...p }; return b;
}
const BASIC: Command[] = ['forward', 'left', 'right'];
const SURVEY: Command[] = [...BASIC, 'scan'];
const LOOPS: Command[] = [...SURVEY, 'repeat'];
const SENSOR: Command[] = [...LOOPS, 'if'];
const ALL: Command[] = [...SENSOR, 'activate', 'push'];
const missions: Mission[] = [];
function add(chapter: ChapterId, title: string, skill: string, program: ProgramNode[], options: { size?: number; start?: Pos; bridge?: boolean; boards?: Board[]; starter?: ProgramNode[]; gate?: Pos; allowed?: Command[]; hint?: string } = {}) {
    const number = missions.filter(m => m.chapter === chapter).length + 1;
    const boards = options.boards || [route(program, options.size, options.start, options.bridge)];
    if (options.gate) boards[0].gates.push({ ...options.gate, device: boards[0].devices[0].id });
    const allowed = options.allowed || ({ earth: BASIC, moon: SURVEY, mars: LOOPS, ice: SENSOR, station: ALL }[chapter]);
    const actions = Math.max(...boards.map(b => execute(b, program, allowed).frames.at(-1)!.world.actions));
    const samples = Math.max(...boards.map(b => b.samples.length)), devices = boards.some(b => b.devices.length);
    const brief = [samples ? `Quét ${samples > 1 ? 'các' : 'một'} mẫu tinh thể` : 'Dẫn rover khám phá đường đi', devices ? 'bật thiết bị' : '', 'rồi về bến sáng'].filter(Boolean).join(', ') + (boards.length > 1 ? '. Dùng cùng chương trình cho mọi tình huống!' : '.');
    missions.push({ id: `${chapter}-${String(number).padStart(2, '0')}`, chapter, number, title, skill, brief, allowed, boards, solution: program, starter: options.starter,
        version: 2, concept: chapter === 'mars' ? 'repeat' : chapter === 'ice' ? 'if' : undefined,
        blockBudget: countBlocks(program) + (chapter === 'earth' ? 1 : 0), actionBudget: actions + 2,
        bonus: `Chuyến đi khéo léo: tối đa ${actions + 2} hành động mỗi tình huống`,
        hints: [options.hint || (samples ? 'Tinh thể nằm cạnh đường. Mũi tên của rover phải hướng về tinh thể khi Quét.' : 'Quay chỉ đổi hướng. Sau khi quay, cần thêm Tiến để rover di chuyển.'),
            chapter === 'mars' ? 'Tìm một đoạn lệnh xuất hiện nhiều lần, rồi đặt đoạn đó vào Lặp.' : chapter === 'ice' ? 'Nhìn cảm biến trước khi chọn nhánh. Một chương trình cần dùng được ở mọi tình huống.' : options.bridge ? 'Kiện hàng biến thành cầu khi được đẩy vào khe tối. Sau đó rover có thể Tiến qua.' : 'Dùng Từng bước để kiểm tra mũi tên ngay trước khối bị tô màu cam.',
            `Gợi ý mở đầu: ${program.slice(0, 2).map(n => n.type === 'repeat' ? `Lặp ${n.count} lần` : n.type === 'if' ? 'Nếu cảm biến đúng' : ({ forward: 'Tiến', left: 'Quay trái', right: 'Quay phải', scan: 'Quét', activate: 'Bật thiết bị', push: 'Đẩy' }[n.type])).join(' → ')}. Hãy hoàn thiện phần tiếp theo!`],
        fact: ({ earth: 'Một chương trình là các chỉ dẫn được thực hiện theo thứ tự. Đổi thứ tự có thể đổi cả chuyến đi!', moon: 'Dữ liệu mới được lưu khi rover hướng đúng vào mẫu và thực hiện lệnh Quét. Quan sát cũng quan trọng như di chuyển!', mars: 'Vòng lặp giúp diễn tả một công việc lặp lại bằng ít khối hơn. Số khối và số bước đi là hai điều khác nhau!', ice: 'Điều kiện giúp cùng một chương trình ứng xử khác nhau khi môi trường thay đổi.', station: 'Bật thiết bị và lắp cầu làm thay đổi thế giới. Chương trình có thể tạo ra đường đi mới!' }[chapter]) });
}

add('earth', 'Khởi động rover', 'Xếp lệnh đầu tiên', seq('FF'), { size: 6, allowed: ['forward'], hint: 'Rover cần hai bước để tới bến. Chạm Tiến hai lần rồi bấm Chạy nhé!' });
add('earth', 'Dừng đúng bến', 'Đếm bước', seq('FFF'), { size: 6, allowed: ['forward'] });
add('earth', 'Góc rẽ bên trái', 'Quay tại chỗ', seq('FLF'), { size: 6 });
add('earth', 'Góc rẽ bên phải', 'Đọc hướng rover', seq('FRF'), { size: 6, start: { x: 1, y: 1 } });
add('earth', 'Chuyến đi chữ L', 'Thứ tự lệnh', seq('FFLFF'), { size: 6 });
add('earth', 'Vòng qua vườn cây', 'Lập kế hoạch', seq('FLFRFF'));
add('earth', 'Sửa chuyến xe lạc', 'Tìm và sửa lỗi', seq('FFRFF'), { size: 6, start: { x: 1, y: 1 }, starter: seq('FFLFF'), hint: 'Đội khảo sát gửi một chương trình có một góc quay sai. Chạy từng bước rồi sửa khối đó nhé.' });
add('earth', 'Về trạm nghiên cứu', 'Tự lập trình', seq('FFLFFRFF'), { size: 8, start: { x: 1, y: 5 } });

add('moon', 'Mẫu đá đầu tiên', 'Quét mẫu trước mặt', seq('FS'));
add('moon', 'Đứng đúng hướng', 'Quay rồi quét', seq('FLSRFF'));
add('moon', 'Hai điểm khảo sát', 'Nhiều mục tiêu', seq('FLSRFLSRF'));
add('moon', 'Vòng qua miệng hố', 'Chọn tuyến an toàn', seq('FFLFSRFF'), { size: 8, start: { x: 1, y: 5 } });
add('moon', 'Mẫu vật bị bỏ quên', 'Kiểm tra mục tiêu', seq('FLSRFF'), { starter: seq('FFF'), hint: 'Chương trình đã đến bến, nhưng còn một tinh thể. Thêm lệnh khảo sát vào giữa chuyến đi nhé.' });
add('moon', 'Trình tự khảo sát', 'Sắp thứ tự mục tiêu', seq('FLSRFFLSRF'), { size: 8, start: { x: 1, y: 5 } });
add('moon', 'Máy quét nhìn nhầm', 'Sửa hướng quét', seq('FLSRFF'), { starter: seq('FSLRFF') });
add('moon', 'Chuyến khảo sát độc lập', 'Khảo sát và trở về', seq('FLSRFFLFSRFF'), { size: 9, start: { x: 1, y: 6 } });

add('mars', 'Đường dài gọn lệnh', 'Lặp một lệnh', [repeat(4, seq('F'))], { size: 8, start: { x: 1, y: 5 } });
add('mars', 'Chọn số lượt', 'Số lần lặp', [repeat(3, seq('F')), ...seq('LF')]);
add('mars', 'Hai việc mỗi trạm', 'Lặp một nhóm', [repeat(3, seq('FLSR'))]);
add('mars', 'Tuyến đường bậc thang', 'Nhận ra quy luật', [repeat(2, seq('FFLFFR'))], { size: 8, start: { x: 1, y: 6 } });
add('mars', 'Viền khu nghiên cứu', 'Lặp cả góc quay', [repeat(3, seq('FFL'))], { size: 8, start: { x: 2, y: 5 } });
add('mars', 'Phần việc còn lại', 'Lệnh ngoài vòng lặp', [repeat(3, seq('F')), ...seq('LFF')]);
add('mars', 'Vòng lặp chạy quá xa', 'Sửa số lượt', [repeat(2, seq('FFLFFR'))], { size: 8, start: { x: 1, y: 6 }, starter: [repeat(3, seq('FFLFFR'))] });
add('mars', 'Chương trình gọn gàng', 'Kết hợp vòng lặp', [repeat(2, [repeat(2, seq('F')), ...seq('L'), repeat(2, seq('F')), ...seq('R')])], { size: 8, start: { x: 1, y: 6 } });

function detourBoards() {
    const b = route(seq('RFLFFLFR'), 7, { x: 1, y: 3 });
    const open = structuredClone(b); open.tiles[3 * 7 + 2] = 'floor'; return [open, b];
}
const avoid = () => condition('clear', seq('FF'), seq('RFLFFLFR'));
function surveyCases(n: number) {
    const program = [repeat(n, [...seq('FL'), condition('sample', seq('S')), ...seq('R')])];
    const full = route(program, 8, { x: 1, y: 5 });
    const sparse = structuredClone(full); sparse.samples = sparse.samples.filter((_, i) => i % 2 === 0);
    const other = structuredClone(full); other.samples = other.samples.filter((_, i) => i % 2 !== 0);
    return { program, boards: [full, sparse, other] };
}
add('ice', 'Cảm biến đường đi', 'Đọc cảm biến', [condition('clear', seq('FF'))], { boards: [detourBoards()[0]] });
add('ice', 'Chỉ đi khi an toàn', 'Nếu và không thì', [avoid()], { boards: detourBoards() });
add('ice', 'Gặp đá thì đổi hướng', 'Hai nhánh hành động', [avoid()], { boards: detourBoards().reverse() });
{
    const s = surveyCases(2);
    add('ice', 'Có mẫu mới thì quét', 'Cảm biến mẫu vật', [ ...seq('FL'), condition('sample', seq('S')), ...seq('RFL'), condition('sample', seq('S')), ...seq('R') ], { boards: s.boards });
}
add('ice', 'Hai tuyến, một chương trình', 'Kiểm tra nhiều tình huống', [avoid()], { boards: detourBoards() });
{
    const s = surveyCases(3); add('ice', 'Khảo sát nhiều điểm', 'Lặp và điều kiện', s.program, { boards: s.boards });
}
add('ice', 'Hai nhánh bị đảo', 'Sửa logic', [avoid()], { boards: detourBoards(), starter: [condition('clear', seq('RFLFFLFR'), seq('FF'))] });
{
    const s = surveyCases(4); add('ice', 'Rover biết ứng biến', 'Tổng hợp cảm biến', s.program, { boards: s.boards });
}

add('station', 'Bật trạm liên lạc', 'Trạng thái thiết bị', seq('FLARF'));
add('station', 'Mở đường tới đích', 'Thiết bị và cổng', seq('FLARFFF'), { gate: { x: 3, y: 4 } });
add('station', 'Di chuyển kiện hàng', 'Đẩy và tiến theo', seq('PPRFLF'), { start: { x: 1, y: 3 } });
add('station', 'Lắp cầu qua khe', 'Tạo đường đi mới', seq('PFF'), { start: { x: 1, y: 3 }, bridge: true });
add('station', 'Đừng chặn đường về', 'Lập kế hoạch trước khi đẩy', seq('PPRFLFFLF'), { size: 8, start: { x: 1, y: 3 } });
add('station', 'Khôi phục khu nghiên cứu', 'Kết hợp các cơ chế', seq('FLSRFLARPFF'), { size: 9, start: { x: 1, y: 5 }, bridge: true, gate: { x: 6, y: 5 } });
add('station', 'Sửa nhiệm vụ gặp sự cố', 'Gỡ lỗi nhiều bước', seq('FLSRFLARPFF'), { size: 9, start: { x: 1, y: 5 }, bridge: true, starter: seq('FRSRFLARPFF') });
add('station', 'Chỉ huy chuyến thám hiểm', 'Nhiệm vụ tổng hợp', [repeat(2, seq('FLSR')), ...seq('FLARPFF')], { size: 10, start: { x: 1, y: 6 }, bridge: true, gate: { x: 7, y: 6 } });

export const CAMPAIGN = missions;
export const ROVERS = [
    { id: 'pioneer', name: 'Mầm Nhỏ', color: '#65d5c2', needed: 0, detail: 'Người bạn đầu tiên của mọi nhà thám hiểm.' },
    { id: 'lunar', name: 'Trăng Bạc', color: '#bac8ff', needed: 8, detail: 'Hoàn thành 8 nhiệm vụ để mở khóa.' },
    { id: 'ember', name: 'Tia Lửa', color: '#ffac7d', needed: 16, detail: 'Hoàn thành 16 nhiệm vụ để mở khóa.' },
    { id: 'glacier', name: 'Băng Lam', color: '#83e4f0', needed: 24, detail: 'Hoàn thành 24 nhiệm vụ để mở khóa.' },
    { id: 'captain', name: 'Thuyền Trưởng', color: '#f3ce74', needed: 32, detail: 'Hoàn thành 32 nhiệm vụ để mở khóa.' },
];
