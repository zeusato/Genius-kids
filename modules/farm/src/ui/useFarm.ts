import { useEffect, useRef, useState } from 'react';
import { openLocalFarm } from '../adapters/local';
import type { CommandResult, FarmCommand, FarmSession, FarmState } from '../core/types';
import { renderSnapshot } from './renderSnapshot';
export function useFarm(openSession: () => Promise<FarmSession> = openLocalFarm) {
    const gateway = useRef<FarmSession | null>(null);
    const [state, setState] = useState<FarmState | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
    const [toast, setToast] = useState(''), [saved, setSaved] = useState(false);
    useEffect(() => {
        let active = true;
        openSession().then(g => { if (active) {
            gateway.current = g;
            const snapshot = g.getSnapshot();
            setState(previous => renderSnapshot(previous, snapshot));
            setSaved(true);
        }
        else
            void g.close(); }).catch(e => active && setError(String(e.message ?? e)));
        const tick = window.setInterval(() => { if (gateway.current && active) {
            const snapshot = gateway.current.getSnapshot();
            setState(previous => renderSnapshot(previous, snapshot));
        } }, 1000);
        const checkpoint = () => { if (gateway.current)
            gateway.current.checkpoint().then(() => { if (active)
                setSaved(true); }).catch(e => active && setError(e.message)); };
        const save = window.setInterval(checkpoint, 15000);
        const hide = () => { if (document.visibilityState === 'hidden')
            checkpoint(); };
        document.addEventListener('visibilitychange', hide);
        return () => { active = false; clearInterval(tick); clearInterval(save); document.removeEventListener('visibilitychange', hide); const old = gateway.current; gateway.current = null; void old?.close(); };
    }, [openSession]);
    useEffect(() => { if (!toast)
        return; const timer = setTimeout(() => setToast(''), 4500); return () => clearTimeout(timer); }, [toast]);
    async function dispatch(command: FarmCommand, committed?: (result: CommandResult) => void) {
        if (!gateway.current || error)
            return false;
        setBusy(true);
        setSaved(false);
        try {
            const result = await gateway.current.execute(command);
            const snapshot = gateway.current.getSnapshot();
            setState(previous => renderSnapshot(previous, snapshot));
            setToast(result.message);
            setSaved(true);
            if (result.ok) committed?.(result);
            return result.ok;
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Không lưu được nông trại.');
            return false;
        }
        finally {
            setBusy(false);
        }
    }
    async function restore(imported: FarmState) {
        if (!gateway.current || error)
            return;
        setBusy(true);
        try {
            await gateway.current.importSnapshot(imported);
            const snapshot = gateway.current.getSnapshot();
            setState(previous => renderSnapshot(previous, snapshot));
            setToast('Đã khôi phục bản sao.');
            setSaved(true);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Không khôi phục được bản sao.');
        }
        finally {
            setBusy(false);
        }
    }
    return { state, error, busy, toast, saved, dispatch, restore, notify: setToast, exportOriginal: () => gateway.current?.exportOriginal?.() ?? Promise.resolve(null) };
}
