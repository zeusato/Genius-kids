export default function OnBoardChoice({count,onDirection,onCancel}:{count:number;onDirection:(side:'left'|'right')=>void;onCancel:()=>void}){
  return <div className='oaq-onboard-choice' onPointerDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()}>
    <span>{count} dân · chọn hướng rải</span>
    <div><button aria-label='Rải sang trái' onClick={()=>onDirection('left')}>← <small>Trái</small></button><button aria-label='Rải sang phải' onClick={()=>onDirection('right')}><small>Phải</small> →</button></div>
    <button className='oaq-onboard-cancel' onClick={onCancel}>Chọn ô khác</button>
  </div>;
}
