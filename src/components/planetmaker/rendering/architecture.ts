import { Building, BUILDINGS, floorsOf, footprint, heightAt, port, Region } from '../engine/region';

export type Shape = 'box' | 'cone' | 'sphere' | 'cylinder' | 'gable';
export interface Instance { position: [number, number, number]; scale: [number, number, number]; yaw?: number; pitch?: number; color: string; id?: string }
export const emptyInstances = (): Record<Shape, Instance[]> => ({ box: [], cone: [], sphere: [], cylinder: [], gable: [] });
export const buildingHeight = (b: Building) => BUILDINGS[b.type].h * floorsOf(b) + (b.type === 'observatory' ? 1.9 : 1.2);
/** Parts are authored in building-local coordinates. Rotate the complete building once. */
export function buildingInstances(b: Building, shapes = emptyInstances()) {
    const s = BUILDINGS[b.type], [fw, fd] = footprint(b.type, b.yaw), cx = b.x + fw / 2 - 32, cz = b.z + fd / 2 - 32;
    const w = s.w, d = s.d, angle = b.yaw * Math.PI / 2, co = Math.cos(angle), si = Math.sin(angle), style = b.style ?? 0, floors = floorsOf(b);
    const cream = style === 1 ? '#e2edf0' : '#fff0d5', trim = style === 2 ? '#487f69' : style === 1 ? '#3a6075' : '#a35d48';
    const add = (shape: Shape, x: number, y: number, z: number, scale: [number, number, number], color: string, yaw = 0, pitch = 0) => shapes[shape].push({ position: [cx + x * co + z * si, b.foundation + y, cz - x * si + z * co], scale, yaw: angle + yaw, pitch, color, id: b.id });
    add('box', 0, .025, 0, [w, .15, d], '#c7b9a3');
    if (['home', 'school', 'observatory'].includes(b.type)) {
        const bw = w - .36, bd = d - .38, h = s.h * floors;
        add('box', 0, h / 2 + .12, 0, [bw, h, bd], b.color);
        for (let level = 0; level < floors; level++) {
            const y = level * s.h;
            add('box', 0, y + .16, 0, [bw + .1, .12, bd + .1], cream);
            const columns = b.type === 'home' ? 2 : 3;
            for (let column = 0; column < columns; column++) {
                const x = (column - (columns - 1) / 2) * bw / columns;
                for (const side of [-1, 1]) {
                    add('box', x, y + s.h * .62, side * (bd / 2 + .025), [bw / columns * .58, s.h * .4, .07], cream);
                    add('box', x, y + s.h * .62, side * (bd / 2 + .07), [bw / columns * .45, s.h * .3, .035], '#78bbcf');
                    if (style === 0) add('box', x, y + s.h * .62, side * (bd / 2 + .09), [.035, s.h * .3, .025], cream);
                }
            }
            for (const side of [-1, 1]) add('box', side * (bw / 2 + .03), y + s.h * .6, 0, [.055, s.h * .35, bd * .4], '#a2d3dc');
            if (style === 1 && level > 0) {
                add('box', 0, y + .24, bd / 2 + .16, [bw - .12, .13, .34], cream);
                add('box', 0, y + .47, bd / 2 + .3, [bw - .12, .27, .04], '#87b7ba');
            }
            if (style === 2) for (const side of [-1, 1]) { add('box', side * bw * .3, y + .4, bd / 2 + .1, [.42, .16, .19], '#a7744c'); add('sphere', side * bw * .3, y + .54, bd / 2 + .12, [.4, .22, .24], '#69a56a'); }
        }
        add('box', 0, .54, bd / 2 + .04, [b.type === 'school' ? .72 : .38, .86, .09], trim);
        add('box', 0, .08, bd / 2 + .08, [.78, .1, .28], cream);
        add('box', 0, 1.02, bd / 2 + .12, [b.type === 'school' ? 1.25 : .8, .12, .34], trim);
        if (b.type === 'observatory') {
            add('cylinder', 0, h + .25, 0, [bw + .08, .28, bd + .08], cream);
            add('sphere', 0, h + .45, 0, [bw, 1.55, bd], style === 1 ? '#99becd' : '#e1d7ef');
            add('cylinder', 0, h + 1.12, .45, [.28, 1.25, .28], trim, 0, Math.PI / 3);
            add('sphere', 0, h + 1.45, .98, [.34, .32, .32], '#78bad1');
        } else {
            const roofColor = style === 2 ? '#497b5c' : style === 1 ? '#426b85' : '#bd6e58';
            if (b.roof === 0) add('gable', 0, h + .49, 0, [w - .04, .78, d - .04], roofColor);
            else if (b.roof === 1) { add('box', 0, h + .19, 0, [w - .04, .2, d - .04], roofColor); for (const side of [-1, 1]) add('box', side * (w / 2 - .1), h + .37, 0, [.12, .25, d - .1], cream); }
            else { add('box', 0, h + .17, 0, [w - .04, .12, d - .04], cream); add('sphere', 0, h + .2, 0, [w - .1, 1.05, d - .1], roofColor); }
            if (style === 0 && b.type === 'home') add('box', bw * .27, h + .75, -bd * .25, [.22, .6, .26], cream);
            if (style === 2 && b.roof === 1) { add('box', 0, h + .33, 0, [bw * .65, .1, bd * .6], '#6fa35a'); add('sphere', -.3, h + .57, 0, [.5, .45, .5], '#7db061'); }
        }
        if (b.type === 'school') {
            add('box', 0, 1.43, bd / 2 + .1, [1.4, .32, .09], '#4e8999');
            add('box', -.3, 1.43, bd / 2 + .16, [.24, .19, .035], '#ffe3a0');
            add('box', .15, 1.43, bd / 2 + .16, [.4, .07, .035], '#ffe3a0');
            add('cylinder', w / 2 - .12, 1.45, d / 2 - .15, [.055, 2.8, .055], '#eef0e5');
            add('box', w / 2 - .35, 2.58, d / 2 - .15, [.48, .34, .035], style === 2 ? '#75c298' : '#eb9f68');
        }
    } else if (b.type === 'park') {
        add('box', 0, .14, 0, [w - .14, .14, d - .14], '#83b577');
        add('box', 0, .23, 0, [.6, .04, d - .2], '#e6d2aa');
        add('box', 0, .24, 0, [w - .2, .04, .6], '#e6d2aa');
        if (style === 1) { add('cylinder', 0, .33, 0, [1, .25, 1], '#c7dcdf'); add('cylinder', 0, .47, 0, [.76, .05, .76], '#69bed4'); add('sphere', 0, .68, 0, [.15, .42, .15], '#a3e2ea'); }
        else { add('cylinder', -.7, .55, -.65, [.14, .8, .14], '#8a6a48'); add('sphere', -.7, 1.3, -.65, [1, 1.25, 1], '#4e936e'); add('sphere', .8, .7, -.65, [.65, .7, .65], '#79a45e'); }
        for (const x of [-.85, .85]) { add('box', x, .43, .7, [.55, .12, .25], b.color); add('box', x, .6, .79, [.55, .32, .06], trim); for (const dx of [-.19, .19]) add('box', x + dx, .3, .7, [.05, .25, .15], '#726855'); }
        for (const x of [-1.1, 1.1]) add('sphere', x, .34, -1.05, [.32, .22, .32], style === 2 ? '#eaba83' : '#de99b3');
    } else if (b.type === 'farm') {
        add('box', -.95, .65, -.45, [1.2, 1.1, 1.35], b.color); add('gable', -.95, 1.4, -.45, [1.35, .48, 1.5], trim); add('box', -.95, .53, .24, [.6, .8, .06], '#faf0d1');
        add('cylinder', -1.43, .65, .92, [.42, 1, .42], '#bfc8be');
        for (let row = 0; row < 4; row++) { add('box', .8, .2, (row - 1.5) * .56, [1.8, .12, .3], '#9c7850'); for (let col = 0; col < 5; col++) add(style === 1 ? 'sphere' : 'cone', .12 + col * .34, .45, (row - 1.5) * .56, [.23, .44, .23], style === 2 ? '#9cba62' : '#dfbd58'); }
        for (const x of [-1.8, 1.8]) add('box', x, .34, 1.3, [.09, .6, .09], cream);
        add('box', 0, .48, 1.3, [3.6, .08, .06], cream);
    } else if (b.type === 'water') {
        for (const x of [-.55, .55]) for (const z of [-.55, .55]) add('box', x, .72, z, [.12, 1.4, .12], trim);
        add('cylinder', 0, 1.62, 0, [1.55, 1.15, 1.55], b.color); add('cylinder', 0, 1.18, 0, [1.61, .14, 1.61], cream); add('cone', 0, 2.31, 0, [1.68, .36, 1.68], style === 1 ? '#426b85' : cream);
        add('box', .79, .9, 0, [.07, 1.8, .1], cream); for (let n = 0; n < 7; n++) add('box', .8, .2 + n * .22, .12, [.08, .05, .35], cream);
        add('sphere', 0, 1.67, .77, [.25, .4, .07], '#e4f5ed');
    } else if (b.type === 'solar') {
        for (const x of [-.75, .75]) { add('box', x, .36, 0, [.1, .55, 1.25], '#97aaa7'); add('box', x, .68, 0, [1.25, .1, 1.55], style === 2 ? '#346c78' : '#315888', 0, -.17); for (let i = -1; i <= 1; i++) { add('box', x + i * .36, .75, 0, [.025, .025, 1.5], '#a0cfdb'); add('box', x, .75, i * .45, [1.22, .025, .025], '#a0cfdb'); } }
        add('box', 0, .28, .83, [.35, .4, .24], b.color);
        if (style === 1) { add('box', -1.22, .46, .77, [.34, .65, .32], '#dbe7e5'); add('box', -1.22, .59, .94, [.23, .22, .025], '#67b9cd'); }
    } else if (b.type === 'landing') {
        add('cylinder', 0, .22, 0, [3.5, .22, 3.5], b.color); add('cylinder', 0, .35, 0, [2.9, .04, 2.9], '#536f81');
        for (const x of [-.55, .55]) add('box', x, .39, 0, [.19, .04, 1.5], '#f2e6b5'); add('box', 0, .39, 0, [1.25, .04, .19], '#f2e6b5');
        for (const x of [-1.5, 1.5]) for (const z of [-1.5, 1.5]) { add('box', x, .33, z, [.18, .45, .18], trim); add('sphere', x, .62, z, [.23, .2, .23], '#f7d68c'); }
        if (style > 0) { add('box', -1.35, .65, -.85, [.55, 1, .65], cream); add('box', -1.35, .95, -.5, [.45, .32, .04], '#80c0cf'); }
    }
    return shapes;
}
export function townInstances(r: Region) {
    const shapes = emptyInstances();
    for (const b of r.buildings) { buildingInstances(b, shapes); const [x, z] = port(b); shapes.box.push({ position: [x + .5 - 32, heightAt(r, x + .5, z + .5) + .055, z + .5 - 32], scale: [.38, .04, .38], color: '#ffe798', id: b.id }); }
    return shapes;
}
