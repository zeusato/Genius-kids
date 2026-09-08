import { Action, Board, Command, Frame, LIMITS, Mission, Pos, ProgramNode, RunResult, Sensor, World, countBlocks, front, initialWorld, key, same, validateProgram } from './model';

export function walkable(b: Board, w: World, p: Pos): boolean {
    if (p.x < 0 || p.y < 0 || p.x >= b.size || p.y >= b.size) return false;
    const tile = b.tiles[p.y * b.size + p.x];
    return tile !== 'wall' && (tile !== 'gap' || w.bridges.includes(key(p))) &&
        !w.boxes.some(v => same(v, p)) && !b.samples.some(v => same(v, p)) && !b.devices.some(v => same(v, p)) &&
        !b.gates.some(v => same(v, p) && !w.activated.includes(v.device));
}
export function sense(b: Board, w: World, sensor: Sensor): boolean {
    return sensor === 'clear' ? walkable(b, w, front(w)) : b.samples.some(s => same(s, front(w)) && !w.scanned.includes(s.id));
}
export function transition(b: Board, w: World, action: Action): { world: World; error?: string } {
    const next: World = { ...w, actions: w.actions + 1 }, p = front(w);
    if (action === 'left' || action === 'right') next.direction = ((w.direction + (action === 'left' ? 3 : 1)) % 4) as World['direction'];
    else if (action === 'forward') {
        if (!walkable(b, w, p)) return { world: w, error: 'Phía trước đang bị chặn. Xem mũi tên của rover rồi thử quay hoặc dùng lệnh phù hợp nhé.' };
        next.rover = p;
    } else if (action === 'scan') {
        const sample = b.samples.find(s => same(s, p) && !w.scanned.includes(s.id));
        if (!sample) return { world: w, error: 'Chưa có mẫu mới ở trước mặt. Đứng cạnh tinh thể, quay về phía nó rồi Quét nhé.' };
        next.scanned = [...w.scanned, sample.id];
    } else if (action === 'activate') {
        const device = b.devices.find(s => same(s, p));
        if (!device) return { world: w, error: 'Thiết bị cần ở ô ngay trước mặt rover. Kiểm tra vị trí và hướng nhé.' };
        next.activated = w.activated.includes(device.id) ? w.activated : [...w.activated, device.id];
    } else if (action === 'push') {
        const box = w.boxes.find(s => same(s, p));
        if (!box) return { world: w, error: 'Chưa có kiện hàng phía trước để đẩy. Rover cần đứng ngay sau kiện hàng.' };
        const dest = { x: p.x + p.x - w.rover.x, y: p.y + p.y - w.rover.y };
        const openGap = dest.x >= 0 && dest.y >= 0 && dest.x < b.size && dest.y < b.size && b.tiles[dest.y * b.size + dest.x] === 'gap' &&
            !w.boxes.some(s => same(s, dest)) && !b.samples.some(s => same(s, dest)) && !b.devices.some(s => same(s, dest)) && !b.gates.some(s => same(s, dest));
        if (!walkable(b, w, dest) && !openGap) return { world: w, error: 'Kiện hàng không còn chỗ phía trước. Thử tìm một hướng đẩy khác nhé.' };
        next.rover = p;
        if (openGap && !w.bridges.includes(key(dest))) {
            next.boxes = w.boxes.filter(v => v.id !== box.id); next.bridges = [...w.bridges, key(dest)];
        } else next.boxes = w.boxes.map(v => v.id === box.id ? { ...v, ...dest } : v);
    }
    return { world: next };
}
export function goalError(b: Board, w: World): string | null {
    const remaining = b.samples.filter(v => v.required && !w.scanned.includes(v.id)).length;
    if (remaining) return `Còn ${remaining} mẫu cần quét. Thêm đường đi tới tinh thể trước khi về trạm nhé.`;
    if (b.devices.some(v => !w.activated.includes(v.id))) return 'Còn thiết bị chưa bật. Tìm cột điện màu vàng nhé.';
    if (!same(w.rover, b.exit)) return 'Chương trình đã hết, rover chưa về bến sáng. Thêm vài lệnh hoặc chỉnh lại đường đi nhé.';
    return null;
}

/** Pure bounded interpreter. Snapshots preserve source and loop context for scrubbing. */
export function execute(board: Board, program: ProgramNode[], allowed: Command[]): RunResult {
    let world = initialWorld(board), operations = 0, error: string | undefined;
    const frames: Frame[] = [{ world, nodeId: null, kind: 'start', message: 'Rover đã sẵn sàng.', context: '' }];
    const invalid = validateProgram(program, allowed) || (!program.length ? 'Thêm một lệnh để rover bắt đầu nhé.' : null);
    if (invalid) return { frames: [...frames, { world, nodeId: null, kind: 'error', message: invalid, context: '' }], success: false, error: invalid, operations };
    function tick(n: ProgramNode, context: string): boolean {
        if (++operations <= LIMITS.operations) return true;
        error = 'Chuyến đi quá dài. Rút gọn số lượt lặp rồi thử lại nhé.';
        frames.push({ world, nodeId: n.id, kind: 'error', message: error, context }); return false;
    }
    function visit(nodes: ProgramNode[], context: string): void {
        for (const n of nodes) {
            if (error || !tick(n, context)) return;
            if (n.type === 'repeat') {
                for (let i = 1; i <= n.count; i++) {
                    if (!tick(n, context)) return;
                    const c = `${context ? context + ' · ' : ''}Lặp ${i}/${n.count}`;
                    frames.push({ world, nodeId: n.id, kind: 'control', message: `Bắt đầu lượt ${i} trong ${n.count} lượt.`, context: c });
                    visit(n.body, c); if (error) return;
                }
            } else if (n.type === 'if') {
                const yes = sense(board, world, n.sensor);
                frames.push({ world, nodeId: n.id, kind: 'control', message: `${n.sensor === 'clear' ? 'Phía trước đi được' : 'Có mẫu chưa quét'}: ${yes ? 'Đúng → nhánh Nếu' : 'Sai → nhánh Không thì'}.`, context });
                visit(yes ? n.body : n.otherwise, context);
            } else {
                const moved = transition(board, world, n.type); world = moved.world; error = moved.error;
                frames.push({ world, nodeId: n.id, kind: error ? 'error' : 'action', message: error || ({ forward: 'Tiến một ô.', left: 'Quay trái tại chỗ.', right: 'Quay phải tại chỗ.', scan: 'Đã lưu một mẫu mới vào sổ khám phá!', activate: 'Thiết bị đã bật. Cổng liên kết đã mở!', push: 'Đã đẩy kiện hàng.' }[n.type]), context });
            }
        }
    }
    visit(program, '');
    if (!error) {
        error = goalError(board, world) || undefined;
        frames.push({ world, nodeId: null, kind: error ? 'error' : 'end', message: error || 'Hoàn thành chuyến thám hiểm!', context: '' });
    }
    return { frames, success: !error, error, operations };
}
export function evaluate(mission: Mission, program: ProgramNode[]) {
    const runs = mission.boards.map(b => execute(b, program, mission.allowed));
    const success = runs.every(r => r.success), blocks = validateProgram(program, mission.allowed, true) ? 49 : countBlocks(program);
    const actions = Math.max(...runs.map(r => r.frames.at(-1)!.world.actions));
    const conceptIds = new Set<string>();
    const findConcept = (nodes: ProgramNode[]) => { for (const n of nodes) { if (n.type === mission.concept) conceptIds.add(n.id); if (n.type === 'repeat' || n.type === 'if') findConcept(n.body); if (n.type === 'if') findConcept(n.otherwise); } };
    if (success && mission.concept) findConcept(program);
    const usesConcept = !mission.concept || runs.some(r => r.frames.some(f => f.kind === 'control' && f.nodeId && conceptIds.has(f.nodeId)));
    const badges = success ? ['complete', ...(actions <= mission.actionBudget ? ['explorer'] : []), ...(blocks <= mission.blockBudget && usesConcept ? ['coder'] : [])] : [];
    return { runs, success, blocks, actions, badges };
}

/** Shortest rover-action path; deliberately not a shortest structured-program claim. */
export function solveBoard(board: Board, allowed: Command[], maxStates = 100000, budgetMs = 250): { status: 'solved' | 'unsolvable' | 'budgetExceeded'; actions?: Action[]; visited: number } {
    const startTime = performance.now(), actions = allowed.filter(a => a !== 'repeat' && a !== 'if') as Action[];
    const stateKey = (w: World) => `${key(w.rover)}/${w.direction}/${[...w.scanned].sort()}/${[...w.activated].sort()}/${w.boxes.map(b => `${b.id}:${key(b)}`).sort()}/${[...w.bridges].sort()}`;
    const queue: { w: World; parent: number; action?: Action }[] = [{ w: initialWorld(board), parent: -1 }], seen = new Set([stateKey(queue[0].w)]);
    for (let index = 0; index < queue.length; index++) {
        if (seen.size > maxStates || performance.now() - startTime > budgetMs) return { status: 'budgetExceeded', visited: seen.size };
        const item = queue[index];
        if (!goalError(board, item.w)) {
            const path: Action[] = []; let i = index;
            while (queue[i].parent !== -1) { path.push(queue[i].action!); i = queue[i].parent; }
            return { status: 'solved', actions: path.reverse(), visited: seen.size };
        }
        for (const a of actions) {
            const next = transition(board, item.w, a); if (next.error) continue;
            const k = stateKey(next.world); if (seen.has(k)) continue;
            seen.add(k); queue.push({ w: next.world, parent: index, action: a });
        }
    }
    return { status: 'unsolvable', visited: seen.size };
}
