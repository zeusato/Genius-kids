import * as T from 'three';
import { ASSETS, type AssetId } from '../core/catalog';
type V = [number, number, number];
type Kit = {
    box: (g: T.Group, p: V, size: V, color?: string, r?: V) => unknown;
    ball: (g: T.Group, p: V, size: V, color?: string) => unknown;
    cylinder: (g: T.Group, p: V, radius: number, height: number, color?: string, top?: number, r?: V) => unknown;
    beam: (g: T.Group, a: V, b: V, thickness?: number, color?: string) => unknown;
    roof: (g: T.Group, x: number, y: number, z: number, w: number, d: number, color?: string) => void;
    window: (g: T.Group, x: number, y: number, z: number) => void;
    crate: (g: T.Group, x: number, y: number, z: number, s?: number) => void;
    pot: (g: T.Group, x: number, y: number, z: number, s?: number, flowers?: boolean) => void;
    part: (g: T.Group, geo: T.BufferGeometry, color: string, p?: V, s?: V, r?: V) => unknown;
};
const P = { wood: '#966747', dark: '#503e32', cream: '#e4d9bb', stone: '#999c90', slate: '#536d79', red: '#a65d4d', copper: '#b7794b', iron: '#50616a', blue: '#759baf', green: '#617c58', gold: '#d7b467' };

/** Individually authored silhouettes. Shared parts are joinery/equipment, never a universal house shell. */
export function architecture(id: AssetId, level: number, k: Kit): T.Group {
    const g = new T.Group(), tier = Math.floor(level / 5), a = ASSETS[id];
    const { box, ball, cylinder: cyl, beam, roof, window, crate, pot, part } = k;
    const w = a.width * .86, d = a.depth * .86;
    const slab = (color = P.stone) => box(g, [0, .055, 0], [w, .11, d], color);
    const posts = (width: number, depth: number, h: number, z = 0, x = 0) => {
        for (const xx of [-width / 2, width / 2]) for (const zz of [-depth / 2, depth / 2]) {
            box(g, [x + xx, h / 2, z + zz], [.11, h, .11], P.wood);
            beam(g, [x + xx, h * .68, z + zz], [x + xx * .65, h, z + zz], .045, P.dark);
        }
    };
    const shed = (width: number, depth: number, h: number, color = P.slate, z = 0, x = 0) => {
        posts(width, depth, h, z, x);
        box(g, [x, h + .04, z], [width + .2, .14, depth + .18], color, [.14, 0, 0]);
        for (let i = 0; i < 5; i++) box(g, [x - width / 2 + i * width / 4, h + .13, z], [.035, .035, depth + .16], P.cream, [.14, 0, 0]);
    };
    const fence = (width: number, depth: number, z = 0) => {
        for (const x of [-width / 2, width / 2]) {
            for (let i = 0; i <= 3; i++) box(g, [x, .34, z - depth / 2 + i * depth / 3], [.09, .68, .09], P.cream);
            for (const y of [.24, .49]) box(g, [x, y, z], [.06, .055, depth], P.wood);
        }
        for (const y of [.24, .49]) box(g, [0, y, z + depth / 2], [width, .055, .06], P.wood);
    };
    const barrel = (x: number, z: number, size = .3, color = P.wood, y = 0) => {
        cyl(g, [x, y + size, z], size, size * 2, color, size * .91);
        for (const f of [.3, 1.65]) cyl(g, [x, y + size * f, z], size * 1.02, .045, P.iron);
        cyl(g, [x, y + size * 2 + .02, z], size * .8, .035, P.dark);
    };
    const chimney = (x: number, z: number, h: number, color = P.red, wide = .3) => {
        box(g, [x, h / 2, z], [wide, h, wide], color);
        for (let y = .3; y < h; y += .4) box(g, [x, y, z], [wide + .03, .045, wide + .03], P.cream);
        box(g, [x, h, z], [wide + .15, .12, wide + .15], P.stone);
        box(g, [x, h + .07, z], [wide * .65, .015, wide * .65], P.dark);
    };
    const table = (x: number, z: number, width = .85, y = .65, depth = .45) => {
        box(g, [x, y, z], [width, .12, depth], P.wood);
        for (const xx of [-1, 1]) for (const zz of [-1, 1]) box(g, [x + xx * width * .4, y / 2, z + zz * depth * .35], [.07, y, .07], P.dark);
    };
    const bottle = (x: number, y: number, z: number, color: string, size = .11) => {
        cyl(g, [x, y + size * 1.3, z], size, size * 2.6, color);
        cyl(g, [x, y + size * 2.8, z], size * .55, size * .4, P.cream);
        box(g, [x, y + size * 1.3, z + size], [size * 1.3, size * 1.1, .015], P.cream);
    };
    const awning = (width: number, y: number, z: number, color: string, depth = .6) => {
        for (let i = 0; i < 8; i++) {
            box(g, [-width / 2 + (i + .5) * width / 8, y, z], [width / 8 + .005, .08, depth], i % 2 ? P.cream : color, [.16, 0, 0]);
            box(g, [-width / 2 + (i + .5) * width / 8, y - .12, z + depth / 2], [width / 8, .18, .04], i % 2 ? P.cream : color);
        }
    };
    const wheel = (x: number, y: number, z: number, r = .35, color = P.wood) => {
        part(g, new T.TorusGeometry(r, .045, 5, 16), color, [x, y, z]);
        for (let i = 0; i < 8; i++) beam(g, [x, y, z], [x + Math.cos(i * Math.PI / 4) * r, y + Math.sin(i * Math.PI / 4) * r, z], .022, color);
    };
    const tree = (x: number, z: number, size = 1) => {
        cyl(g, [x, .58 * size, z], .07 * size, 1.16 * size, P.wood, .04 * size);
        for (let j = 0; j < 5; j++) {
            const angle = j * 2.4, xx = x + Math.cos(angle) * .3 * size, zz = z + Math.sin(angle) * .3 * size;
            beam(g, [x, .55 * size, z], [xx, (1 + j % 2 * .22) * size, zz], .035 * size);
            ball(g, [xx, (1.05 + j % 2 * .22) * size, zz], [.37 * size, .3 * size, .34 * size], j % 2 ? '#65834c' : '#789255');
            ball(g, [xx, .96 * size, zz + .28 * size], [.08 * size, .08 * size, .08 * size], '#be6146');
        }
    };
    slab(['orchard', 'herb_garden', 'apiary'].includes(id) ? '#b9ad7c' : '#b5afa0');

    if (id === 'home') {
        const h = 1.12 + tier * .12;
        box(g, [-.35, h / 2, -.3], [1.9, h, 1.65], P.cream);
        roof(g, -.35, h, -.3, 2.13, 1.94, P.slate);
        box(g, [-.85, .4, .55], [.42, .8, .075], P.green); window(g, .15, .78, .55);
        box(g, [-.3, .13, .97], [2.2, .22, .65], '#c6c2aa');
        for (const x of [-1.25, .65]) box(g, [x, .66, 1.15], [.1, 1.1, .1], P.wood);
        box(g, [-.3, 1.25, .96], [2.2, .12, .72], P.slate, [.15, 0, 0]);
        chimney(-.9, -.6, h + .8, P.red, .24); pot(g, .93, .12, 1.15, .85, true);
        if (tier >= 1) { box(g, [1, .59, -.33], [.8, 1.18, 1.5], '#c3c4ae'); roof(g, 1, 1.18, -.33, 1, 1.7, P.slate); window(g, 1, .7, .44); }
        if (tier >= 2) { box(g, [-1.15, h * .65, -.85], [.72, h * 1.3, .8], P.cream); roof(g, -1.15, h * 1.3, -.85, .93, 1, P.green); }
        if (tier >= 3) { box(g, [.6, h + .24, -.3], [.65, .65, .65], P.cream); roof(g, .6, h + .56, -.3, .85, .88, P.slate); window(g, .6, h + .24, .03); }
        if (tier >= 4) { for (const x of [-1.1, .5]) pot(g, x, .2, 1.16, .65, true); beam(g, [-1.25, .65, 1.25], [.65, .65, 1.25], .04, P.cream); }
        if (tier >= 5) { box(g, [0, .08, 1.5], [1.2, .12, .35], P.stone); cyl(g, [1.3, .5, -1.2], .08, 1, P.wood); box(g, [1.3, 1, -1.2], [.4, .28, .25], P.slate); }
    } else if (id === 'warehouse') {
        box(g, [-.3, .7, -.1], [1.65, 1.4, 2.05], '#a67c52');
        // A steep gambrel warehouse, loading door and outside grain silo.
        for (const side of [-1, 1]) {
            box(g, [-.3 + side * .66, 1.64, -.1], [.65, .12, 2.3], P.red, [0, 0, -side * .92]);
            box(g, [-.3 + side * .27, 1.97, -.1], [.65, .12, 2.3], P.red, [0, 0, -side * .38]);
        }
        box(g, [-.3, .68, .94], [1.05, 1.25, .06], P.dark);
        for (const x of [-.7, .1]) { box(g, [x, .68, .98], [.38, 1.2, .035], P.wood); beam(g, [x - .16, .15, 1.02], [x + .16, 1.2, 1.02], .035, P.cream); }
        box(g, [-.3, .16, 1.12], [1.5, .26, .42], P.wood);
        if (tier >= 1) { cyl(g, [.89, .91, -.48], .36, 1.65, '#bcc1b5'); part(g, new T.ConeGeometry(.4, .4, 12), P.slate, [.89, 1.92, -.48]); for (let y = .3; y < 1.7; y += .28) cyl(g, [.89, y, -.48], .365, .03, P.iron); }
        for (let i = 0; i <= Math.min(3, tier); i++) crate(g, .78, .1 + Math.floor(i / 2) * .35, .28 + i % 2 * .47, .44);
    } else if (id === 'sawmill') {
        shed(2.16, 1.2, 1.55, P.green, -.52);
        table(0, .35, 1.95, .65, .58);
        cyl(g, [0, .83, .33], .37, .035, '#b5b9ae', .37, [Math.PI / 2, 0, 0]);
        for (let i = 0; i < 16; i++) box(g, [Math.sin(i * Math.PI / 8) * .37, .83 + Math.cos(i * Math.PI / 8) * .37, .33], [.07, .09, .045], P.iron, [0, 0, -i * Math.PI / 8]);
        for (let i = 0; i < 3 + tier; i++) { const z = .85 + i % 2 * .18, y = .18 + Math.floor(i / 2) * .2; cyl(g, [-.45, y, z], .13, 1.15, P.wood, .13, [0, 0, Math.PI / 2]); cyl(g, [.13, y, z], .09, .015, '#d4b885', .09, [0, 0, Math.PI / 2]); }
        if (tier >= 2) { wheel(.7, .65, -.52, .4, P.iron); beam(g, [.7, .65, -.5], [0, .8, .35], .05, P.iron); }
    } else if (id === 'quarry') {
        for (let i = 0; i < 8; i++) box(g, [-.8 + i % 3 * .44, .25 + Math.floor(i / 3) * .35, -.57], [.5, .4, .6], i % 2 ? '#a8ada1' : '#b8bbae', [0, i * .12, 0]);
        beam(g, [.84, .1, -.65], [.84, 2.1, -.65], .1); beam(g, [.84, 2.08, -.65], [-.5, 1.93, .25], .08); beam(g, [.84, 1.1, -.65], [-.25, 1.97, .1], .045, P.iron);
        beam(g, [-.5, 1.93, .25], [-.5, .8, .25], .015, P.dark); box(g, [-.5, .52, .25], [.58, .55, .5], P.stone);
        if (tier >= 2) for (let i = 0; i < tier; i++) box(g, [.3 + i % 2 * .5, .23 + Math.floor(i / 2) * .3, .8], [.45, .28, .5], '#d0c7ac');
    } else if (id === 'iron_mine') {
        for (let i = 0; i < 7; i++) part(g, new T.DodecahedronGeometry(.54, 0), i % 2 ? '#707d79' : '#8b9388', [Math.cos(i * .6) * .8, .65 + Math.sin(i * .6) * .35, -.5 + Math.sin(i) * .25], [1, 1.2, 1]);
        box(g, [0, .62, .14], [.93, 1.12, .045], '#303b36');
        for (const x of [-.53, .53]) box(g, [x, .62, .2], [.14, 1.23, .15], P.wood);
        box(g, [0, 1.28, .2], [1.25, .17, .18], P.wood);
        for (const x of [-.28, .28]) box(g, [x, .12, .72], [.045, .05, 1.12], P.iron);
        for (let z = .3; z < 1.2; z += .25) box(g, [0, .08, z], [.8, .06, .1], P.wood);
        box(g, [0, .45, .87], [.66, .42, .57], P.iron); for (const x of [-.35, .35]) for (const z of [.68, 1.05]) cyl(g, [x, .19, z], .12, .06, P.dark, .12, [0, 0, Math.PI / 2]);
        if (tier >= 2) { posts(.55, .6, 2.1, -.6, .75); wheel(.75, 2.13, -.58, .28, P.iron); }
    } else if (id === 'smelter') {
        cyl(g, [-.35, .82, -.1], .63, 1.5, P.red, .48); cyl(g, [-.35, 1.67, -.1], .38, .4, P.iron, .26);
        chimney(-.35, -.1, 2.4 + tier * .11, P.iron, .27);
        box(g, [-.35, .39, .52], [.52, .5, .055], P.dark); box(g, [-.35, .39, .56], [.35, .26, .03], '#d89a4c');
        box(g, [.72, .22, .43], [.72, .25, 1.25], P.iron); box(g, [.72, .36, .43], [.48, .04, .9], '#c5a168');
        if (tier >= 1) { cyl(g, [.72, .58, -.73], .28, .9, P.copper); beam(g, [.7, .9, -.7], [-.3, 1.2, -.1], .08, P.iron); }
        if (tier >= 3) chimney(-.95, -.74, 2.1, P.red, .24);
    } else if (id === 'workshop') {
        shed(2.2, 1.3, 1.7, P.slate, -.4);
        box(g, [0, .77, -1.01], [2.2, 1.44, .12], P.wood);
        for (let i = 0; i < 5; i++) { beam(g, [-.8 + i * .4, .7, -.91], [-.8 + i * .4, 1.3, -.91], .025, P.iron); box(g, [-.8 + i * .4, 1.25, -.9], [.22, .12, .06], P.iron); }
        table(-.45, -.15, 1.15); box(g, [.6, .34, .65], [.55, .55, .5], P.wood);
        box(g, [.6, .73, .65], [.78, .21, .36], P.iron); part(g, new T.ConeGeometry(.18, .42, 8), P.iron, [1.07, .74, .65], [1, 1, 1], [0, 0, -Math.PI / 2]);
        if (tier >= 2) { wheel(-.85, .55, .88, .34, P.stone); beam(g, [-.85, .2, .88], [-.85, .55, .88], .07); }
    } else if (id === 'pottery') {
        ball(g, [-.63, .64, -.25], [.61, .67, .67], P.red); chimney(-.67, -.55, 1.9 + tier * .07, P.red, .23);
        box(g, [-.63, .35, .36], [.4, .5, .045], P.dark); part(g, new T.TorusGeometry(.24, .07, 6, 12, Math.PI), P.copper, [-.63, .48, .4]);
        posts(.9, 1.4, 1.55, -.2, .7); box(g, [.7, 1.61, -.2], [1.1, .12, 1.65], P.green, [.2, 0, 0]);
        for (const y of [.48, .92, 1.34]) { box(g, [.73, y, -.6], [.82, .08, .48], P.wood); for (let i = 0; i < 3; i++) { cyl(g, [.43 + i * .28, y + .18, -.6], .11, .25, i % 2 ? P.copper : '#c69a70', .07); } }
        cyl(g, [.45, .32, .73], .1, .55, P.wood); cyl(g, [.45, .64, .73], .34, .1, P.stone); cyl(g, [.45, .83, .73], .16, .3, P.copper, .1);
    } else if (id === 'dairy') {
        box(g, [-.5, .62, -.3], [1.3, 1.16, 1.7], '#dedfd0'); roof(g, -.5, 1.23, -.3, 1.55, 1.95, '#7396a8'); window(g, -.52, .77, .57);
        for (let i = 0; i < 1 + Math.min(2, tier); i++) { const z = -.83 + i * .68; cyl(g, [.68, .7, z], .3, 1.2, '#b8c4bd'); ball(g, [.68, 1.3, z], [.3, .18, .3], '#d1d8c8'); cyl(g, [.68, 1.55, z], .045, .3, P.iron); }
        table(-.38, .96, 1.35, .48); for (let i = 0; i < 4; i++) cyl(g, [-.86 + i * .31, .61, .96], .13, .16, P.gold);
    } else if (id === 'loom') {
        shed(2.2, 1.2, 1.75, '#897d68', -.48);
        for (const x of [-.65, .65]) box(g, [x, .8, .5], [.12, 1.48, .12], P.wood);
        for (const y of [.28, 1.35]) cyl(g, [0, y, .5], .1, 1.5, P.wood, .1, [0, 0, Math.PI / 2]);
        for (let i = 0; i < 18; i++) beam(g, [-.58 + i * .069, .34, .5], [-.58 + i * .069, 1.32, .5], .012, i % 3 ? '#d7c9a3' : '#809ea0');
        box(g, [0, .42, .85], [1.2, .06, .65], '#b4a78b', [.16, 0, 0]);
        for (let i = 0; i < 2 + Math.min(3, tier); i++) cyl(g, [-.8 + i * .37, .47, -.65], .13, .76, ['#b698a8', '#94aaa0', '#cbb47b'][i % 3]);
    } else if (id === 'tailor') {
        box(g, [-.28, .9, -.3], [1.65, 1.7 + tier * .07, 1.6], '#c6b7ab');
        roof(g, -.28, 1.85 + tier * .07, -.3, 1.95, 1.85, '#807b91');
        window(g, -.65, 1.3, .53); window(g, .1, 1.3, .53); awning(2.1, 1.13, .91, '#8e89a4');
        table(-.35, .93, 1.2, .54); box(g, [-.35, .7, .93], [.35, .14, .18], P.iron); box(g, [-.46, .86, .93], [.09, .26, .16], P.iron);
        cyl(g, [.94, .55, .53], .03, 1.1, P.dark); ball(g, [.94, 1.09, .53], [.16, .3, .12], '#d1b997'); part(g, new T.ConeGeometry(.29, .52, 10), '#8b9fab', [.94, .68, .53]);
    } else if (id === 'dyehouse') {
        shed(2.15, .8, 1.72, '#777f81', -.85);
        for (let i = 0; i < 3; i++) { barrel(-.8 + i * .78, .56, .31, P.wood); cyl(g, [-.8 + i * .78, .63, .56], .255, .02, ['#798ca5', '#b17b82', '#bca459'][i]); }
        for (const x of [-1.05, 1.05]) box(g, [x, 1, -.16], [.08, 2, .08], P.wood);
        beam(g, [-1.05, 1.9, -.16], [1.05, 1.9, -.16], .035, P.dark);
        for (let i = 0; i < 4; i++) box(g, [-.78 + i * .51, 1.37, -.14], [.39, .95, .035], ['#8397b6', '#ba8c9a', '#b5a16f', '#8aa58f'][i]);
    } else if (id === 'press') {
        shed(1.25, 1.55, 1.87, P.green, -.25, -.45);
        for (const x of [-.95, .05]) box(g, [x, .83, .32], [.13, 1.6, .15], P.wood);
        box(g, [-.45, 1.55, .32], [1.25, .14, .24], P.dark); cyl(g, [-.45, 1.12, .32], .055, 1.1, P.iron);
        for (let i = 0; i < 9; i++) cyl(g, [-.45, .77 + i * .09, .32], .083, .025, P.iron);
        barrel(-.45, .32, .38); wheel(-.45, 1.64, .32, .28, P.wood);
        for (let i = 0; i < 1 + Math.min(2, tier); i++) barrel(.83, -.72 + i * .71, .28); crate(g, -.85, .1, 1.06, .47);
    } else if (id === 'kitchen' || id === 'preserves') {
        const jam = id === 'preserves';
        box(g, [-.65, .55, -.35], [.95, 1, 1.55], jam ? '#bea697' : '#b1b39d');
        shed(2.2, 1.4, 1.6, jam ? '#9d6571' : P.green, -.35);
        chimney(-.82, -.9, 2.5, jam ? P.red : P.stone, .28);
        if (jam) { cyl(g, [.49, .53, -.27], .43, .8, P.copper, .5); ball(g, [.49, .95, -.27], [.5, .15, .5], P.copper); beam(g, [.49, 1.04, -.27], [.49, 1.46, -.27], .04, P.iron); }
        else { box(g, [.38, .38, -.32], [1, .62, .86], P.stone); for (const x of [.12, .64]) { cyl(g, [x, .8, -.3], .2, .24, P.iron); cyl(g, [x, .94, -.3], .19, .04, P.dark); } }
        table(0, .87, 1.95, .6); for (let i = 0; i < 6; i++) bottle(-.79 + i * .3, .67, .88, jam ? ['#b37964', '#9b657d', '#c2a265'][i % 3] : P.green, .09);
        if (tier >= 2) for (let i = 0; i < 3; i++) pot(g, -.88 + i * .75, .12, 1.1, .5);
    } else if (id === 'icecream') {
        cyl(g, [0, .69, -.23], .85, 1.28, '#c6d7c7', .85);
        part(g, new T.ConeGeometry(1.07, .5, 12), '#9aadb9', [0, 1.53, -.23]);
        box(g, [0, .86, .61], [1.25, .48, .06], P.dark); awning(1.9, 1.2, .85, '#b78d96');
        table(0, .97, 1.5, .54); for (let i = 0; i < 3; i++) cyl(g, [-.45 + i * .45, .69, .97], .15, .14, ['#d1a7a3', '#dac59e', '#aec1ac'][i]);
        part(g, new T.ConeGeometry(.25, .7, 10), '#c7a16e', [.78, 1.85, -.24], [1, 1, 1], [Math.PI, 0, 0]);
        for (let i = 0; i < 1 + Math.min(2, tier); i++) ball(g, [.78, 2.22 + i * .3, -.24], [.27, .25, .27], ['#e0c3aa', '#d4a2ab', '#b6c9a8'][i]);
    } else if (id === 'tea_house') {
        box(g, [0, .17, 0], [3.25, .26, 2.32], '#a39275');
        posts(2.48, 1.68, 1.62, -.14);
        box(g, [0, .87, -.98], [2.48, 1.4, .09], P.cream);
        for (let i = 0; i < 9; i++) box(g, [-1.16 + i * .29, .9, -.91], [.035, 1.22, .035], P.dark);
        // Broad hipped pavilion, raised eaves and a distinct upper cap.
        part(g, new T.ConeGeometry(1.9, .73, 4), P.green, [0, 1.98, -.14], [1, 1, .76], [0, Math.PI / 4, 0]);
        for (const x of [-1.42, 1.42]) beam(g, [x * .83, 1.67, -.14], [x, 1.87, -.14], .07, P.dark);
        if (tier >= 2) { box(g, [0, 2.36, -.14], [.65, .3, .65], P.cream); part(g, new T.ConeGeometry(.7, .38, 4), P.green, [0, 2.68, -.14], [1, 1, .9], [0, Math.PI / 4, 0]); }
        table(-.53, .49, .65, .43, .6); table(.63, .49, .65, .43, .6);
        for (const x of [-.53, .63]) { cyl(g, [x, .58, .48], .13, .18, P.slate); box(g, [x, .2, 1.02], [.66, .12, .3], P.wood); }
        pot(g, -1.35, .3, .77, .9, true);
    } else if (id === 'fairground') {
        posts(2.6, 2.4, 1.55);
        // Alternating roof panels remain real meshes for four-sided viewing.
        for (let i = 0; i < 8; i++) { const wedge = new T.BufferGeometry(); const angle = i * Math.PI / 4; wedge.setAttribute('position', new T.Float32BufferAttribute([0, 2.7, 0, Math.cos(angle + Math.PI / 4) * 1.8, 1.57, Math.sin(angle + Math.PI / 4) * 1.8, Math.cos(angle) * 1.8, 1.57, Math.sin(angle) * 1.8], 3)); wedge.computeVertexNormals(); part(g, wedge, i % 2 ? '#698d92' : '#d3bd86'); }
        cyl(g, [0, 2.9, 0], .04, .5, P.wood); box(g, [.21, 3.09, 0], [.42, .24, .025], P.red);
        for (const x of [-1.12, 1.12]) { box(g, [x, .5, .35], [.55, .85, 1.65], P.wood); for (let j = 0; j < 4; j++) crate(g, x, .94, -.3 + j * .38, .29); }
        for (let i = 0; i < 7; i++) part(g, new T.ConeGeometry(.12, .25, 3), i % 2 ? P.red : P.gold, [-1.2 + i * .4, 1.37 + Math.abs(i - 3) * .04, 1.3], [1, 1, .2], [Math.PI, 0, 0]);
    } else if (id === 'greenhouse') {
        const radius = 1.38, length = 2.25;
        for (let i = 0; i < 8; i++) {
            const t = (i + .5) * Math.PI / 8;
            box(g, [Math.cos(t) * radius, .47 + Math.sin(t) * radius, 0], [radius * Math.PI / 8 + .02, .05, length], i % 2 ? '#a8c7b8' : '#92b8ad', [0, 0, t + Math.PI / 2]);
        }
        for (let z = -length / 2; z <= length / 2; z += length / 5) for (let i = 0; i < 12; i++) { const t = i * Math.PI / 12, n = (i + 1) * Math.PI / 12; beam(g, [Math.cos(t) * radius, .47 + Math.sin(t) * radius, z], [Math.cos(n) * radius, .47 + Math.sin(n) * radius, z], .035, P.cream); }
        for (const x of [-radius, radius]) box(g, [x, .27, 0], [.1, .5, length], P.cream);
        box(g, [0, .68, length / 2 + .03], [.57, 1.15, .06], P.green); window(g, 0, .83, length / 2 + .06);
        for (let i = 0; i < 3 + Math.min(2, tier); i++) pot(g, -1 + i * .48, .08, 1.16, .6, true);
    } else if (id === 'coop' || id === 'sheepfold') {
        const sheep = id === 'sheepfold', houseW = sheep ? 2.25 : 1.2, hh = sheep ? .9 : 1.1;
        fence(w - .12, d - .12); box(g, [-.35, hh / 2 + (sheep ? 0 : .3), -.5], [houseW, hh, .85], sheep ? '#a79170' : '#baa478'); roof(g, -.35, hh + (sheep ? 0 : .3), -.5, houseW + .22, 1.1, sheep ? '#858e73' : '#a45e50');
        box(g, [-.35, sheep ? .44 : .69, -.05], [.42, .56, .04], P.dark);
        if (!sheep) { for (const x of [-.85, .15]) box(g, [x, .18, -.5], [.1, .36, .1], P.wood); box(g, [-.35, .2, .38], [.4, .07, .8], P.wood, [.4, 0, 0]); for (let i = 0; i < 5; i++) box(g, [-.35, .07 + i * .08, .7 - i * .15], [.43, .04, .04], P.dark); }
        for (let i = 0; i < 2 + Math.min(3, tier); i++) { const x = -.95 + i % 3 * .68, z = .55 + Math.floor(i / 3) * .42;
            if (sheep) { for (let j = 0; j < 6; j++) ball(g, [x + Math.cos(j * 2.4) * .13, .36 + j % 2 * .08, z + Math.sin(j * 2.4) * .16], [.2, .2, .2], '#dcd9c7'); ball(g, [x, .36, z + .31], [.12, .14, .16], '#726a5b'); for (const dx of [-.13, .13]) for (const dz of [-.18, .18]) box(g, [x + dx, .13, z + dz], [.05, .23, .05], P.dark); }
            else { ball(g, [x, .25, z], [.13, .15, .18], '#e4d3a5'); ball(g, [x, .43, z + .1], [.085, .09, .085], '#eee4c9'); ball(g, [x, .52, z + .1], [.04, .05, .03], P.red); }
        }
        if (tier >= 2) { box(g, [.86, .24, -.2], [.45, .35, .65], P.gold); for (const z of [-.4, 0]) box(g, [.86, .25, z], [.47, .37, .025], P.dark); }
    } else if (id === 'orchard') {
        fence(w - .1, d - .1);
        for (let i = 0; i < 3 + Math.min(3, tier); i++) tree(-1 + i % 3, -.8 + Math.floor(i / 3) * 1.45, .85 + (i % 2) * .15);
        crate(g, .95, .1, 1.2, .45); if (tier >= 2) { for (const x of [-.22, .22]) beam(g, [x, .1, 1.3], [x, 1.6, .75], .035, P.wood); for (let i = 0; i < 6; i++) beam(g, [-.22, .2 + i * .23, 1.26 - i * .083], [.22, .2 + i * .23, 1.26 - i * .083], .025, P.wood); }
    } else if (id === 'herb_garden') {
        for (let i = 0; i < 4; i++) { const x = (i % 2 - .5) * 1.2, z = (Math.floor(i / 2) - .5) * 1.2; box(g, [x, .18, z], [.95, .27, .95], P.wood); box(g, [x, .33, z], [.8, .025, .8], '#806b4e'); for (let j = 0; j < 5; j++) { const xx = x + Math.cos(j * 2.4) * .25, zz = z + Math.sin(j * 2.4) * .25; ball(g, [xx, .48, zz], [.18, .17, .18], i % 2 ? '#829a69' : '#627c5c'); if (i % 2) { beam(g, [xx, .49, zz], [xx, .83, zz], .015, P.green); ball(g, [xx, .79, zz], [.055, .13, .055], '#9a86ab'); } } }
        if (tier >= 2) { posts(2.15, .4, 1.55, -1); for (let i = 0; i < 7; i++) box(g, [-1 + i / 3, 1.59, -1], [.09, .08, .8], P.wood); }
    } else if (id === 'apiary') {
        for (let i = 0; i < 2 + Math.min(2, tier); i++) { const x = -.87 + i % 2 * 1.48, z = -.44 + Math.floor(i / 2) * .86; box(g, [x, .22, z], [.63, .35, .58], P.wood); for (let j = 0; j < 6; j++) cyl(g, [x, .43 + j * .085, z], .32 - j * .039, .1, j % 2 ? '#c9af6c' : '#d6bd7b'); box(g, [x, .48, z + .28], [.16, .07, .04], P.dark); }
        pot(g, -.02, .05, .63, .75, true);
    } else if (id === 'fishpond') {
        cyl(g, [0, .16, 0], 1, .25, P.stone); // Shaped oval liner rather than another roofed building.
        part(g, new T.CylinderGeometry(1, 1, .12, 32), '#719d98', [0, .26, 0], [1.53, 1, 1.05]);
        for (let i = 0; i < 24; i++) { const t = i * Math.PI / 12; part(g, new T.DodecahedronGeometry(.18, 0), i % 2 ? '#b1b5a1' : '#969f93', [Math.cos(t) * 1.62, .27, Math.sin(t) * 1.12], [1.3, .65, 1]); }
        for (let i = 0; i < 6; i++) box(g, [-1.43, .44, -.6 + i * .23], [.65, .09, .2], P.wood); barrel(1.29, -.87, .22);
        if (tier >= 2) { wheel(.93, .61, -.73, .34, P.wood); beam(g, [.93, .6, -.73], [.93, .6, -.25], .04, P.iron); }
    } else if (id === 'fishing_pier') {
        for (let i = 0; i < 12; i++) box(g, [0, .24, -1.7 + i * .3], [2.6, .13, .27], i % 2 ? '#ac845b' : P.wood);
        for (const x of [-1.15, 1.15]) for (const z of [-1.5, 1.5]) { cyl(g, [x, .2, z], .09, 1, P.wood); cyl(g, [x, .6, z], .105, .09, P.cream); }
        for (const x of [-1.14, 1.14]) beam(g, [x, .68, -.8], [x, .68, 1.45], .035, P.cream);
        crate(g, -.7, .32, 1.05, .55); barrel(.75, .95, .25); beam(g, [.85, .36, .15], [.78, 1.48, .9], .018, P.dark); beam(g, [.78, 1.48, .9], [.6, .06, 1.8], .006, P.cream);
        if (tier >= 1) shed(2.15, .85, 1.55, P.slate, -.96);
        if (tier >= 3) { wheel(-1.02, .72, .35, .28, P.red); box(g, [.95, 1, -1.55], [.22, .35, .22], P.gold); }
    }
    // Small operational storage grows within the plot, not arbitrary gold balls on every roof.
    if (tier >= 3 && ['sawmill', 'workshop', 'loom', 'pottery', 'quarry', 'preserves', 'kitchen', 'press'].includes(id)) crate(g, w * .36, .12, -d * .37, .4 + tier * .02);
    g.name = `architecture:${id}:tier-${tier}`;
    return g;
}
