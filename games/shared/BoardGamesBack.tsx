import { ArrowLeft } from 'lucide-react';
import './board-games-back.css';

export function BoardGamesBack({ onBack }: { onBack: () => void }) {
  return <button type="button" className="board-games-back" onClick={onBack}>
    <ArrowLeft size={19} aria-hidden="true"/><span>Về Board games</span>
  </button>;
}
