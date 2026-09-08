import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
export function SoundModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose?: () => void }) {
    const id = useId(), ref = useRef<HTMLDivElement>(null), closeRef = useRef(onClose); closeRef.current = onClose;
    useEffect(() => {
        const previous = document.activeElement as HTMLElement | null, el = ref.current!;
        const focusable = () => [...el.querySelectorAll<HTMLElement>('button:not(:disabled), input, select, [tabindex="0"]')];
        (focusable()[0] || el).focus();
        const key = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeRef.current?.(); }
            if (e.key === 'Tab') {
                const all = focusable(), first = all[0], last = all[all.length - 1];
                if (!first) { e.preventDefault(); return; }
                if (e.shiftKey && (document.activeElement === first || !el.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        };
        el.addEventListener('keydown', key); const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
        return () => { el.removeEventListener('keydown', key); document.body.style.overflow = overflow; previous?.focus(); };
    }, []);
    return <div className="sm-overlay"><div className="sm-modal" ref={ref} role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1}><header><h2 id={id}>{title}</h2>{onClose && <button className="sm-icon" aria-label="Đóng" onClick={onClose}><X size={20}/></button>}</header>{children}</div></div>;
}
