import { useCallback } from 'react';
import { useStudent, useStudentActions } from '../../src/contexts/StudentContext';
import CoTuongGame from './CoTuongGame';
import type { Match } from './model';

export default function Entry({ onExit }: { onExit(): void }) {
  const { currentStudent } = useStudent();
  const { completeCoTuong } = useStudentActions();
  const complete = useCallback((match: Match) => currentStudent ? completeCoTuong(currentStudent.id, match).ok : false, [currentStudent?.id, completeCoTuong]);
  return currentStudent ? <CoTuongGame key={currentStudent.id} owner={currentStudent} onExit={onExit} complete={complete}/> : null;
}
