export type Seating = 'opposite' | 'same';
export const TURN_ROTATION_MS = 1200;

/** Only two humans sharing one viewing side follow the active colour. */
export function turnFacing(seating: Seating, twoHumans: boolean, active: number, playing: boolean): boolean | null {
  return seating === 'same' && twoHumans && playing ? active === 1 : null;
}

export function nearestAngle(from: number, to: number): number {
  return from + Math.atan2(Math.sin(to - from), Math.cos(to - from));
}
