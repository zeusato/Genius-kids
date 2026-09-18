import * as T from 'three';

/** Rounded shoulders; connected edges reach the exact tile boundary with no border cap. */
export function roadGeometry(x: number, z: number, height: number, mask: number) {
    const r = .38, points: [number, number][] = [[-r, -r]];
    if (mask & 1) points.push([-r, -.5], [r, -.5]);
    points.push([r, -r]); if (mask & 2) points.push([.5, -r], [.5, r]);
    points.push([r, r]); if (mask & 4) points.push([r, .5], [-r, .5]);
    points.push([-r, r]); if (mask & 8) points.push([-.5, r], [-.5, -r]);
    const shape = new T.Shape();
    const corners = points.map((p, i) => {
        const prev = points[(i + points.length - 1) % points.length], next = points[(i + 1) % points.length];
        const radius = Math.abs(p[0]) === .5 || Math.abs(p[1]) === .5 ? 0 : .085;
        const approach = (q: [number, number]) => { const distance = Math.hypot(q[0] - p[0], q[1] - p[1]); const t = Math.min(radius, distance * .45) / distance; return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t] as const; };
        return { p, before: approach(prev), after: approach(next) };
    });
    shape.moveTo(corners[0].before[0], -corners[0].before[1]);
    for (const c of corners) { shape.lineTo(c.before[0], -c.before[1]); shape.quadraticCurveTo(c.p[0], -c.p[1], c.after[0], -c.after[1]); }
    shape.closePath();
    const geometry = new T.ShapeGeometry(shape, 4).rotateX(-Math.PI / 2).translate(x + .5, height + .038, z + .5);
    const positions = geometry.getAttribute('position'), uv = geometry.getAttribute('uv');
    // One continuous material coordinate system, even across corners and intersections.
    for (let i = 0; i < positions.count; i++) uv.setXY(i, positions.getX(i) / 2, positions.getZ(i) / 2);
    return geometry;
}
