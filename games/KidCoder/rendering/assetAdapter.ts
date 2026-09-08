import { Board, ChapterId, World, key } from '../engine/model';
import { CHAPTERS } from '../content/campaign';
import { buildingInstances, emptyInstances } from '../../../src/components/planetmaker/rendering/architecture';

export function terrainParts(board: Board, chapter: ChapterId, detailed: boolean) {
    const p = emptyInstances(), theme = CHAPTERS.find(c => c.id === chapter)!, n = board.size;
    const box = (x: number, y: number, z: number, scale: [number, number, number], color: string) => p.box.push({ position: [x, y, z], scale, color });
    box(0, -.35, 0, [n + .18, .6, n + .18], theme.rock);
    box(0, -.04, 0, [n + .28, .12, n + .28], '#253b4c');
    board.tiles.forEach((tile, i) => {
        const x = i % n - n / 2 + .5, z = Math.floor(i / n) - n / 2 + .5;
        if (tile === 'gap') { box(x, .015, z, [.97, .06, .97], '#152333'); return; }
        if (tile === 'floor') {
            box(x, .06, z, [.94, .15, .94], (i + Math.floor(i / n)) % 2 ? '#d5dfdc' : '#c4d2d0');
            if (detailed) for (const dx of [-.34, .34]) box(x + dx, .145, z + .34, [.035, .018, .035], '#7a939e');
        } else {
            const height = .18 + (i * 17 % 5) * .04;
            box(x, height / 2 + .04, z, [.98, height, .98], theme.ground);
            const nearRoad = [-1,1,-n,n].some(d => i + d >= 0 && i + d < n*n && board.tiles[i+d] === 'floor');
            if (i % 3 === 0 && !nearRoad) {
                const tree = chapter === 'earth';
                if (tree) box(x, height + .19, z, [.08, .38, .08], '#725947');
                p[tree ? 'cone' : 'sphere'].push({ position: [x, height + (tree ? .5 : .13), z], scale: tree ? [.65,.8,.65] : [.55,.38,.48], color: tree ? '#3b816c' : theme.rock, yaw: i });
            }
        }
    });
    // Reuse the town's local model parts, then map its 64-cell coordinates into a small prop.
    if (detailed) {
        const model = buildingInstances({ id: 'station-prop', type: chapter === 'station' ? 'observatory' : 'solar', x: 30.5, z: 31, yaw: 0, color: theme.color, roof: 0, foundation: 0, floors: 1, style: 1 });
        for (const shape of Object.keys(model) as (keyof typeof model)[]) for (const part of model[shape]) p[shape].push({ ...part,
            position: [part.position[0] * .34 + n / 2 - 1, part.position[1] * .34 + .24, part.position[2] * .34 - n / 2 + .65],
            scale: part.scale.map(v => v * .34) as [number, number, number] });
    }
    return p;
}
export function objectParts(board: Board, world: World) {
    const p = emptyInstances(), offset = board.size / 2 - .5;
    const box = (x: number, y: number, z: number, scale: [number,number,number], color: string) => p.box.push({ position: [x-offset, y, z-offset], scale, color });
    for (const s of board.samples) {
        const scanned = world.scanned.includes(s.id), color = scanned ? '#82c9b4' : '#ffcd65';
        p.cone.push({ position: [s.x-offset, .42, s.y-offset], scale: [.45,.62,.45], color });
        p.cone.push({ position: [s.x-offset+.19, .3, s.y-offset+.11], scale: [.22,.32,.22], color, roll: .3 });
        box(s.x,.16,s.y,[.64,.12,.64],scanned ? '#5c9c94' : '#846e6c');
    }
    for (const d of board.devices) {
        const active = world.activated.includes(d.id);
        box(d.x,.35,d.y,[.48,.5,.4],'#e7e3cb'); box(d.x,.53,d.y-.21,[.32,.24,.025],active ? '#6bedd0' : '#f4bd52');
        p.cylinder.push({ position: [d.x-offset,.76,d.y-offset], scale: [.09,.35,.09], color: '#a8c3d0' });
        p.sphere.push({ position: [d.x-offset,.94,d.y-offset], scale: [.15,.15,.15], color: active ? '#6bedd0' : '#f4bd52' });
    }
    for (const gate of board.gates) {
        const opened = world.activated.includes(gate.device), horizontal = board.tiles[gate.y * board.size + gate.x - 1] === 'floor';
        for (const side of [-.42,.42]) box(gate.x + (horizontal ? 0 : side), .35, gate.y + (horizontal ? side : 0), [.09,.5,.09], '#8ba9bb');
        box(gate.x,opened ? .18 : .57,gate.y,horizontal ? [.08,.1,.8] : [.8,.1,.08],opened ? '#6de1b7' : '#ff9782');
    }
    for (const b of world.boxes) {
        box(b.x,.38,b.y,[.58,.48,.58],'#dfaa68'); box(b.x,.39,b.y,[.6,.5,.09],'#755c55'); box(b.x,.63,b.y,[.12,.02,.6],'#f6d393');
    }
    board.tiles.forEach((v,i) => { const pos = { x: i % board.size, y: Math.floor(i / board.size) }; if (v === 'gap' && world.bridges.includes(key(pos))) {
        box(pos.x,.13,pos.y,[.95,.14,.95],'#d4b381'); for (const x of [-.3,0,.3]) box(pos.x+x,.21,pos.y,[.03,.02,.94],'#856b56');
    } });
    return p;
}
export function roverParts(color: string) {
    const p = emptyInstances();
    const box = (position: [number,number,number], scale: [number,number,number], c: string) => p.box.push({ position, scale, color: c });
    box([0,.31,0],[.46,.21,.61],color); box([0,.19,0],[.4,.09,.48],'#263c51');
    box([0,.48,-.14],[.38,.21,.32],'#e8eee4'); box([0,.5,-.307],[.29,.12,.035],'#233e55');
    for (const x of [-.085,.085]) box([x,.5,-.33],[.045,.05,.025],'#85f4e0');
    box([0,.44,.2],[.35,.035,.22],'#497792');
    p.cylinder.push({ position: [.16,.62,.2], scale: [.035,.4,.035], color: '#e7e0cb' });
    p.sphere.push({ position: [.16,.84,.2], scale: [.09,.09,.09], color });
    return p;
}
