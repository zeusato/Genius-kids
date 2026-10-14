// Trang /bricks trong app: hồ sơ học sinh hiện tại → Tủ Mô Hình ↔ màn lắp.
import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useStudent, useStudentActions } from '../../contexts/StudentContext';
import { HubShell } from '../../components/hub/HubShell';
import { isPreschool } from '../../utils/grade';
import { BrickStudio } from './BrickStudio';

export function BricksPage() {
  const { saveBricks } = useStudentActions();
  const { currentStudent } = useStudent(), navigate = useNavigate();
  if (!currentStudent) return <Navigate to="/" replace />;
  return (
    <HubShell student={currentStudent} section="Xưởng Lắp Ghép" backLabel="Về Góc Thủ Công" onBack={() => navigate('/crafts')}>
      <BrickStudio progress={currentStudent.bricks} onProgress={event => saveBricks(currentStudent.id, event)} key={currentStudent.id} ownerId={currentStudent.id} author={currentStudent.name} preschool={isPreschool(currentStudent.grade)} onExit={() => navigate('/crafts')} />
    </HubShell>
  );
}
