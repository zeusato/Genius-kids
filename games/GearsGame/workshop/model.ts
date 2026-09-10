import type { BeltSpec, Difficulty, Dir, GearLayout, SimResult } from '../engine/types';
export type { Difficulty, Dir };
export type Machine = 'fan' | 'pump' | 'train' | 'bridge' | 'garden' | 'clock';
export interface Socket { id: string; x: number; y: number; label: string; teeth?: number; locked?: boolean; role?: 'motor' | 'target' | 'gear'; pulley?: boolean }
export interface Design { gears: Record<string, number>; belts: BeltSpec[]; guesses: Record<string, Dir> }
export interface Goal { id: string; label: string; dir: 1 | -1; speed?: number }
export interface Mission {
    id: number; key: string; title: string; subtitle: string; story: string; skill: string; machine: Machine;
    difficulty: Difficulty; mode: 'build' | 'guess' | 'repair'; sockets: Socket[]; initial: Design; solution: Design;
    stock: Record<number, number>; belts: number; maxBeltLength: number; maxParts: number; par: number;
    goals: Goal[]; predictions: {id:string;label:string}[]; hints: string[]; river?: { x: number; width: number }; seed: number;
}
export interface Check { id: string; label: string; ok: boolean; detail: string; focus?: string }
export interface Evaluation { valid: boolean; success: boolean; checks: Check[]; sim: SimResult; layout: GearLayout; stars: number; used: number }
export interface WorkshopRecord { version: 1; mission: number; difficulty: Difficulty; seed: number; stars: number; design: Design }
export const LEVELS = [{ id: 'easy', label: 'Dễ', detail: 'Có chỗ để thử' }, { id: 'medium', label: 'Vừa', detail: 'Thêm một bước nghĩ' }, { id: 'hard', label: 'Khó', detail: 'Tính kỹ từng món' }] as const;
export const emptyDesign = (): Design => ({ gears: {}, belts: [], guesses: {} });
