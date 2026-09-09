import React from 'react';
import {useStudent,useStudentActions} from '../../src/contexts/StudentContext';
import {useMusicControls} from '../../src/contexts/MusicContext';
import {ArcadeGame} from './arcade/ArcadeGame';

export function SpeedMathGame({difficulty,onBack}:{difficulty:string;onBack:()=>void}){
 const {currentStudent}=useStudent();
 const {completeSpeedGame}=useStudentActions();
 const controls=useMusicControls();
 if(!currentStudent)return <div role="status">Chọn hồ sơ học sinh để bắt đầu.</div>;
 return <ArcadeGame key={currentStudent.id} student={currentStudent} difficulty={difficulty} controls={controls} complete={completeSpeedGame} onBack={onBack}/>;
}
