import { useEffect, useRef, type ReactNode } from 'react';
import { ITEMS, type ItemId } from '../core/catalog';
import { progressOf } from '../core/engine';
import type { FarmState } from '../core/types';
export const duration = (ms: number) => { const m = Math.max(0, Math.ceil(ms / 60000)); return m >= 1440 ? `${Math.floor(m / 1440)} ngày ${Math.floor(m % 1440 / 60)} giờ` : m >= 60 ? `${Math.floor(m / 60)} giờ ${m % 60} phút` : ms < 60000 ? `${Math.max(0, Math.ceil(ms / 1000))} giây` : `${m} phút`; };
export function Goods({ items, state }: {
    items: Partial<Record<ItemId, number>>;
    state?: FarmState;
}) { return <div className="farm-goods">{Object.entries(items).map(([id, n]) => <span key={id} className={state && state.inventory[id as ItemId] < n! ? 'missing' : ''}><i style={{ background: ITEMS[id as ItemId].color }}/>{ITEMS[id as ItemId].name} <b>{state ? `${state.inventory[id as ItemId]}/` : ''}{n}</b></span>)}</div>; }
export function Progress({ start, end, now }: {
    start: number;
    end: number;
    now: number;
}) { return <><div className="farm-progress"><span style={{ width: `${progressOf(start, end, now) * 100}%` }}/></div><small>{end <= now ? 'Đã xong' : `Còn ${duration(end - now)}`}</small></>; }
export function Dialog({ title, children, onClose, wide = false, className = '' }: {
    title: string;
    children: ReactNode;
    onClose: () => void;
    wide?: boolean;
    className?: string;
}) {
    const ref = useRef<HTMLElement>(null), close = useRef(onClose); close.current = onClose;
    useEffect(() => {
        const old = document.activeElement as HTMLElement | null, el = ref.current;
        el?.focus();
        const key = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { e.preventDefault(); close.current(); }
            if (e.key !== 'Tab') return;
            const list = [...(el?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],summary') ?? [])].filter(e => e.getClientRects().length);
            if (!list.length) { e.preventDefault(); el?.focus(); }
            else if (e.shiftKey && (document.activeElement === list[0] || document.activeElement === el)) { e.preventDefault(); list.at(-1)?.focus(); }
            else if (!e.shiftKey && document.activeElement === list.at(-1)) { e.preventDefault(); list[0]?.focus(); }
        };
        el?.addEventListener('keydown', key);
        return () => { el?.removeEventListener('keydown', key); if (old?.isConnected) old.focus({ preventScroll: true }); };
    }, []);
    return <div className="farm-modal-backdrop" onPointerDown={e => { if (e.target === e.currentTarget) onClose(); }}><section ref={ref} className={`farm-modal farm-game-window ${wide ? 'farm-game-window-wide' : ''} ${className}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}><header className="farm-window-heading"><div><small>LÀNG MẦM · CHUYỆN TRONG VƯỜN</small><h2>{title}</h2></div><button aria-label="Đóng hộp thoại" onClick={onClose}>×</button></header><div className="farm-window-content">{children}</div></section></div>;
}
