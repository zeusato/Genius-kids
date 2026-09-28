import * as THREE from 'three';
import type { Vec3 } from '../noise';
import type { ShellShape } from '../shell';
import type { ERShapeParams } from '../organelles/erGeometry';
import { insideSuperellipsoid } from '../organelles/placement';

// === Hằng số bố cục (thuần, không React) — nguồn duy nhất cho component tế bào VÀ test ===

// ---- Tế bào động vật (bán kính ~2.4 ≙ 10 µm) ----
export const ANIMAL_HALF: [number, number, number] = [2.45, 2.28, 2.36];
export const ANIMAL_THICK = 0.075;
export const ANIMAL_INNER: ShellShape = {
    half: [ANIMAL_HALF[0] - ANIMAL_THICK, ANIMAL_HALF[1] - ANIMAL_THICK, ANIMAL_HALF[2] - ANIMAL_THICK], exp: 2
};
export const ANIMAL_NUCLEUS: { center: Vec3; radius: number } = { center: [-0.35, 0.15, -0.25], radius: 0.82 };
export const ANIMAL_GOLGI_POS: Vec3 = [1.3, -0.5, 0.55];
export const ANIMAL_GOLGI_AXIS: Vec3 = [1.65, -0.65, 0.8];
export const ANIMAL_CENTROSOME: Vec3 = [0.72, 0.8, 0.8];

export const ANIMAL_ER: ERShapeParams = {
    nucleusCenter: ANIMAL_NUCLEUS.center,
    nucleusRadius: ANIMAL_NUCLEUS.radius,
    facing: [-0.2, -0.35, -0.9],
    seed: 'animal',
    labelDir: [-0.75, -0.55, 0.2],
    bounds: ANIMAL_INNER,
    avoid: [{ center: ANIMAL_GOLGI_POS, radius: 0.55 }, { center: ANIMAL_CENTROSOME, radius: 0.3 }]
};

// ---- Tế bào thực vật (hộp bo tròn; bán trục x 3.0 ≙ 25 µm) ----
export const PLANT_WALL_HALF: [number, number, number] = [3.0, 2.1, 1.95];
export const PLANT_WALL_THICK = 0.2;
export const PLANT_MEM_HALF: [number, number, number] = [2.785, 1.885, 1.735];
export const PLANT_MEM_THICK = 0.05;
export const PLANT_INNER: ShellShape = {
    half: [PLANT_MEM_HALF[0] - PLANT_MEM_THICK, PLANT_MEM_HALF[1] - PLANT_MEM_THICK, PLANT_MEM_HALF[2] - PLANT_MEM_THICK], exp: 5
};
export const PLANT_VAC_CENTER: Vec3 = [0.3, 0, -0.05];
export const PLANT_VAC_HALF: [number, number, number] = [1.95, 1.22, 1.05];
export const PLANT_VAC_EXP = 3.6;
export const PLANT_NUCLEUS: { center: Vec3; radius: number } = { center: [-2.18, 0.45, 0.3], radius: 0.48 };
export const PLANT_GOLGI_POS: Vec3 = [-1.9, -0.95, 0.75];

export function insidePlantVacuole(p: THREE.Vector3, margin: number): boolean {
    return insideSuperellipsoid(p, PLANT_VAC_CENTER, PLANT_VAC_HALF, PLANT_VAC_EXP, margin);
}

export const PLANT_ER: ERShapeParams = {
    nucleusCenter: PLANT_NUCLEUS.center,
    nucleusRadius: PLANT_NUCLEUS.radius,
    facing: [0.1, 0.9, 0.45],
    spread: 1.3,
    seed: 'plant',
    labelDir: [-0.2, 1, 0.3],
    bounds: PLANT_INNER,
    avoid: [{ center: PLANT_GOLGI_POS, radius: 0.4 }],
    reject: (p) => insidePlantVacuole(p, 0.08)
};
