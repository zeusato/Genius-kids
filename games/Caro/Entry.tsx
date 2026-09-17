import { useCallback } from 'react';
import { useStudent, useStudentActions } from '../../src/contexts/StudentContext';
import type { Match } from './model';
import CaroGame from './CaroGame';
export default function Entry({ onExit }: { onExit(): void }) {
  const { currentStudent } = useStudent(), { completeCaro } = useStudentActions();
  const complete = useCallback((match: Match) => currentStudent ? completeCaro(currentStudent.id, match).ok : false, [currentStudent?.id, completeCaro]);
  return currentStudent ? <CaroGame key={currentStudent.id} owner={currentStudent} complete={complete} onExit={onExit}/> : null;
}
