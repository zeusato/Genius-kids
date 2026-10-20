// Điểm vào route /papercut/*. GĐ0 chỉ có bàn thử (?dev=1); module chưa gắn vào Góc Thủ Công (plan GĐ2).
import { Navigate, useSearchParams } from 'react-router-dom';
import { DevBench } from './DevBench';
import './papercut.css';

export function PapercutPage() {
  const [params] = useSearchParams();
  if (params.get('dev') !== '1') return <Navigate to="/crafts" replace />;
  return <DevBench />;
}
