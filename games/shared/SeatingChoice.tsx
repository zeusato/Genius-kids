import type { Seating } from './seating';
import './seating.css';

export default function SeatingChoice({ value, onChange }: { value: Seating; onChange(value: Seating): void }) {
  return <fieldset className='chess-seating'><legend>Chỗ ngồi của hai người</legend><div>
    <button type='button' aria-pressed={value === 'opposite'} onClick={() => onChange('opposite')}><strong>Ngồi đối diện</strong><small>Hai phía · Giữ hướng bàn</small></button>
    <button type='button' aria-pressed={value === 'same'} onClick={() => onChange('same')}><strong>Ngồi cùng phía</strong><small>Tự xoay về bên đến lượt</small></button>
  </div></fieldset>;
}
