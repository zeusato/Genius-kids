// Trang /papercut trong app: bàn cắt giấy của hồ sơ hiện tại. `?dev=1` hiện thêm bảng số đo cho kiểm thử.
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useStudent, useStudentActions } from '../../contexts/StudentContext';
import { HubShell } from '../../components/hub/HubShell';
import { activeAccountScope } from '../../pottery/persistence/repository';
import { isPreschool } from '../../utils/grade';
import { PapercutStudio } from './PapercutStudio';
import './papercut.css';

export function PapercutPage() {
  const [params] = useSearchParams();
  const { currentStudent } = useStudent(), { savePapercut } = useStudentActions(), navigate = useNavigate();
  if (!currentStudent) return <Navigate to="/" replace />;
  const scope = { account: activeAccountScope(), student: currentStudent.id };
  return (
    <HubShell student={currentStudent} section="Xưởng Cắt Giấy" backLabel="Về Góc Thủ Công" onBack={() => navigate('/crafts')}>
      <PapercutStudio key={scope.account + ':' + scope.student} scope={scope} dev={params.get('dev') === '1'} preschool={isPreschool(currentStudent.grade)}
        onExit={() => navigate('/crafts')} onReward={e => savePapercut(currentStudent.id, e)} />
    </HubShell>
  );
}
