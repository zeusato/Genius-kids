// ============================================================================
//  Luật thắng / chấm điểm — hàm THUẦN, tách khỏi React (trước đây nằm lẫn
//  trong setInterval và trong handler của component).
// ============================================================================

import { BuildLevel, Dir, SimResult } from './types';

/** BUILD: target quay đúng chiều, đủ tốc độ, mọi bánh cố định đều quay, không kẹt. */
export const evaluateBuildGoal = (sim: SimResult, level: BuildLevel): boolean => {
    if (sim.jammed) return false;
    const target = sim.runtime.get('target');
    if (!target || target.state !== 'driven') return false;
    if (target.dir !== level.targetDirection) return false;
    if (level.targetMinSpeed && target.speed < level.targetMinSpeed) return false;
    return level.fixedGearIds.every((id) => sim.runtime.get(id)?.state === 'driven');
};

/** GUESS: so chiều đoán với chiều thật cho từng bánh cần đoán. */
export const gradeGuess = (
    sim: SimResult,
    gearsToGuess: string[],
    guesses: Map<string, Dir>
): Map<string, boolean> => {
    const results = new Map<string, boolean>();
    for (const id of gearsToGuess) {
        const guess = guesses.get(id);
        const actual = sim.runtime.get(id)?.dir ?? 0;
        if (guess !== undefined) results.set(id, guess === actual);
    }
    return results;
};
