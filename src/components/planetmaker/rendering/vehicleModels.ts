import { emptyInstances } from './architecture';
export const VEHICLES = ['Ô tô', 'Taxi', 'Xe buýt', 'Xe tải', 'Cứu thương', 'Cứu hỏa'] as const;
export function vehicleParts(type: number) {
    const parts = emptyInstances(), colors = ['#78afbd', '#edc064', '#7baf87', '#be9b7d', '#e8e7d9', '#c96d59'];
    const long = type >= 2, length = long ? .85 : .65;
    const box = (x: number, y: number, z: number, scale: [number, number, number], color: string) => parts.box.push({ position: [x, y, z], scale, color });
    box(0, .22, 0, [.36, .22, length], colors[type]);
    box(0, .41, type === 3 ? .23 : -.04, [.32, long ? .28 : .2, type === 3 ? .25 : length * .65], type === 4 ? '#ecece2' : colors[type]);
    box(0, .43, length * .32, [.28, .12, .025], '#8abac8');
    for (const side of [-1, 1]) {
        box(side * .17, .43, -.02, [.025, .12, length * .45], '#a2cad0');
        for (const z of [-length * .3, length * .3]) parts.cylinder.push({ position: [side * .19, .14, z], scale: [.19, .07, .19], roll: Math.PI / 2, color: '#354653' });
        box(side * .11, .24, length / 2 + .01, [.085, .065, .025], '#fff0bd');
        box(side * .11, .24, -length / 2 - .01, [.075, .055, .025], '#c75952');
    }
    if (type === 1) box(0, .56, 0, [.15, .07, .12], '#ffda81');
    if (type === 2) for (const z of [-.22, 0, .22]) for (const side of [-1, 1]) box(side * .18, .47, z, [.025, .14, .15], '#b3d8d9');
    if (type === 3) box(0, .44, -.16, [.34, .28, .42], '#d5c7a8');
    if (type >= 4) { box(-.085, .6, 0, [.12, .07, .1], '#7baac9'); box(.085, .6, 0, [.12, .07, .1], '#e47d6a'); }
    if (type === 4) for (const side of [-1, 1]) { box(side * .19, .41, -.19, [.02, .18, .055], '#d47968'); box(side * .19, .41, -.19, [.02, .055, .18], '#d47968'); }
    if (type === 5) { for (const x of [-.095, .095]) box(x, .63, -.05, [.035, .04, .55], '#dae2dc'); for (let i = 0; i < 5; i++) box(0, .63, -.25 + i * .1, [.22, .035, .025], '#dae2dc'); }
    return parts;
}
