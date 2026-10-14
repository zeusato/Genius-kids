import type { ShapeDoc } from '../model';

/** Inset the outer polyline by a wall thickness, measured normal to its surface.
 * For each segment, minimize r(y') - sqrt(t² - (y' - y)²). This is the
 * inward envelope of discs of radius t, so corners cannot puncture the shell.
 * The old fixed 2*t radial offset unnecessarily choked a straight vase neck.
 */
export function cavityRadius(shape: ShapeDoc, fraction: number): number {
  const y = Math.max(0, Math.min(1, fraction)) * shape.height;
  const t = shape.thickness, step = shape.height / (shape.radii.length - 1);
  let radius = Infinity;
  for (let i = 0; i < shape.radii.length - 1; i++) {
    const lo = Math.max(i * step, y - t), hi = Math.min((i + 1) * step, y + t);
    if (lo > hi) continue;
    const slope = (shape.radii[i + 1] - shape.radii[i]) / step;
    const sampleY = Math.max(lo, Math.min(hi, y - slope * t / Math.hypot(1, slope)));
    const outer = shape.radii[i] + slope * (sampleY - i * step);
    radius = Math.min(radius, outer - Math.sqrt(Math.max(0, t * t - (sampleY - y) ** 2)));
  }
  // Extremely narrow necks retain a small opening. The existing radius/slope
  // constraints still keep more than the minimum safe wall around this opening.
  return Math.max(.04, radius);
}

/** Approximate how much diffuse environment light reaches the inside.
 * This is geometry-based ambient occlusion, not a dark disc covering the mouth.
 * Directional lights and real cast shadows are still evaluated by Three.js.
 */
export function cavityExposure(shape: ShapeDoc, y: number, opening?: number): number {
  if (shape.depth <= .01) return 1;
  let aperture = opening ?? cavityRadius(shape, 1);
  if (opening === undefined) {
    const start = Math.max(0, Math.ceil(y / shape.height * (shape.radii.length - 1)));
    for (let i = start; i < shape.radii.length; i++) {
      aperture = Math.min(aperture, cavityRadius(shape, i / (shape.radii.length - 1)));
    }
  }
  const depth = Math.max(0, shape.height - y);
  return .1 + .9 * (aperture / (aperture + depth * .9)) ** 1.6;
}
