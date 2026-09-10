import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { AnswerValue, Region } from './model';
import { rng } from './questions';
import { roadX, roadAngle, roadPosition } from './track';
export { roadAngle, roadPosition } from './track';
const ball = new T.SphereGeometry(1, 12, 8), box = new T.BoxGeometry(1, 1, 1), cylinder = new T.CylinderGeometry(1, 1, 1, 12), cone = new T.ConeGeometry(1, 1, 10);
function material(color: string) { return new T.MeshStandardMaterial({ color, roughness: .72 }); }
function mesh(root: T.Group, geometry: T.BufferGeometry, color: string, p: number[], scale: number[], rot = [0, 0, 0]) {
    const m = new T.Mesh(geometry, material(color)); m.position.set(...p as [number, number, number]); m.scale.set(...scale as [number, number, number]); m.rotation.set(...rot as [number, number, number]); root.add(m); return m;
}
/** Bake static geometry and colours; articulated wheels/driver remain separate groups. */
export function bake(root: T.Group) {
    for (const c of root.children) if (c instanceof T.Group) bake(c);
    const geometries: T.BufferGeometry[] = [];
    for (const child of [...root.children]) if (child instanceof T.Mesh) {
        child.updateMatrix(); let g = child.geometry.clone().applyMatrix4(child.matrix); if (g.index) { const indexed = g; g = g.toNonIndexed(); indexed.dispose(); }
        g.deleteAttribute('uv'); const color = (child.material as T.MeshStandardMaterial).color, n = g.attributes.position.count, colors = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) { colors[i * 3] = color.r; colors[i * 3 + 1] = color.g; colors[i * 3 + 2] = color.b; }
        g.setAttribute('color', new T.BufferAttribute(colors, 3)); geometries.push(g); (child.material as T.Material).dispose(); root.remove(child);
    }
    if (geometries.length) { const merged = mergeGeometries(geometries); geometries.forEach(g => g.dispose()); root.add(new T.Mesh(merged, new T.MeshStandardMaterial({ vertexColors: true, roughness: .78 }))); }
}
export function disposeArt(root: T.Object3D) { root.traverse(o => { if (o instanceof T.Mesh) { o.geometry.dispose(); const materials = Array.isArray(o.material) ? o.material : [o.material]; materials.forEach(m => m.dispose()); } }); }

export function makeKart(color: string, rival = 0) {
    const root = new T.Group(), body = new T.Group(); body.name = 'body'; root.add(body);
    mesh(body, box, '#273941', [0, .57, 0], [2.65, .3, 3.45]);
    mesh(body, ball, color, [0, .86, -.2], [1.22, .56, 1.8]);
    mesh(body, box, color, [0, .9, -1.46], [1.7, .36, .7]);
    mesh(body, box, '#fff4ce', [0, 1.09, -1.35], [.32, .15, 1.05]);
    mesh(body, box, '#fff4ce', [0, .68, -1.91], [2.1, .15, .16]);
    for (const side of [-1, 1]) {
        mesh(body, ball, '#ffed9d', [side * .71, .91, -1.61], [.27, .18, .14]);
        mesh(body, box, '#e6754f', [side * .72, .82, 1.55], [.35, .18, .12]);
        mesh(body, cylinder, '#515562', [side * .62, .63, 1.77], [.13, .44, .13], [Math.PI / 2, 0, 0]);
        mesh(body, box, color, [side * 1.23, .84, .14], [.25, .23, 1.55]);
        for (const z of [-1.08, 1.13]) {
            const wheel = new T.Group(); wheel.name = `wheel${side}:${z}`; wheel.position.set(side * 1.25, .55, z); root.add(wheel);
            mesh(wheel, cylinder, '#27323c', [0, 0, 0], [.54, .42, .54], [0, 0, Math.PI / 2]);
            mesh(wheel, cylinder, '#e9e3cf', [side * .24, 0, 0], [.32, .025, .32], [0, 0, Math.PI / 2]);
            mesh(wheel, cylinder, color, [side * .26, 0, 0], [.14, .03, .14], [0, 0, Math.PI / 2]);
            // Round hubcaps avoid high-contrast spokes aliasing at racing speed.
        }
    }
    mesh(body, box, '#34494d', [0, 1.14, .6], [1.25, .7, .55]);
    mesh(body, box, color, [0, 1.37, 1.37], [2.38, .14, .62]);
    for (const x of [-.7, .7]) mesh(body, box, '#3c5453', [x, 1.09, 1.4], [.12, .55, .12]);
    const driver = new T.Group(); driver.name = 'driver'; driver.position.set(0, 1.15, .14); body.add(driver);
    const fur = ['#c77040', '#ecdda9', '#a38ac0', '#9bba9d'][rival], helmet = ['#389d96', '#d7867f', '#e8bb52', '#749cce'][rival];
    mesh(driver, ball, '#fff3db', [0, .28, 0], [.5, .64, .38]);
    mesh(driver, ball, fur, [0, 1.05, -.03], [.68, .62, .56]);
    mesh(driver, ball, helmet, [0, 1.36, .03], [.71, .43, .59]);
    mesh(driver, box, '#ffe1a3', [0, 1.7, -.05], [.14, .08, .65]);
    for (const side of [-1, 1]) {
        mesh(driver, ball, fur, [side * .55, 1.56, -.04], [.21, .27, .18]);
        mesh(driver, ball, '#fff0d4', [side * .28, 1, -.48], [.23, .25, .13]);
        mesh(driver, ball, '#273e42', [side * .27, 1.05, -.585], [.07, .095, .04]);
        mesh(driver, ball, helmet, [side * .47, .26, -.3], [.19, .24, .35], [-.6, 0, side * -.2]);
        mesh(driver, ball, '#704e43', [side * .45, .26, -.58], [.14, .16, .15]);
    }
    mesh(driver, ball, '#fff0d4', [0, .81, -.52], [.32, .19, .14]);
    mesh(driver, ball, '#273e42', [0, .87, -.66], [.09, .065, .04]);
    mesh(driver, cylinder, '#3c4948', [0, .25, -.62], [.49, .055, .49], [Math.PI / 4, 0, 0]);
    mesh(body, ball, fur, [.3, 1.48, .92], [.32, .32, .69], [-.3, 0, -.35]);
    bake(root); return root;
}
const moods = {
    valley: { sky: '#d8ebe9', ground: '#88b37d', grass: '#b7ce8a', road: '#526b6a', edge: '#f0d9a0', tree: '#4c8869', leaf: '#77aa72' },
    coast: { sky: '#d5edf0', ground: '#69bfc2', grass: '#e9d5a1', road: '#607f83', edge: '#fff0bf', tree: '#609d86', leaf: '#78b589' },
    city: { sky: '#cfbdd9', ground: '#a4aac3', grass: '#bcc1d3', road: '#606c86', edge: '#e8c9a6', tree: '#768bac', leaf: '#99a9c0' },
};
export { moods };
function ribbon(from: number, to: number, length: number, color: string) {
    const vertices: number[] = [], indices: number[] = [];
    for (let i = 0, s = -60; s <= length + 250; s += 5, i++) {
        vertices.push(...roadPosition(s, from, .03), ...roadPosition(s, to, .03));
        if (i) { const k = i * 2; indices.push(k - 2, k - 1, k, k - 1, k + 1, k); }
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(vertices, 3)); g.setIndex(indices); g.computeVertexNormals();
    const m = new T.Mesh(g, new T.MeshStandardMaterial({ color, side: T.DoubleSide, roughness: 1 })); return m;
}
export function makeWorld(region: Region, length: number, low = false) {
    // Scenery does not need the character's tessellation. Baking keeps draw calls bounded.
    const ball = new T.SphereGeometry(1, 8, 6);
    const root = new T.Group(), decor = new T.Group(), mood = moods[region], random = rng(873); root.add(decor);
    root.add(ribbon(-6.1, 6.1, length, mood.road), ribbon(-7.7, -6.1, length, mood.edge), ribbon(6.1, 7.7, length, mood.edge));
    root.add(ribbon(-28, -7.7, length, mood.grass), ribbon(7.7, 28, length, mood.grass));
    if (region === 'coast') {
        const sea = new T.Mesh(new T.PlaneGeometry(900, length + 900), new T.MeshStandardMaterial({ color: '#69bbc1', roughness: .38 }));
        sea.rotation.x = -Math.PI / 2; sea.position.set(0, -3.5, -length / 2); root.add(sea);
    }
    for (let s = -40; s < length + 240; s += 8) {
        const angle = roadAngle(s);
        for (const x of [-2, 2]) mesh(decor, box, '#f9edc7', roadPosition(s, x, .055), [.13, .045, 3], [0, angle, 0]);
        if (Math.round((s + 40) / 8) % 2 === 0) for (const x of [-6.5, 6.5]) mesh(decor, box, '#e88e6c', roadPosition(s, x, .08), [.75, .1, 4], [0, angle, 0]);
    }
    for (let s = -20; s < length + 240; s += low ? 30 : 18) for (const side of [-1, 1]) {
        const x = side * (12 + random() * 13), scale = 1 + random() * .65, p = roadPosition(s, x);
        if (region === 'city') {
            const h = 4 + random() * 14, tone = ['#e5d7dd', '#a6b7cf', '#c9b7d0'][Math.floor(random() * 3)];
            mesh(decor, box, tone, [p[0], p[1] + h / 2, p[2]], [3.5, h, 4]);
            mesh(decor, ball, '#eadbb8', [p[0], p[1] + h, p[2]], [1.8, 1.5, 2]);
            for (let y = 2; y < h; y += 2.4) for (const wx of [-.9, .9]) mesh(decor, box, '#ffe2a4', [p[0] + wx, p[1] + y, p[2] + 2.025], [.5, .8, .04]);
        } else if (region === 'coast') {
            mesh(decor, cylinder, '#b48d62', [p[0], p[1] + 3 * scale, p[2]], [.28, 6 * scale, .28], [0, 0, side * -.12]);
            for (let i = 0; i < 5; i++) mesh(decor, ball, mood.leaf, [p[0] + Math.cos(i * 1.26) * 1.6, p[1] + 6 * scale, p[2] + Math.sin(i * 1.26) * 1.6], [2.7, .22, .7], [0, -i * 1.26, -.13]);
        } else {
            mesh(decor, cylinder, '#967e57', [p[0], p[1] + 1.7 * scale, p[2]], [.35, 3.4 * scale, .35]);
            mesh(decor, ball, mood.tree, [p[0], p[1] + 4 * scale, p[2]], [2.1 * scale, 2.9 * scale, 2.1 * scale]);
            mesh(decor, ball, mood.leaf, [p[0] + .65, p[1] + 5.5 * scale, p[2] + .3], [1.8 * scale, 1.9 * scale, 1.65 * scale]);
        }
        mesh(decor, ball, region === 'coast' ? '#f2e4bb' : '#a2bd88', [p[0] + side * 18, p[1] - 1, p[2]], [12, 7 * scale, 13]);
        if (s % 36 === 16) {
            const flag = roadPosition(s, side * 8.7); mesh(decor, cylinder, '#f0e8c8', [flag[0], flag[1] + 2.5, flag[2]], [.07, 5, .07]);
            mesh(decor, box, side < 0 ? '#eab958' : '#4b9b94', [flag[0] + .62, flag[1] + 4.4, flag[2]], [1.2, .65, .07]);
        }
    }
    // Broad painted clouds and far hills leave the road's silhouette clear.
    for (let s = 30; s < length + 300; s += low ? 180 : 105) for (const side of [-1, 1]) {
        for (let i = 0; i < 3; i++) mesh(decor, ball, '#f3f1e6', [roadX(s) + side * 48 + i * 7, 27 + i % 2 * 3, -s], [9, 3.5 + i, 5]);
        if (region === 'valley') mesh(decor, ball, '#9fbd94', [roadX(s) + side * 80, -2, -s - 20], [40, 21, 50]);
    }
    bake(decor); ball.dispose(); return root;
}
export function makeGate(options: AnswerValue[], finish = false) {
    const root = new T.Group(), frame = new T.Group(); root.add(frame);
    for (const x of [-6.1, 6.1]) { mesh(frame, box, '#e9d8a7', [x, 3, 0], [.4, 6, .5]); mesh(frame, box, '#388e87', [x, 1, 0], [.55, 2, .65]); }
    mesh(frame, box, finish ? '#f0c969' : '#438f87', [0, 6, 0], [12.6, .75, .6]);
    if (finish) for (let i = 0; i < 16; i++) mesh(frame, box, i % 2 ? '#eee5cd' : '#3d5859', [-5.6 + i * .75, 6, .32], [.7, .6, .06]);
    bake(frame);
    if (!finish) options.forEach((n, i) => {
        const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 160;
        const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#fff5d9'; ctx.fillRect(0, 0, 256, 160);
        ctx.strokeStyle = '#dcb66c'; ctx.lineWidth = 12; ctx.strokeRect(6, 6, 244, 148);
        ctx.font = 'bold ' + Math.min(90, 370 / String(n).length) + 'px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#214b50'; ctx.fillText(String(n), 128, 86, 224);
        const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace;
        const plane = new T.Mesh(new T.PlaneGeometry(3.15, 1.96), new T.MeshBasicMaterial({ map: texture })); plane.position.set((i - 1) * 4, 4.4, .35); root.add(plane);
    });
    return root;
}
