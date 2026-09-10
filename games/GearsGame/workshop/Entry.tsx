import React from 'react';
import { useStudent, useStudentActions } from '../../../src/contexts/StudentContext';
import Workshop from './Workshop';
import type { Difficulty } from './model';
export default function Entry({difficulty,onBack,onLegacy,mode}:{difficulty?:Difficulty;onBack:()=>void;onLegacy:()=>void;mode:'build'|'guess'}){
    const {currentStudent}=useStudent(),{completeGearsGame}=useStudentActions();
    if(!currentStudent)return <p>Chọn hồ sơ học sinh để mở xưởng.</p>;
    return <Workshop key={currentStudent.id+mode} student={currentStudent} difficulty={difficulty} initialMode={mode} complete={completeGearsGame} onBack={onBack} onLegacy={onLegacy}/>;
}
