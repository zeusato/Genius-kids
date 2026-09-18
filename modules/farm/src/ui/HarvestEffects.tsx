import { useEffect, useRef, type CSSProperties, type RefObject } from 'react';
import type { CropId, ItemId } from '../core/catalog';
import { CropIcon } from './Icon';
import { ResourceIcon } from './ResourceIcon';
import { EnergyIcon } from './EnergyIcon';

export type HarvestFlight = { key: string; crop?: CropId; item?: ItemId | 'energy'; quantity: number; x: number; y: number; delay: number };
export function Sickle({ size = 38 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M27 37C6 28 16 6 39 7C25 13 24 25 36 29L27 37Z" fill="#e1e8df" stroke="#526e64" strokeWidth="2.5"/><path d="M29 33L51 56" stroke="#493c2d" strokeWidth="11" strokeLinecap="round"/><path d="M29 33L51 56" stroke="#bc854e" strokeWidth="7" strokeLinecap="round"/><path d="M31 34L36 39" stroke="#efd599" strokeWidth="8"/></svg>;
}

/** DOM cursor avoids a React render for each pointer movement. Touch appears only during a stroke. */
export function HarvestCursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const over = document.elementFromPoint(e.clientX, e.clientY);
      const visible = over instanceof HTMLCanvasElement && (e.pointerType !== 'touch' || e.buttons !== 0);
      if (!ref.current) return;
      ref.current.style.display = visible ? 'block' : 'none';
      ref.current.style.transform = `translate(${e.clientX - 20}px,${e.clientY - 27}px) rotate(${e.buttons ? -28 : 0}deg)`;
    };
    const hide = () => { if (ref.current) ref.current.style.display = 'none'; };
    window.addEventListener('pointermove', move); window.addEventListener('pointerdown', move);
    window.addEventListener('pointerup', hide); window.addEventListener('blur', hide);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerdown', move); window.removeEventListener('pointerup', hide); window.removeEventListener('blur', hide); };
  }, []);
  return <div ref={ref} className="farm-sickle-cursor" aria-hidden="true"><Sickle size={64}/></div>;
}

export function HarvestEffects({ flights, basket, energyTarget, reduced, done }: { flights: HarvestFlight[]; basket: RefObject<HTMLButtonElement | null>; energyTarget?: RefObject<HTMLDivElement | null>; reduced: boolean; done: (key: string) => void }) {
  return <div className="farm-harvest-effects" aria-hidden="true">{flights.map(f => <Flight key={f.key} flight={f} delay={f.delay} basket={f.item === 'energy' && energyTarget ? energyTarget : basket} reduced={reduced} done={done}/>)}</div>;
}
function Flight({ flight: f, delay, basket, reduced, done }: { flight: HarvestFlight; delay: number; basket: RefObject<HTMLElement | null>; reduced: boolean; done: (key: string) => void }) {
  const ref = useRef<HTMLDivElement>(null), onDone = useRef(done); onDone.current = done;
  useEffect(() => {
    const el = ref.current, target = basket.current?.getBoundingClientRect();
    if (!el || !target) { onDone.current(f.key); return; }
    const dx = target.left + target.width / 2 - f.x, dy = target.top + target.height / 2 - f.y;
    const motion = el.animate(reduced ? [{ opacity: 1 }, { opacity: 0 }] : [
      { transform: 'translate(-50%,-50%) scale(.65)', opacity: 0, offset: 0 },
      { transform: 'translate(-50%,calc(-50% - 36px)) scale(1.15)', opacity: 1, offset: .18 },
      { transform: `translate(calc(-50% + ${dx * .48}px),calc(-50% + ${dy * .55 - 85}px)) scale(1)`, opacity: 1, offset: .57 },
      { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.3)`, opacity: .5, offset: 1 },
    ], { duration: reduced ? 500 : 1100, delay, easing: 'ease-in-out', fill: 'both' });
    motion.onfinish = () => {
      if (!reduced) basket.current?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.16)' }, { transform: 'scale(1)' }], { duration: 280 });
      onDone.current(f.key);
    };
    return () => motion.cancel();
  }, [f, delay, reduced, basket]);
  return <div ref={ref} className="farm-harvest-flight" style={{ left: f.x, top: f.y } as CSSProperties}>{f.item === 'energy' ? <EnergyIcon size={38}/> : f.item ? <ResourceIcon id={f.item}/> : <CropIcon id={f.crop ?? 'wheat'} size={38}/>}<b>+{f.quantity}</b></div>;
}
