import React, { useEffect, useRef } from 'react';
import { createSceneClickGuard } from './sceneClickGuard';

export const SceneInteractionBoundary: React.FC<React.PropsWithChildren> = ({ children }) => {
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        const doc = root.ownerDocument;
        const win = doc.defaultView;
        const guard = createSceneClickGuard();
        const onClick = (event: MouseEvent) => {
            if (!guard.shouldBlockClick(event)) return;
            event.preventDefault();
            event.stopImmediatePropagation();
        };

        // Capture before both R3F raycasting and the HTML labels handle clicks.
        // Document listeners also track drags that leave the scene or use pointer capture.
        root.addEventListener('pointerdown', guard.pointerDown, true);
        doc.addEventListener('pointermove', guard.pointerMove, true);
        doc.addEventListener('pointerup', guard.pointerUp, true);
        doc.addEventListener('pointercancel', guard.pointerCancel, true);
        root.addEventListener('click', onClick, true);
        root.addEventListener('dblclick', onClick, true);
        win?.addEventListener('blur', guard.blur);
        return () => {
            root.removeEventListener('pointerdown', guard.pointerDown, true);
            doc.removeEventListener('pointermove', guard.pointerMove, true);
            doc.removeEventListener('pointerup', guard.pointerUp, true);
            doc.removeEventListener('pointercancel', guard.pointerCancel, true);
            root.removeEventListener('click', onClick, true);
            root.removeEventListener('dblclick', onClick, true);
            win?.removeEventListener('blur', guard.blur);
        };
    }, []);

    return <div ref={rootRef} className="w-full h-full">{children}</div>;
};
