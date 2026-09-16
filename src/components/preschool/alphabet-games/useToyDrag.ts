import { useRef, useState } from 'react';

export function useToyDrag(onDrop: (itemId: string, target: HTMLElement) => void) {
    const active = useRef<{ pointerId: number; itemId: string; x: number; y: number } | null>(null);
    const [drag, setDrag] = useState<{ itemId: string; x: number; y: number } | null>(null);
    const bind = (itemId: string) => ({
        onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
            if (event.button !== 0) return;
            active.current = { pointerId: event.pointerId, itemId, x: event.clientX, y: event.clientY };
            event.currentTarget.setPointerCapture(event.pointerId);
        },
        onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
            const value = active.current;
            if (!value || value.pointerId !== event.pointerId) return;
            if (Math.hypot(event.clientX - value.x, event.clientY - value.y) > 8) {
                event.preventDefault(); setDrag({ itemId, x: event.clientX - value.x, y: event.clientY - value.y });
            }
        },
        onPointerUp: (event: React.PointerEvent<HTMLElement>) => {
            const value = active.current;
            if (!value || value.pointerId !== event.pointerId) return;
            const moved = Math.hypot(event.clientX - value.x, event.clientY - value.y) > 8;
            const target = document.elementsFromPoint(event.clientX, event.clientY).find(element => element.hasAttribute('data-alphabet-drop'));
            active.current = null; setDrag(null);
            if (moved && target) onDrop(itemId, target as HTMLElement);
            if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        },
        onPointerCancel: () => { active.current = null; setDrag(null); },
        style: drag?.itemId === itemId ? { transform: `translate(${drag.x}px, ${drag.y}px) scale(1.04)`, zIndex: 8 } : undefined,
    });
    return { bind, dragging: drag?.itemId ?? null };
}
