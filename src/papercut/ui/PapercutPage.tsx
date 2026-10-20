// Trang /papercut trong app: bàn cắt giấy của hồ sơ hiện tại. `?dev=1` hiện thêm bảng số đo cho kiểm thử.
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useStudent } from '../../contexts/StudentContext';
import { HubShell } from '../../components/hub/HubShell';
import { PapercutStudio } from './PapercutStudio';
import './papercut.css';

export function PapercutPage() {
  const [params] = useSearchParams();
  const { currentStudent } = useStudent(), navigate = useNavigate();
  if (!currentStudent) return <Navigate to="/" replace />;
  return (
    <HubShell student={currentStudent} section="Xưởng Cắt Giấy" backLabel="Về Góc Thủ Công" onBack={() => navigate('/crafts')}>
      <PapercutStudio key={currentStudent.id} dev={params.get('dev') === '1'} onExit={() => navigate('/crafts')} />
    </HubShell>
  );
}
