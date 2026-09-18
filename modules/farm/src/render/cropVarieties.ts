import * as T from 'three';
import { NEW_CROP_IDS, type CropId } from '../core/catalog';
type V = [number, number, number];
type Kit = {
    ball: (g: T.Group, p: V, size: V, color: string) => unknown;
    cylinder: (g: T.Group, p: V, radius: number, height: number, color: string, top?: number, r?: V) => unknown;
    beam: (g: T.Group, a: V, b: V, thickness: number, color: string) => unknown;
    leaf: (g: T.Group, p: V, length: number, width: number, angle: number, color: string, lift?: number) => void;
};

/** Authored silhouettes for the second seed collection. Shared primitives are baked by models.ts. */
export function cropVariety(g: T.Group, id: CropId, stage: number, k: Kit) {
    if (!(NEW_CROP_IDS as readonly string[]).includes(id)) return false;
    const { ball, cylinder, beam, leaf } = k, ripe = stage === 4, mature = stage >= 3;
    const green = '#507d45', light = '#8cad59', stem = '#618248', scale = stage === 2 ? .62 : stage === 3 ? .84 : 1;
    const rosette = (x: number, z: number, n: number, length: number, width: number, y = .035, lift = .13) => {
        for (let i = 0; i < n; i++) leaf(g, [x, y, z], length * scale, width * scale, i * Math.PI * 2 / n, i % 2 ? green : light, lift * scale);
    };
    if (id === 'lettuce') {
        for (const [x, z] of [[-.22, -.18], [.22, .18]]) {
            rosette(x, z, 8, .24, .12, .03, .18);
            ball(g, [x, .11 * scale, z], [.13 * scale, .12 * scale, .13 * scale], '#a7c674');
            for (let i = 0; i < 5; i++) leaf(g, [x, .1 * scale, z], .13 * scale, .07, i * 1.26, '#b9ce87', .1 * scale);
        }
    } else if (id === 'radish' || id === 'onion') {
        for (const [x, z] of [[-.23, -.17], [.23, -.17], [0, .22]]) {
            if (mature) {
                ball(g, [x, .065, z], [.105 * scale, .1 * scale, .105 * scale], id === 'radish' ? ripe ? '#ce526e' : '#b28785' : '#d7ac70');
                if (id === 'radish') beam(g, [x, .03, z + .06], [x + .02, .014, z + .17], .012, '#ece1bc');
            }
            if (id === 'radish') rosette(x, z, 5, .19, .075, .13, .19);
            else for (let i = 0; i < 5; i++) {
                const a = i * 2.4;
                beam(g, [x, .12, z], [x + Math.sin(a) * .085, (.37 + i % 2 * .08) * scale, z + Math.cos(a) * .07], .012, i % 2 ? green : '#99b581');
            }
        }
    } else if (id === 'potato') {
        for (const [x, z] of [[-.19, -.15], [.19, .16]]) {
            const h = .43 * scale;
            beam(g, [x, .01, z], [x + .03, h, z], .018, stem);
            for (let i = 0; i < 5; i++) leaf(g, [x, h * (.22 + i * .14), z], .2, .08, i * 2.4, i % 2 ? green : light, .06);
            if (stage === 3) for (let i = 0; i < 5; i++) ball(g, [x + Math.sin(i * 1.26) * .045, h, z + Math.cos(i * 1.26) * .045], [.035, .025, .035], '#d9c9e2');
            if (ripe) for (let i = 0; i < 3; i++) ball(g, [x + (i - 1) * .09, .04, z + .15], [.067, .044, .055], i % 2 ? '#b38b57' : '#c6a16c');
        }
    } else if (id === 'cucumber') {
        for (const x of [-.31, .31]) beam(g, [x, 0, -.08], [x, .95, -.08], .022, '#967347');
        for (const y of [.3, .6, .88]) beam(g, [-.31, y, -.08], [.31, y, -.08], .014, '#b89a65');
        for (let i = 0; i < 7; i++) {
            const y = (.13 + i * .105) * scale, x = Math.sin(i * 1.8) * .2;
            if (i) beam(g, [Math.sin((i - 1) * 1.8) * .2, y - .105 * scale, 0], [x, y, 0], .012, green);
            leaf(g, [x, y, .01], .2, .1, i * 2.4, i % 2 ? light : green, .09);
            if (mature && i % 2 === 0) ball(g, [x, y - .06, .075], [.043, .13 * scale, .045], ripe ? '#416f38' : '#92ac61');
        }
    } else if (id === 'eggplant' || id === 'chili') {
        for (const x of [-.21, .21]) {
            const h = (id === 'eggplant' ? .62 : .5) * scale;
            beam(g, [x, .02, 0], [x, h, 0], .02, stem);
            for (let i = 0; i < 5; i++) {
                const a = i * 2.4, y = h * (.3 + i * .12);
                leaf(g, [x, y, 0], id === 'eggplant' ? .24 : .17, id === 'eggplant' ? .1 : .04, a, green, .07);
                if (mature && i % 2 === 0) {
                    const px = x + Math.sin(a) * .12, pz = Math.cos(a) * .12;
                    beam(g, [x, y, 0], [px, y, pz], .011, stem);
                    if (id === 'eggplant') {
                        ball(g, [px, y - .09, pz], [.065, .12, .06], ripe ? '#69417e' : '#88a15f');
                        rosette(px, pz, 4, .055, .025, y, .01);
                    } else {
                        cylinder(g, [px, y - .06, pz], .003, .15, ripe ? '#c64530' : '#7c994a', .03, [0, 0, .3]);
                    }
                }
            }
        }
    } else if (id === 'watermelon') {
        rosette(0, 0, 8, .39, .12, .025, .1);
        for (const [x, z] of [[-.19, .12], [.2, -.14]]) {
            if (mature) {
                ball(g, [x, .13 * scale, z], [.21 * scale, .15 * scale, .14 * scale], ripe ? '#386442' : '#84a35a');
                if (ripe) for (let i = -2; i <= 2; i++) {
                    const a = i * .48;
                    ball(g, [x, .13 + Math.cos(a) * .14, z + Math.sin(a) * .13], [.195, .014, .016], '#8da75b');
                }
            }
        }
    } else if (id === 'pineapple') {
        rosette(0, 0, 11, .41, .055, .015, .2);
        if (mature) {
            ball(g, [0, .27 * scale, 0], [.15 * scale, .23 * scale, .15 * scale], ripe ? '#cc9d47' : '#92a65b');
            if (ripe) for (let row = 0; row < 4; row++) for (let i = 0; i < 8; i++) {
                const a = i * Math.PI / 4 + row % 2 * .3, radius = .13 * Math.sin((row + 1) * Math.PI / 5);
                ball(g, [Math.sin(a) * radius, .12 + row * .09, Math.cos(a) * radius], [.034, .031, .034], '#e1b459');
            }
            rosette(0, 0, 7, .2, .028, .47 * scale, .18);
        }
    } else if (id === 'rose' || id === 'saffron') {
        const rose = id === 'rose';
        for (const [x, z] of [[-.19, -.14], [.2, -.06], [0, .23]]) {
            const h = (rose ? .65 : .28) * scale;
            beam(g, [x, .02, z], [x, h, z], rose ? .014 : .009, stem);
            if (rose) for (let i = 0; i < 3; i++) leaf(g, [x, .12 + i * .12 * scale, z], .16, .055, i * 2.4, green, .055);
            else rosette(x, z, 5, .25, .011, .025, .14);
            if (mature) {
                if (rose) for (let ring = 0; ring < 3; ring++) for (let i = 0; i < 5; i++) {
                    const a = i * 1.26 + ring * .4, r = .075 - ring * .023;
                    ball(g, [x + Math.sin(a) * r, h + ring * .025, z + Math.cos(a) * r], [.058 - ring * .01, .045, .058 - ring * .01], ripe ? ['#be5577', '#d47a95', '#e29caf'][ring] : '#8aa867');
                } else {
                    for (let i = 0; i < 6; i++) {
                        const a = i * Math.PI / 3;
                        ball(g, [x + Math.sin(a) * .066, h + .04, z + Math.cos(a) * .066], [.05, .075, .05], ripe ? i % 2 ? '#ac88c6' : '#8662ad' : '#b5bdd2');
                    }
                    for (let i = 0; i < 3; i++) beam(g, [x, h + .025, z], [x + (i - 1) * .028, h + .14, z + .015], .007, '#e78931');
                }
            }
        }
    } else if (id === 'coffee') {
        beam(g, [0, 0, 0], [0, .83 * scale, 0], .029, '#866044');
        for (let i = 0; i < 6; i++) {
            const a = i * 2.4, y = (.2 + i * .1) * scale, x = Math.sin(a) * .18, z = Math.cos(a) * .18;
            beam(g, [0, y - .055, 0], [x, y, z], .014, stem);
            leaf(g, [x * .5, y, z * .5], .27 * scale, .075, a, i % 2 ? '#497548' : '#739853', .055);
            if (mature) for (let j = 0; j < 3; j++) ball(g, [x * (.4 + j * .2), y - .035, z * (.4 + j * .2)], [.034, .04, .034], ripe ? j % 2 ? '#b65439' : '#8d3930' : '#819953');
        }
    }
    return true;
}
