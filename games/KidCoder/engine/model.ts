export type Direction = 0 | 1 | 2 | 3;
export type Action = 'forward' | 'left' | 'right' | 'scan' | 'activate' | 'push';
export type Sensor = 'clear' | 'sample';
export type Command = Action | 'repeat' | 'if';
export type ProgramNode = { id: string } & ({ type: Action } | { type: 'repeat'; count: number; body: ProgramNode[] } | { type: 'if'; sensor: Sensor; body: ProgramNode[]; otherwise: ProgramNode[] });
export interface Pos { x: number; y: number }
export interface Sample extends Pos { id: string; required: boolean }
export interface Device extends Pos { id: string }
export interface Gate extends Pos { device: string }
export interface Box extends Pos { id: string }
export interface Board {
    size: number; tiles: ('floor' | 'wall' | 'gap')[]; start: Pos; direction: Direction; exit: Pos;
    samples: Sample[]; devices: Device[]; gates: Gate[]; boxes: Box[];
}
export type ChapterId = 'earth' | 'moon' | 'mars' | 'ice' | 'station';
export interface Mission {
    id: string; chapter: ChapterId; number: number; title: string; brief: string; skill: string;
    allowed: Command[]; boards: Board[]; solution: ProgramNode[]; starter?: ProgramNode[];
    blockBudget: number; actionBudget: number; bonus: string; hints: string[]; fact: string;
    seed?: number; practice?: boolean; version: 2;
    concept?: 'repeat' | 'if';
}
export interface World { rover: Pos; direction: Direction; scanned: string[]; activated: string[]; boxes: Box[]; bridges: string[]; actions: number }
export interface Frame { world: World; nodeId: string | null; kind: 'start' | 'action' | 'control' | 'error' | 'end'; message: string; context: string }
export interface RunResult { frames: Frame[]; success: boolean; error?: string; operations: number }
export const LIMITS = { blocks: 48, depth: 2, operations: 256 } as const;
export const VECTORS: Pos[] = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
export const same = (a: Pos, b: Pos) => a.x === b.x && a.y === b.y;
export const key = (p: Pos) => `${p.x},${p.y}`;
export const front = (w: World): Pos => ({ x: w.rover.x + VECTORS[w.direction].x, y: w.rover.y + VECTORS[w.direction].y });
export const initialWorld = (b: Board): World => ({ rover: { ...b.start }, direction: b.direction, scanned: [], activated: [], boxes: b.boxes.map(v => ({ ...v })), bridges: [], actions: 0 });
export const COMMANDS: Record<Command, { label: string; short: string; icon: string; color: string; help: string }> = {
    forward: { label: 'Tiến một ô', short: 'Tiến', icon: '↑', color: '#43bce9', help: 'Rover đi một ô theo mũi tên trên đầu.' },
    left: { label: 'Quay trái', short: 'Trái', icon: '↶', color: '#a78bfa', help: 'Quay trái 90 độ, vẫn đứng tại chỗ.' },
    right: { label: 'Quay phải', short: 'Phải', icon: '↷', color: '#b293f5', help: 'Quay phải 90 độ, vẫn đứng tại chỗ.' },
    scan: { label: 'Quét mẫu', short: 'Quét', icon: '⌁', color: '#f5c65d', help: 'Quét tinh thể ở ô ngay trước mặt. Không cần bước lên tinh thể.' },
    repeat: { label: 'Lặp lại', short: 'Lặp', icon: '⟳', color: '#5fdbb2', help: 'Thực hiện các lệnh bên trong nhiều lần.' },
    if: { label: 'Nếu…', short: 'Nếu', icon: '◇', color: '#f6a974', help: 'Cảm biến chọn nhóm lệnh phù hợp với tình huống.' },
    activate: { label: 'Bật thiết bị', short: 'Bật', icon: 'ϟ', color: '#f9d56e', help: 'Bật thiết bị ngay phía trước để mở cổng liên kết.' },
    push: { label: 'Đẩy kiện hàng', short: 'Đẩy', icon: '▣', color: '#ef9ac1', help: 'Đẩy kiện hàng phía trước một ô và tiến theo. Đẩy vào khe để lắp cầu.' },
};
let serial = 0;
export function newNode(type: Command): ProgramNode {
    const id = `block-${Date.now().toString(36)}-${++serial}`;
    return type === 'repeat' ? { id, type, count: 2, body: [] } : type === 'if' ? { id, type, sensor: 'clear', body: [], otherwise: [] } : { id, type };
}
export function copyProgram(nodes: ProgramNode[]): ProgramNode[] {
    return nodes.map(n => n.type === 'repeat' ? { ...n, id: newNode(n.type).id, body: copyProgram(n.body) } : n.type === 'if' ? { ...n, id: newNode(n.type).id, body: copyProgram(n.body), otherwise: copyProgram(n.otherwise) } : { ...n, id: newNode(n.type).id });
}
export function countBlocks(nodes: ProgramNode[]): number {
    return nodes.reduce((s, n) => s + 1 + (n.type === 'repeat' || n.type === 'if' ? countBlocks(n.body) : 0) + (n.type === 'if' ? countBlocks(n.otherwise) : 0), 0);
}
export function hasCommand(nodes: ProgramNode[], type: Command): boolean {
    return nodes.some(n => n.type === type || ((n.type === 'repeat' || n.type === 'if') && hasCommand(n.body, type)) || (n.type === 'if' && hasCommand(n.otherwise, type)));
}
/** Validate untrusted drafts, including bounds before recursion. Empty groups are editable, not executable. */
export function validateProgram(input: unknown, allowed: Command[], editing = false): string | null {
    let total = 0; const ids = new Set<string>();
    function visit(value: unknown, depth: number): string | null {
        if (!Array.isArray(value)) return 'Chương trình chưa đúng định dạng.';
        for (const raw of value) {
            if (++total > LIMITS.blocks) return `Chương trình tối đa ${LIMITS.blocks} khối. Thử gom lệnh vào vòng lặp nhé!`;
            if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || raw.id.length > 100 || ids.has(raw.id)) return 'Mã khối lệnh không hợp lệ.';
            ids.add(raw.id);
            if (!allowed.includes(raw.type)) return 'Có lệnh chưa được mở trong nhiệm vụ này.';
            if (raw.type === 'repeat' || raw.type === 'if') {
                if (depth >= LIMITS.depth) return 'Chỉ đặt tối đa hai tầng nhóm lệnh.';
                if (raw.type === 'repeat' && (!Number.isInteger(raw.count) || raw.count < 2 || raw.count > 6)) return 'Số lần lặp cần từ 2 đến 6.';
                if (raw.type === 'if' && raw.sensor !== 'clear' && raw.sensor !== 'sample') return 'Cảm biến chưa hợp lệ.';
                const e = visit(raw.body, depth + 1); if (e) return e;
                if (raw.type === 'repeat' && !editing && !raw.body.length) return 'Thêm ít nhất một lệnh vào nhóm Lặp nhé.';
                if (raw.type === 'if') {
                    const other = visit(raw.otherwise, depth + 1); if (other) return other;
                    if (!editing && !raw.body.length && !raw.otherwise.length) return 'Thêm lệnh vào một nhánh Nếu nhé.';
                }
            }
        }
        return null;
    }
    return visit(input, 0);
}
