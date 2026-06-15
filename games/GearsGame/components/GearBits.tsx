import React from 'react';
import { Difficulty, GearRole } from '../engine/types';

// Nhãn vai trò gắn cạnh bánh răng (MOTOR/ĐÍCH) — dùng chung cho cả hai mode.
export const RoleBadge: React.FC<{ role: GearRole }> = ({ role }) => {
    if (role === 'motor')
        return (
            <div className="absolute -left-16 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-xs bg-white px-2 py-1 rounded shadow border-2 border-emerald-300 whitespace-nowrap">
                ⚡ MOTOR
            </div>
        );
    if (role === 'target')
        return (
            <div className="absolute -right-12 top-1/2 -translate-y-1/2 text-rose-600 font-bold text-xs bg-white px-2 py-1 rounded shadow border-2 border-rose-300 whitespace-nowrap">
                🎯 ĐÍCH
            </div>
        );
    return null;
};

const LABEL: Record<Difficulty, string> = { easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' };
const CLS: Record<Difficulty, string> = {
    easy: 'bg-green-100 text-green-700 border-green-300',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    hard: 'bg-red-100 text-red-700 border-red-300',
};

export const DifficultyPill: React.FC<{ difficulty: Difficulty }> = ({ difficulty }) => (
    <span className={`text-sm px-3 py-1 rounded-full font-medium border ${CLS[difficulty]}`}>{LABEL[difficulty]}</span>
);
