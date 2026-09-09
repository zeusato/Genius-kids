import type { Board, Config, RoundKind, Tile, Visual } from './model';
export function rng(seed: number) { let n = seed >>> 0; return () => { n += 0x6D2B79F5; let t = n; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function shuffle<T>(items: readonly T[], random: () => number): T[] { const a = [...items]; for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
} return a; }
const COLORS = [['đỏ', '#ef6a64'], ['xanh dương', '#568ece'], ['xanh lá', '#56a77b'], ['vàng', '#f1c34f'], ['tím', '#9f7dc0'], ['cam', '#ee9e52']] as const;
const SHAPES = ['circle', 'square', 'triangle', 'star'] as const;
const SHAPE_NAMES = ['Hình tròn', 'Hình vuông', 'Hình tam giác', 'Hình sao'];
const WORD_PAIRS = [['cao', 'thấp'], ['nóng', 'lạnh'], ['dài', 'ngắn'], ['nhanh', 'chậm'], ['sáng', 'tối'], ['nặng', 'nhẹ'], ['mở', 'đóng'], ['vui', 'buồn'], ['trên', 'dưới'], ['trước', 'sau'], ['rộng', 'hẹp'], ['đầy', 'vơi'], ['xa', 'gần'], ['cứng', 'mềm'], ['sạch', 'bẩn'], ['khô', 'ướt']];
// Curated rather than importing ambiguous questions into timed scoring.
const KNOWLEDGE = [
    ['Con vật nào có vòi dài?', 'Voi', ['Hổ', 'Mèo', 'Gà']], ['Con vật nào có cổ rất dài?', 'Hươu cao cổ', ['Voi', 'Vịt', 'Thỏ']],
    ['Bộ phận nào giúp chúng ta nghe?', 'Tai', ['Mắt', 'Mũi', 'Tay']], ['Bộ phận nào giúp chúng ta nhìn?', 'Mắt', ['Tai', 'Mũi', 'Chân']],
    ['Cây nhận ánh sáng tự nhiên từ đâu?', 'Mặt trời', ['Tủ lạnh', 'Bóng tối', 'Đá cuội']], ['Loài nào tạo ra mật?', 'Ong', ['Bướm', 'Kiến', 'Ruồi']],
    ['Một tuần có mấy ngày?', '7', ['5', '6', '8']], ['Một năm có mấy tháng?', '12', ['10', '11', '13']],
    ['Nước đóng băng trở thành gì?', 'Nước đá', ['Hơi nước', 'Cát', 'Khói']], ['Muốn qua đường, em nên đi ở đâu?', 'Vạch sang đường', ['Giữa dòng xe', 'Đường cao tốc', 'Chỗ khuất tầm nhìn']],
    ['Trước khi ăn, em nên làm gì?', 'Rửa tay', ['Chạy nhảy', 'Vứt rác', 'Nghịch đất']], ['Đồ vật nào dùng để đo chiều dài?', 'Thước', ['Tẩy', 'Cốc', 'Mũ']],
    ['Con vật nào có tám chân?', 'Nhện', ['Gà', 'Mèo', 'Ong']], ['Cơ quan nào giúp chúng ta thở?', 'Phổi', ['Dạ dày', 'Răng', 'Tóc']],
    ['Khi đèn giao thông màu đỏ, em cần làm gì?', 'Dừng lại', ['Đi tiếp', 'Chạy nhanh', 'Nhắm mắt']], ['Rác nên được bỏ vào đâu?', 'Thùng rác', ['Dòng sông', 'Sân trường', 'Lòng đường']],
    ['Bố của bố được gọi là gì?', 'Ông nội', ['Ông ngoại', 'Chú', 'Cậu']], ['Mẹ của mẹ được gọi là gì?', 'Bà ngoại', ['Bà nội', 'Cô', 'Dì']],
    ['Vật nào dùng để che mưa?', 'Ô', ['Quạt', 'Thước', 'Bát']], ['Mặt trời thường mọc ở hướng nào?', 'Đông', ['Tây', 'Bắc', 'Nam']],
] as const;
const KNOW_PAIRS = [['Mắt', 'Nhìn'], ['Tai', 'Nghe'], ['Mũi', 'Ngửi'], ['Lưỡi', 'Nếm'], ['Phổi', 'Hô hấp'], ['Tim', 'Bơm máu']];
const SENTENCES = [['Em', 'chăm chỉ', 'học bài.'], ['Mẹ', 'đang', 'nấu cơm.'], ['Chú mèo', 'nằm ngủ', 'bên cửa sổ.'], ['Chúng em', 'cùng nhau', 'trồng cây.'], ['Mặt trời', 'tỏa nắng', 'trên sân trường.'], ['Đàn chim', 'bay lượn', 'trên bầu trời.'], ['Bé', 'rửa tay', 'trước khi ăn.'], ['Bố', 'đọc sách', 'cho em nghe.'], ['Bạn Lan', 'tưới nước', 'cho vườn hoa.'], ['Cơn mưa', 'mang nước', 'cho cây xanh.']];
const LIFE = [['hạt đậu', 'cây non', 'cây trưởng thành'], ['trứng gà', 'gà con', 'gà trưởng thành'], ['trứng bướm', 'sâu bướm', 'nhộng', 'bướm trưởng thành']];
const TYPING = ['Mặt trời', 'Bông hoa', 'Đi học', 'Chăm chỉ', 'Vui vẻ', 'Con mèo', 'Cầu vồng', 'Dòng sông', 'Tia sáng', 'Bạn bè', 'Học tập tốt', 'Giữ gìn vệ sinh', 'Cùng nhau trồng cây', 'Đọc sách mỗi ngày', 'Yêu thương gia đình'];
function indexed<T>(list: readonly T[], seed: number, index: number): T { return shuffle(list, rng(seed))[index % list.length]; }
function math(c: Config, random: () => number) {
    const grade = Math.max(1, Math.min(5, c.grade));
    const max = (grade === 1 ? 10 : grade === 2 ? 50 : grade === 3 ? 100 : grade === 4 ? 500 : 1000) * (c.difficulty === 'easy' ? .5 : 1);
    const int = (m: number) => 1 + Math.floor(random() * m);
    let a = int(max), b = int(max), op = random() < .5 ? '+' : '−', answer = 0;
    if (grade >= 3 && random() < .45) {
        b = int(grade >= 4 && c.difficulty === 'hard' ? 12 : 9);
        answer = int(9);
        if (random() < .5) {
            a = answer * b;
            op = '÷';
        }
        else {
            a = answer;
            answer = a * b;
            op = '×';
        }
    }
    else if (op === '−') {
        [a, b] = [Math.max(a, b), Math.min(a, b)];
        answer = a - b;
    }
    else
        answer = a + b;
    return { text: `${a} ${op} ${b}`, answer };
}
function clock(hour: number, minute: number): Visual { return { kind: 'clock', hour, minute }; }
const time = (h: number, m: number) => `${h}:${String(m).padStart(2, '0')}`;
export function makeBoard(c: Config, seed: number, round: number, index: number, kind: RoundKind): Board {
    const id = `${round}:${index}`, random = rng(seed + round * 100003 + index * 7919), pick = (n: number) => Math.floor(random() * n);
    const topic = c.topic === 'mixed' ? (['math', 'observe', 'words', 'knowledge'] as const)[(index + round + seed % 4) % 4] : c.topic;
    const contentIndex = c.topic === 'mixed' ? Math.floor(index / 4) : index;
    const base: Board = { id, kind, prompt: '', explanation: '', options: [], answer: [] };
    const tiles = (values: string[]) => values.map((text, i) => ({ id: String(i), text }));
    const count = c.difficulty === 'hard' && c.grade >= 3 ? 4 : 3;
    if (kind === 'typing') {
        const word = indexed(TYPING, seed, index);
        return { ...base, prompt: `Gõ lại: “${word}”`, answer: [word], explanation: `Từ đúng là “${word}”.` };
    }
    if (kind === 'choice') {
        let answer = '', values: string[] = [], visual: Visual | undefined, prompt = '';
        if (topic === 'math') {
            const m = math(c, random);
            answer = String(m.answer);
            prompt = `${m.text} = ?`;
            const opts = new Set([answer]);
            for (let d = 1; opts.size < 4; d++)
                opts.add(String(Math.max(0, m.answer + (d % 2 ? -1 : 1) * Math.ceil(d / 2))));
            values = shuffle([...opts], random);
        }
        else if (topic === 'words') {
            const p = indexed(WORD_PAIRS, seed, contentIndex);
            prompt = `Từ nào trái nghĩa với “${p[0]}”?`;
            answer = p[1];
            values = shuffle([answer, ...shuffle(WORD_PAIRS.filter(x => x[1] !== answer).map(x => x[1]), random).slice(0, 3)], random);
        }
        else if (topic === 'knowledge') {
            const q = indexed(KNOWLEDGE, seed, contentIndex);
            prompt = q[0];
            answer = q[1];
            values = shuffle([answer, ...q[2]], random);
        }
        else if (contentIndex % 4 === 0) {
            const left = pick(6), right = pick(6);
            answer = String(left + right);
            prompt = 'Có tất cả bao nhiêu vật ở hai nhóm?';
            visual = { kind: 'groups', left, right };
            values = shuffle([answer, String(left + right + 1), String(left + right + 2), String(left + right + 3)], random);
        }
        else if (contentIndex % 4 === 1) {
            const n = pick(COLORS.length);
            prompt = 'Đây là màu gì?';
            answer = COLORS[n][0];
            visual = { kind: 'color', color: COLORS[n][1] };
            values = shuffle([answer, ...shuffle(COLORS.filter((_, i) => i !== n).map(x => x[0]), random).slice(0, 3)], random);
        }
        else if (contentIndex % 4 === 2) {
            const n = pick(4);
            prompt = 'Đây là hình gì?';
            answer = SHAPE_NAMES[n];
            visual = { kind: 'shape', shape: SHAPES[n], color: COLORS[pick(6)][1] };
            values = shuffle([...SHAPE_NAMES], random);
        }
        else {
            const h = 1 + pick(12), m = c.grade < 2 ? 0 : pick(4) * 15;
            prompt = 'Đồng hồ chỉ mấy giờ?';
            answer = time(h, m);
            visual = clock(h, m);
            values = shuffle([answer, time(h % 12 + 1, m), time((h + 1) % 12 + 1, m), time((h + 2) % 12 + 1, m)], random);
        }
        const options = tiles(values);
        return { ...base, prompt, visual, options, answer: [options.find(o => o.text === answer)!.id], explanation: visual?.kind === 'groups' ? `${visual.left} + ${visual.right} = ${answer}. Nhóm rỗng có 0 vật.` : `Đáp án đúng: ${answer}.` };
    }
    if (kind === 'match') {
        let left: Tile[] = [], right: Tile[] = [], prompt = 'Ghép phép tính với kết quả';
        if (topic === 'math') {
            const used = new Set<number>();
            let attempts = 0;
            while (left.length < count && attempts++ < 200) {
                const m = math(c, random);
                if (used.has(m.answer))
                    continue;
                used.add(m.answer);
                const key = String(left.length);
                left.push({ id: key, text: m.text });
                right.push({ id: key, text: String(m.answer) });
            }
        }
        else if (topic === 'words' || topic === 'knowledge') {
            const pairs = shuffle(topic === 'words' ? WORD_PAIRS : KNOW_PAIRS, random).slice(0, count);
            prompt = topic === 'words' ? 'Ghép các từ trái nghĩa' : 'Ghép bộ phận với chức năng';
            left = pairs.map((p, i) => ({ id: String(i), text: p[0] }));
            right = pairs.map((p, i) => ({ id: String(i), text: p[1] }));
        }
        else {
            prompt = 'Ghép đồng hồ với giờ tương ứng';
            const hours = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], random).slice(0, count);
            left = hours.map((h, i) => ({ id: String(i), text: `Đồng hồ ${i + 1}`, visual: clock(h, c.grade < 2 ? 0 : i % 4 * 15) }));
            right = hours.map((h, i) => ({ id: String(i), text: time(h, c.grade < 2 ? 0 : i % 4 * 15) }));
        }
        return { ...base, prompt, left, options: shuffle(right, random), answer: left.map(t => t.id), explanation: left.map(t => `${t.visual?.kind === 'clock' ? `Đồng hồ ${t.visual.hour} giờ ${t.visual.minute} phút` : t.text} → ${right.find(o => o.id === t.id)!.text}`).join(' · ') };
    }
    let options: Tile[], answer: string[], prompt: string;
    if (topic === 'words' || topic === 'knowledge') {
        const words = topic === 'words' ? indexed(SENTENCES, seed, contentIndex) : indexed(LIFE, seed, contentIndex);
        options = words.map((text, i) => ({ id: String(i), text }));
        answer = options.map(o => o.id);
        prompt = topic === 'words' ? 'Xếp các phần thành câu hoàn chỉnh' : 'Xếp các giai đoạn phát triển từ đầu đến cuối';
    }
    else {
        const numbers = shuffle(Array.from({ length: topic === 'observe' ? 11 : Math.min(90, c.grade * 18) }, (_, i) => i + 1), random).slice(0, count).sort((a, b) => a - b);
        options = numbers.map((n, i) => ({ id: String(i), text: topic === 'observe' ? time(n, 0) : String(n) }));
        answer = options.map(o => o.id);
        prompt = topic === 'observe' ? 'Xếp giờ trong cùng buổi từ sớm đến muộn' : 'Xếp các số từ nhỏ đến lớn';
    }
    const shuffled = shuffle(options, random);
    if (shuffled.every((o, i) => o.id === answer[i]))
        shuffled.reverse();
    return { ...base, prompt, options: shuffled, answer, explanation: `Thứ tự đúng: ${options.map(o => o.text).join(' → ')}.` };
}
