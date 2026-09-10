export function roadX(s: number) { return Math.sin(s / 125) * 16 + Math.sin(s / 290) * 24; }
export function roadY(s: number) { return Math.sin(s / 155) * 1.5; }
export function roadAngle(s: number) { return -Math.atan(Math.cos(s / 125) * 16 / 125 + Math.cos(s / 290) * 24 / 290); }
export function roadPosition(s: number, offset = 0, height = 0): [number, number, number] {
    const angle = roadAngle(s); return [roadX(s) + Math.cos(angle) * offset, roadY(s) + height, -s - Math.sin(angle) * offset];
}
