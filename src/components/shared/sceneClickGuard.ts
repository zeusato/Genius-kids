type PointerPosition = Pick<PointerEvent, 'pointerId' | 'clientX' | 'clientY'>;

const DRAG_THRESHOLD_PX = 5;

export function createSceneClickGuard() {
    const pointers = new Map<number, { x: number; y: number }>();
    let dragged = false;

    const move = (event: PointerPosition) => {
        const start = pointers.get(event.pointerId);
        if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > DRAG_THRESHOLD_PX) {
            dragged = true;
        }
    };

    return {
        pointerDown(event: PointerPosition & Pick<PointerEvent, 'button'>) {
            if (pointers.size === 0) dragged = false;
            pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
            if (pointers.size > 1 || event.button !== 0) dragged = true;
        },
        pointerMove: move,
        pointerUp(event: PointerPosition) {
            move(event);
            pointers.delete(event.pointerId);
            // Keep the result through the click dispatched after pointerup.
        },
        pointerCancel(event: Pick<PointerEvent, 'pointerId'>) {
            if (pointers.delete(event.pointerId)) dragged = true;
        },
        blur() {
            if (pointers.size > 0) dragged = true;
            pointers.clear();
        },
        shouldBlockClick(event: Pick<MouseEvent, 'detail'>) {
            // Keyboard and assistive-technology activation have no pointer gesture.
            return event.detail !== 0 && dragged;
        }
    };
}
