import * as T from 'three';

import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ASSETS, CROPS, type AssetId, type CropId } from '../core/catalog';
import { architecture } from './architecture';
import { cropVariety } from './cropVarieties';
type V = [
    number,
    number,
    number
];
const C = { timber: '#91643e', dark: '#654b37', cream: '#f0dfb7', roof: '#bd7250', tile: '#ce8960', green: '#467a53', leaf: '#73984f', lightLeaf: '#9cb563', teal: '#54887c', stone: '#b1ae97', gold: '#dab464', soil: '#90684b' };
const materials = new Map<string, T.MeshStandardMaterial>();
function material(color: string) {
    if (!materials.has(color))
        materials.set(color, new T.MeshStandardMaterial({ color, roughness: .93, metalness: 0 }));
    return materials.get(color)!;
}
function part(g: T.Group, geo: T.BufferGeometry, color: string, p: V = [0, 0, 0], scale: V = [1, 1, 1], r: V = [0, 0, 0]) {
    const mesh = new T.Mesh(geo, material(color));
    mesh.position.set(...p);
    mesh.scale.set(...scale);
    mesh.rotation.set(...r);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
    return mesh;
}
const box = (g: T.Group, p: V, size: V, color = C.timber, r: V = [0, 0, 0]) => part(g, new T.BoxGeometry(1, 1, 1), color, p, size, r);
const ball = (g: T.Group, p: V, size: V, color = C.leaf) => part(g, new T.SphereGeometry(1, 10, 7), color, p, size);
const cylinder = (g: T.Group, p: V, radius: number, height: number, color = C.timber, top = radius, r: V = [0, 0, 0]) => part(g, new T.CylinderGeometry(top, radius, height, 10), color, p, [1, 1, 1], r);
function beam(g: T.Group, a: V, b: V, thickness = .07, color = C.timber) {
    const start = new T.Vector3(...a), end = new T.Vector3(...b), direction = end.clone().sub(start);
    const mesh = cylinder(g, start.add(end).multiplyScalar(.5).toArray() as V, thickness, direction.length(), color);
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), direction.normalize());
}
/** Bake each color into one mesh; dynamic children keep independent transforms. */
function bake(source: T.Group): T.Group {
    const target = new T.Group(), byColor = new Map<string, T.BufferGeometry[]>();
    source.updateMatrixWorld(true);
    function visit(node: T.Object3D) {
        if (node.userData.dynamic) {
            target.add(node.clone(true));
            return;
        }
        if (node instanceof T.Mesh) {
            const key = (node.material as T.MeshStandardMaterial).color.getStyle();
            const geometry = node.geometry.clone().applyMatrix4(node.matrixWorld);
            // Use position/normal only so every authored primitive shares the same layout.
            geometry.deleteAttribute('uv');
            geometry.deleteAttribute('uv1');
            const flat = geometry.index ? geometry.toNonIndexed() : geometry;
            if (flat !== geometry)
                geometry.dispose();
            const list = byColor.get(key) ?? [];
            list.push(flat);
            byColor.set(key, list);
            node.geometry.dispose();
        }
        for (const child of node.children)
            visit(child);
    }
    visit(source);
    for (const [color, geometries] of byColor) {
        const merged = mergeGeometries(geometries);
        geometries.forEach(v => v.dispose());
        if (merged)
            part(target, merged, color);
    }
    return target;
}
function roof(g: T.Group, x: number, y: number, z: number, width: number, depth: number, color = C.roof) {
    const highlight = '#' + new T.Color(color).lerp(new T.Color(C.cream), .15).getHexString();
    const rise = width * .31, angle = Math.atan2(rise, width / 2), side = Math.hypot(width / 2, rise);
    for (const sign of [-1, 1]) {
        box(g, [x + sign * width / 4, y + rise / 2, z], [side + .13, .13, depth], color, [0, 0, -sign * angle]);
        for (let row = 0; row < 3; row++) {
            const px = (row + .45) / 3 * width / 2, py = rise * (1 - px / (width / 2));
            for (let col = 0; col < Math.round(depth * 4); col++) {
                box(g, [x + sign * px, y + py + .07, z - depth / 2 + .14 + col * .25], [side / 3 + .06, .075, .235], (row + col) % 3 ? color : highlight, [0, 0, -sign * angle]);
            }
        }
        beam(g, [x, y + rise + .06, z - depth / 2], [x + sign * width / 2, y, z - depth / 2], .06, C.cream);
        beam(g, [x, y + rise + .06, z + depth / 2], [x + sign * width / 2, y, z + depth / 2], .065, C.dark);
    }
    cylinder(g, [x, y + rise + .1, z], .095, depth + .14, highlight, .095, [Math.PI / 2, 0, 0]);
}
function window(g: T.Group, x: number, y: number, z: number) {
    box(g, [x, y, z], [.47, .59, .07], C.cream);
    box(g, [x, y, z + .045], [.34, .46, .04], C.teal);
    box(g, [x, y, z + .075], [.035, .47, .035], C.cream);
    box(g, [x, y, z + .075], [.34, .035, .035], C.cream);
    box(g, [x, y - .33, z + .075], [.55, .09, .2], C.timber);
}
function pot(g: T.Group, x: number, y: number, z: number, scale = 1, flowers = false) {
    cylinder(g, [x, y + .19 * scale, z], .16 * scale, .36 * scale, C.roof, .24 * scale);
    cylinder(g, [x, y + .37 * scale, z], .25 * scale, .055 * scale, C.tile);
    cylinder(g, [x, y + .4 * scale, z], .2 * scale, .03 * scale, C.soil);
    for (let i = 0; i < 5; i++) {
        const a = i * 2.4, dx = Math.cos(a) * .19 * scale, dz = Math.sin(a) * .17 * scale;
        ball(g, [x + dx, y + (.43 + i % 2 * .12) * scale, z + dz], [.2 * scale, .18 * scale, .18 * scale], i % 2 ? C.green : C.leaf);
        if (flowers)
            flower(g, x + dx, y + (.63 + i % 2 * .12) * scale, z + dz, scale * .7, i % 2 ? '#d49798' : '#f1d794');
    }
}
function flower(g: T.Group, x: number, y: number, z: number, scale: number, color: string) {
    for (let j = 0; j < 5; j++) {
        const a = j / 5 * Math.PI * 2;
        ball(g, [x + Math.cos(a) * .085 * scale, y, z + Math.sin(a) * .085 * scale], [.07 * scale, .045 * scale, .07 * scale], color);
    }
    ball(g, [x, y + .025 * scale, z], [.04 * scale, .045 * scale, .04 * scale], '#e4b34c');
}
function crate(g: T.Group, x: number, y: number, z: number, s = .65) {
    box(g, [x, y + s / 3, z], [s, s * .65, s * .75], C.dark);
    for (let i = 0; i < 3; i++)
        for (const sign of [-1, 1])
            box(g, [x, y + .08 + i * s * .19, z + sign * s * .39], [s + .035, s * .15, .055], C.timber);
    for (const sign of [-1, 1])
        box(g, [x + sign * s * .43, y + s / 3, z + s * .42], [.055, s * .63, .07], C.tile);
}
function bakery(level: number) {
    const g = new T.Group();
    box(g, [0, .08, 0], [2.65, .16, 2.45], C.stone);
    box(g, [-.32, .78, -.22], [1.88, 1.4, 1.6], C.cream);
    roof(g, -.32, 1.48, -.22, 2.12, 1.97);
    box(g, [.32, 2, -.58], [.34, 1.4, .38], C.cream);
    box(g, [.32, 2.74, -.58], [.48, .16, .5], C.roof);
    box(g, [.3, .52, .61], [.46, .85, .1], C.teal);
    ball(g, [.42, .55, .7], [.04, .04, .025], C.gold);
    window(g, -.75, .95, .62);
    ball(g, [-.64, .5, 1], [.57, .49, .4], C.roof);
    cylinder(g, [-.64, .46, 1.34], .27, .025, C.dark, .27, [Math.PI / 2, 0, 0]);
    part(g, new T.TorusGeometry(.28, .07, 6, 14, Math.PI), C.tile, [-.64, .46, 1.36]);
    box(g, [-.64, .28, 1.22], [.8, .12, .45], C.stone);
    ball(g, [-.65, .39, 1.38], [.13, .065, .03], '#f2b55f');
    pot(g, .83, .12, -.7, .8, true);
    if (level >= 2) {
        for (const x of [.28, 1.15])
            cylinder(g, [x, .66, 1.08], .045, 1.2);
        box(g, [.72, 1.36, .95], [1.18, .1, 1], C.cream, [.18, 0, 0]);
        for (let i = 0; i < 5; i++)
            box(g, [.23 + i * .24, 1.37, .95], [.11, .04, 1], C.teal, [.18, 0, 0]);
        box(g, [.7, .56, 1.05], [.96, .68, .4]);
        box(g, [.7, .93, 1.05], [1.1, .1, .5], C.dark);
        for (let i = 0; i < 3; i++)
            ball(g, [.38 + i * .3, 1.02, 1.02], [.12, .08, .17], C.gold);
    }
    if (level >= 3) {
        box(g, [.95, .65, -.35], [.55, 1.16, 1.6], C.cream);
        roof(g, .95, 1.23, -.35, .85, 1.8);
        pot(g, 1.17, .12, 1.03, .65, true);
        crate(g, -1.07, .15, -.99, .38);
    }
    return bake(g);
}
function mill(level: number) {
    const g = new T.Group();
    cylinder(g, [0, .13, 0], 1.13, .26, C.stone);
    cylinder(g, [0, 1.25, 0], .84, 2.15, C.cream, .6);
    for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        beam(g, [Math.sin(a) * .84, .26, Math.cos(a) * .84], [Math.sin(a) * .6, 2.25, Math.cos(a) * .6], .045);
    }
    part(g, new T.ConeGeometry(.91, .91, 10), C.roof, [0, 2.67, 0]);
    box(g, [0, .54, .83], [.38, .7, .1], C.teal);
    window(g, .27, 1.25, .73);
    for (const x of [-.9, .9])
        ball(g, [x, .3, .3], [.23, .34, .27], C.gold);
    if (level >= 2) {
        box(g, [-.9, .52, -.3], [.65, .9, 1.25], C.timber);
        roof(g, -.87, 1, -.3, .85, 1.45);
    }
    if (level >= 3) {
        crate(g, .93, .15, -.55, .6);
        pot(g, -.88, .12, .77, .8, true);
    }
    const baked = bake(g), sails = new T.Group();
    sails.name = 'sails';
    sails.position.set(0, 2.05, .84);
    for (let i = 0; i < 4; i++) {
        const arm = new T.Group();
        arm.rotation.z = i * Math.PI / 2;
        box(arm, [0, .65, 0], [.075, 1.5, .09], C.dark);
        box(arm, [.16, .94, 0], [.35, .76, .055], C.cream);
        for (let j = 0; j < 4; j++)
            box(arm, [.16, .61 + j * .21, .045], [.4, .025, .035], C.timber);
        sails.add(arm);
    }
    const packedSails = bake(sails);
    packedSails.name = 'sails';
    packedSails.position.copy(sails.position);
    // bake includes root transforms; author sails around their rotation pivot instead.
    packedSails.children.forEach(v => (v as T.Mesh).geometry.translate(0, -2.05, -.84));
    cylinder(packedSails, [0, 0, .04], .16, .18, C.dark, .16, [Math.PI / 2, 0, 0]);
    baked.add(packedSails);
    return baked;
}
function cow() {
    const g = new T.Group();
    ball(g, [0, .56, 0], [.28, .33, .46], '#efe7d3');
    ball(g, [.24, .65, -.12], [.045, .18, .18], '#62594c');
    ball(g, [-.24, .52, .14], [.045, .17, .16], '#62594c');
    for (const x of [-.19, .19])
        for (const z of [-.29, .28]) {
            cylinder(g, [x, .24, z], .065, .35, '#e9dfc6');
            box(g, [x, .06, z + .02], [.15, .12, .19], C.dark);
        }
    beam(g, [0, .69, -.4], [0, .24, -.56], .025, C.cream);
    ball(g, [0, .24, -.56], [.065, .08, .06], C.dark);
    const packed = bake(g), head = new T.Group();
    ball(head, [0, 0, .12], [.22, .22, .26], '#efe7d3');
    ball(head, [0, -.12, .31], [.21, .12, .12], '#ceac95');
    for (const x of [-1, 1]) {
        ball(head, [x * .22, .06, .1], [.14, .045, .07], '#c8ad8a');
        ball(head, [x * .16, .02, .3], [.025, .035, .024], '#2c332b');
        ball(head, [x * .1, -.1, .42], [.028, .019, .015], C.dark);
        part(head, new T.ConeGeometry(.045, .17, 8), C.cream, [x * .15, .24, .08], [1, 1, 1], [0, 0, -x * .2]);
    }
    const h = bake(head);
    h.name = 'cow-head';
    h.position.set(0, .79, .37);
    packed.add(h);
    packed.name = 'cow';
    return packed;
}
function barn(level: number) {
    const g = new T.Group();
    box(g, [0, .055, 0], [3.65, .11, 2.65], C.stone);
    box(g, [0, .69, -.88], [3.4, 1.3, .12], C.timber);
    for (let i = 0; i < 13; i++)
        box(g, [-1.55 + i * .26, .68, -.8], [.22, 1.2, .07], i % 3 ? C.timber : C.tile);
    for (const x of [-1.62, 0, 1.62])
        for (const z of [-.87, .7]) {
            box(g, [x, .78, z], [.14, 1.48, .14], C.dark);
            box(g, [x, .17, z], [.25, .3, .25], C.cream);
        }
    roof(g, 0, 1.48, -.18, 3.8, 2.08);
    for (const y of [.42, .8])
        box(g, [.82, y, .73], [1.55, .1, .09], C.cream);
    box(g, [-.8, .25, 1], [1.1, .35, .4], C.timber);
    box(g, [-.8, .44, 1], [.98, .09, .3], C.gold);
    ball(g, [1, .34, -.28], [.46, .31, .37], C.gold);
    if (level >= 2) {
        box(g, [-1.7, .42, .13], [.15, .77, 1.2], C.teal);
        pot(g, 1.56, .1, .93, .9);
    }
    if (level >= 3) {
        roof(g, 0, 2.62, -.18, 1.16, .9);
        box(g, [0, 2.45, -.18], [.8, .65, .65], C.cream);
    }
    const model = bake(g), animal = cow();
    animal.position.set(-.7, .14, .12);
    model.add(animal);
    return model;
}
function decor(id: AssetId) {
    const g = new T.Group();
    if (id === 'bench') {
        for (const x of [-.68, .68])
            for (const z of [-.25, .25])
                box(g, [x, .23, z], [.1, .46, .1], C.dark);
        for (let i = 0; i < 3; i++)
            box(g, [0, .49, -.25 + i * .24], [1.7, .09, .17]);
        for (const x of [-.68, .68])
            box(g, [x, .83, -.31], [.08, .85, .09]);
        for (const y of [.77, 1.02])
            box(g, [0, y, -.31], [1.7, .17, .08], C.tile);
    }
    else if (id === 'fence' || id === 'arch') {
        const width = id === 'arch' ? 2.55 : 1.85, height = id === 'arch' ? 1.9 : .85;
        for (const x of [-width / 2, width / 2]) {
            box(g, [x, height / 2, 0], [.12, height, .12]);
            ball(g, [x, height, 0], [.1, .09, .1], C.tile);
        }
        if (id === 'fence')
            for (const y of [.29, .63])
                box(g, [0, y, 0], [width, .1, .08], C.cream);
        else {
            box(g, [0, height, 0], [width + .22, .12, .24], C.dark);
            for (let i = 0; i < 11; i++) {
                const x = -width / 2 + i * width / 10;
                ball(g, [x, height + .08 + Math.sin(i) * .05, 0], [.2, .16, .22], C.leaf);
                flower(g, x, height + .23, .03, .8, '#d097a2');
            }
            pot(g, -width / 2, 0, 0, 1);
            pot(g, width / 2, 0, 0, 1);
        }
    }
    else if (id === 'flowers')
        pot(g, 0, 0, 0, 1.35, true);
    else if (id === 'lantern') {
        box(g, [0, .07, 0], [.43, .14, .43], C.stone);
        cylinder(g, [0, .95, 0], .065, 1.8);
        beam(g, [0, 1.86, 0], [.37, 1.86, 0], .05);
        beam(g, [.34, 1.85, 0], [.34, 1.59, 0], .02, C.dark);
        ball(g, [.34, 1.4, 0], [.23, .27, .23], '#f4d797');
        for (const y of [1.15, 1.65])
            cylinder(g, [.34, y, 0], .11, .04, C.dark);
    }
    else if (id === 'well') {
        cylinder(g, [0, .36, 0], .68, .66, C.stone);
        cylinder(g, [0, .7, 0], .7, .08, '#c4bca7');
        cylinder(g, [0, .745, 0], .5, .015, '#536c67');
        for (const x of [-.76, .76])
            box(g, [x, .94, 0], [.11, 1.85, .12]);
        roof(g, 0, 1.8, 0, 1.9, 1.25, C.timber);
        beam(g, [0, 1.85, 0], [0, .81, 0], .022, C.dark);
    }
    else if (id === 'crates') {
        crate(g, 0, 0, 0, .75);
        for (let i = 0; i < 4; i++)
            ball(g, [-.21 + i % 2 * .36, .53, -.15 + Math.floor(i / 2) * .27], [.15, .15, .14], i % 2 ? '#c68b4b' : '#abb360');
    }
    else if (id === 'birdhouse') {
        cylinder(g, [0, .7, 0], .06, 1.4);
        box(g, [0, 1.5, 0], [.55, .65, .46], C.teal);
        roof(g, 0, 1.83, 0, .76, .72);
        cylinder(g, [0, 1.58, .245], .09, .03, C.dark, .09, [Math.PI / 2, 0, 0]);
        beam(g, [0, 1.34, .23], [0, 1.34, .43], .03);
    }
    return bake(g);
}
/** Curved modeled leaf: width and center ridge change along its length. */
function leaf(g: T.Group, p: V, length: number, width: number, angle: number, color: string, lift = .35) {
    const positions: number[] = [], indices: number[] = [];
    for (let i = 0; i <= 6; i++) {
        const t = i / 6, w = Math.sin(Math.PI * t) * width;
        for (const side of [-1, 0, 1])
            positions.push(side * w, Math.sin(t * Math.PI / 1.5) * lift + (side === 0 ? .025 : 0), t * length);
        if (i < 6)
            for (let j = 0; j < 2; j++) {
                const n = i * 3 + j;
                indices.push(n, n + 3, n + 1, n + 1, n + 3, n + 4, n + 1, n + 3, n, n + 4, n + 3, n + 1);
            }
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    part(g, geo, color, p, [1, 1, 1], [0, angle, 0]);
}
function crop(id: CropId, stage: number) {
    const g = new T.Group();
    if (stage < 0)
        return g;
    if (stage === 0) {
        for (const x of [-.2, .2])
            ball(g, [x, .035, 0], [.14, .07, .12], '#a8815c');
        return bake(g);
    }
    if (stage === 1) {
        for (const x of [-.2, .2]) {
            cylinder(g, [x, .1, 0], .018, .2, C.green);
            leaf(g, [x, .13, 0], .2, .075, -.9, C.leaf, .08);
            leaf(g, [x, .15, 0], .19, .065, 2.5, C.lightLeaf, .08);
        }
        return bake(g);
    }
    if (cropVariety(g, id, stage, { ball, cylinder, beam, leaf })) return bake(g);
    const ripe = stage === 4;
    if (id === 'corn') {
        for (const [x, z] of [[-.18, -.13], [.23, .15]]) {
            const h = stage === 2 ? .52 : ripe ? 1.16 : .87;
            cylinder(g, [x, h / 2, z], .025, h, C.green);
            for (let i = 0; i < (ripe ? 7 : 4); i++)
                leaf(g, [x, h * (.15 + i * .105), z], .37, .07, i * 2.4, i % 2 ? C.green : C.leaf, .16);
            if (stage >= 3)
                for (const sign of [-1, 1]) {
                    ball(g, [x + sign * .1, h * .62, z + .025], [.085, .17, .08], ripe ? '#e1b64a' : C.lightLeaf);
                    leaf(g, [x + sign * .11, h * .46, z], .22, .06, sign, C.leaf, .25);
                }
            if (ripe)
                for (const sign of [-1, 0, 1])
                    beam(g, [x, h - .05, z], [x + sign * .09, h + .14 - Math.abs(sign) * .05, z], .012, C.gold);
        }
    }
    else if (id === 'pumpkin') {
        for (let i = 0; i < 6; i++) {
            const a = i * 2.4;
            leaf(g, [Math.cos(a) * .1, .035, Math.sin(a) * .1], .4, .16, a, i % 2 ? C.green : C.leaf, .12);
        }
        if (stage >= 3)
            for (const [x, z] of [[-.18, .12], [.23, -.16]]) {
                if (!ripe)
                    flower(g, x, .19, z, .8, '#eac558');
                else {
                    for (let i = 0; i < 7; i++) {
                        const a = i / 7 * Math.PI * 2;
                        ball(g, [x + Math.cos(a) * .075, .16, z + Math.sin(a) * .075], [.11, .15, .11], i % 2 ? '#d48636' : '#c9722f');
                    }
                    cylinder(g, [x, .34, z], .027, .1, C.dark);
                }
            }
    }
    else if (id === 'carrot') {
        for (const [x, z] of [[-.22, -.16], [.22, -.1], [0, .24]]) {
            if (ripe)
                ball(g, [x, .075, z], [.075, .14, .075], '#da8948');
            for (let i = 0; i < 5; i++) {
                const a = i * 2.4, h = stage === 2 ? .2 : .34;
                leaf(g, [x, .1, z], .24, .035, a, i % 2 ? C.green : C.leaf, h);
                leaf(g, [x + Math.sin(a) * .09, .19, z + Math.cos(a) * .09], .13, .045, a + .7, C.leaf, .08);
            }
        }
    }
    else if (id !== 'wheat' && id !== 'rice') {
        const h = stage === 2 ? .26 : id === 'tea' ? .58 : id === 'sunflower' ? 1.1 : .55;
        for (const x of [-.22, .22]) {
            cylinder(g, [x, h / 2, 0], .025, h, C.green);
            for (let j = 0; j < 5; j++)
                leaf(g, [x, h * (.15 + j * .13), 0], id === 'tea' ? .22 : .28, id === 'lavender' ? .027 : .09, j * 2.4, C.leaf, .11);
            if (id === 'tomato')
                beam(g, [x + .08, 0, 0], [x + .08, .85, 0], .02, C.timber);
            if (stage >= 3) {
                if (id === 'sunflower') {
                    cylinder(g, [x, h + .04, 0], .14, .07, ripe ? '#776042' : C.leaf, .14, [Math.PI / 2, 0, 0]);
                    for (let k = 0; k < 9; k++) {
                        const a = k / 9 * Math.PI * 2;
                        ball(g, [x + Math.cos(a) * .18, h + Math.sin(a) * .18, .02], [.065, .11, .03], ripe ? CROPS[id].color : C.lightLeaf);
                    }
                }
                else if (id === 'lavender')
                    for (let k = 0; k < 5; k++)
                        ball(g, [x, h + k * .055, 0], [.065, .055, .065], ripe ? CROPS[id].color : C.lightLeaf);
                else if (id === 'tea') {
                    for (let k = 0; k < 4; k++)
                        leaf(g, [x, h, .02], .18, .045, k * 1.6, ripe ? '#b0bc75' : C.green, .12);
                }
                else
                    for (let k = 0; k < 3; k++)
                        ball(g, [x + (k - 1) * .08, h * (.55 + k * .14), .09], [id === 'soy' ? .035 : .065, id === 'soy' ? .11 : .065, .06], ripe ? CROPS[id].color : C.lightLeaf);
            }
        }
    }
    else {
        for (let i = 0; i < 10; i++) {
            const a = i * 2.4, r = .12 + i % 3 * .07, x = Math.cos(a) * r, z = Math.sin(a) * r, h = (stage === 2 ? .3 : .63) + i % 3 * .05;
            cylinder(g, [x, h / 2, z], .012, h, ripe ? C.gold : C.green);
            leaf(g, [x, .1, z], .19, .023, a, ripe ? '#a6a45c' : C.leaf, .24);
            if (stage >= 3)
                for (let j = 0; j < 4; j++) {
                    ball(g, [x + (j % 2 ? -.025 : .025), h + j * .034, z], [.028, .043, .027], ripe ? C.gold : C.lightLeaf);
                }
        }
    }
    return bake(g);
}
const cache = new Map<string, T.Group>();
function workshopModel(id: AssetId, _level: number) {
    const g = new T.Group();
    if (id === 'path') {
        box(g, [0, .025, 0], [.87, .06, .87], C.stone);
    } else if (id === 'statue') {
        cylinder(g, [0, .16, 0], .65, .3, C.stone);
        cylinder(g, [0, .8, 0], .24, 1.3, C.cream);
        ball(g, [0, 1.6, 0], [.38, .35, .38], C.gold);
    }
    return bake(g);
}
export function assetModel(id: AssetId, level = 1): T.Group {
    const key = `${id}:${level}`;
    if (!cache.has(key)) {
        const visual = Math.min(3, 1 + Math.floor(level / 10));
        const model = id === 'bakery' ? bakery(visual) : id === 'mill' ? mill(visual) : id === 'barn' ? barn(visual) : ASSETS[id].kind === 'building' ? bake(architecture(id, level, { box, ball, cylinder, beam, roof, window, crate, pot, part })) : id === 'path' || id === 'statue' ? workshopModel(id, level) : decor(id);
        if (['mill', 'bakery', 'barn'].includes(id) && level >= 5) {
            const kit = new T.Group(), tier = Math.floor(level / 5);
            if (id === 'mill') {
                for (let i = 0; i < Math.min(tier, 3); i++) ball(kit, [.75 + i % 2 * .27, .27 + Math.floor(i / 2) * .28, .85], [.16, .25, .18], C.gold);
                if (tier >= 2) { box(kit, [0, .38, -1.03], [1.55, .16, .58], C.timber); for (const x of [-.7, .7]) box(kit, [x, .18, -1.03], [.1, .35, .1], C.dark); }
                if (tier >= 3) { cylinder(kit, [.95, .6, -.63], .3, 1.1, C.timber); part(kit, new T.ConeGeometry(.34, .3, 10), C.roof, [.95, 1.3, -.63]); }
                if (tier >= 4) beam(kit, [.75, 1.23, -.7], [.55, .8, -1.02], .09, C.dark);
                if (tier >= 5) for (let i = 0; i < 4; i++) box(kit, [-.42 + i * .28, .55, -1.26], [.12, .27, .15], C.cream);
            } else if (id === 'bakery') {
                crate(kit, 1.12, .15, -.94, .4);
                if (tier >= 2) for (let i = 0; i < 3; i++) ball(kit, [.38 + i * .3, 1.05, 1.01], [.1, .07, .16], C.gold);
                if (tier >= 3) { box(kit, [-1.05, .55, -.83], [.22, .85, .5], C.timber); for (const y of [.35, .62, .9]) { box(kit, [-1.05, y, -.65], [.38, .05, .5], C.dark); ball(kit, [-1.05, y + .09, -.58], [.12, .07, .15], C.gold); } }
                if (tier >= 4) pot(kit, 1.12, .12, .58, .6, true);
                if (tier >= 5) { box(kit, [.95, 1.22, -.85], [.45, .07, .32], C.timber); ball(kit, [.95, 1.35, -.85], [.16, .12, .2], C.gold); }
            } else {
                for (let i = 0; i < Math.min(tier, 3); i++) { const x = .75 + i % 2 * .42, y = .31 + Math.floor(i / 2) * .39; box(kit, [x, y, -.58], [.38, .37, .48], C.gold); box(kit, [x, y, -.58], [.04, .39, .5], C.dark); }
                if (tier >= 2) for (const x of [-1.65, 1.65]) cylinder(kit, [x, .42, 1.06], .18, .5, '#a7b7b0', .12);
                if (tier >= 3) { box(kit, [1.34, .85, -.95], [.55, 1.5, .5], '#b2b8a4'); part(kit, new T.ConeGeometry(.4, .4, 8), C.roof, [1.34, 1.78, -.95]); }
                if (tier >= 4) box(kit, [.85, .55, 1.06], [.65, .13, .36], C.teal);
                if (tier >= 5) for (const x of [.6, 1.1]) cylinder(kit, [x, .38, 1.1], .12, .38, '#a7b7b0', .085);
            }
            model.add(bake(kit));
        }
        cache.set(key, model);
    }
    return cache.get(key)!.clone(true);
}
export function cropModel(id: CropId, stage: number): T.Group {
    const key = `crop:${id}:${stage}`;
    if (!cache.has(key))
        cache.set(key, crop(id, stage));
    return cache.get(key)!.clone(true);
}
export function sceneryModel(width: number, depth: number) {
    const g = new T.Group();
    // Deliberately authored border: quiet paths, trees and tiny wildflower clusters.
    for (let i = 0; i < 12; i++) {
        const x = i % 2 === 0 ? -1.6 : width + 1.7, z = 1 + Math.floor(i / 2) * depth / 5;
        const h = 1.4 + i % 3 * .3;
        cylinder(g, [x, h / 2, z], .12, h, C.timber, .075);
        for (let j = 0; j < 5; j++) {
            const a = j * 2.4;
            ball(g, [x + Math.cos(a) * .42, h + j % 2 * .35, z + Math.sin(a) * .42], [.7, .76, .65], j % 2 ? C.leaf : C.green);
        }
    }
    for (let i = 0; i < 18; i++) {
        const x = .8 + (i * 5.3) % width, z = i % 2 ? -.8 : depth + .7;
        ball(g, [x, .09, z], [.19 + i % 3 * .07, .12, .19], i % 3 ? '#b3b198' : '#d0c3a1');
        if (i % 3) {
            leaf(g, [x + .3, .02, z], .26, .045, i, C.leaf, .21);
            flower(g, x + .3, .26, z, .55, '#e8d8a8');
        }
    }
    for (let i = 0; i < width; i++) {
        box(g, [i + .5, -.002, 5.65], [.9, .025, .8], i % 3 ? '#d7c599' : '#cebb8c', [0, (i % 3 - 1) * .06, 0]);
    }
    return bake(g);
}
