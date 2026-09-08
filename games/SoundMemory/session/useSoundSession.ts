import { useCallback, useEffect, useRef, useState } from 'react';
import { Action, reduceSound, SoundSession } from '../engine/game';
import { saveSoundDraft } from '../progress/progress';
export function useSoundSession(initial: SoundSession, studentId: string) {
    const [state, setState] = useState(initial), ref = useRef(initial), [storageError, setStorageError] = useState(false);
    const send = useCallback((action: Action) => {
        const next = reduceSound(ref.current, action); if (next === ref.current) return next;
        ref.current = next; setState(next);
        if (action.type !== 'tick') setStorageError(!saveSoundDraft(studentId, next));
        return next;
    }, [studentId]);
    useEffect(() => {
        setStorageError(!saveSoundDraft(studentId, ref.current));
        const timer = setInterval(() => {
            if (!ref.current.paused && ref.current.phase !== 'complete') send({ type: 'tick', seconds: 1 });
        }, 1000);
        return () => { clearInterval(timer); };
    }, [studentId, send]);
    return { state, ref, send, storageError };
}
