import { useCallback } from 'react';
import { useStudent, useStudentActions } from '../../src/contexts/StudentContext';
import CoVua from './CoVuaGame';
import type { Match } from './model';

export default function Entry({ onExit }: { onExit(): void }) {
  const { currentStudent } = useStudent();
  const { completeCoVua } = useStudentActions();
  const complete = useCallback((match: Match) => currentStudent ? completeCoVua(currentStudent.id, match).ok : false, [currentStudent?.id, completeCoVua]);
  return currentStudent ? <CoVua key={currentStudent.id} owner={currentStudent} onExit={onExit} complete={complete}/> : null;
}
