import React, { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { cloud } from '../../services/account/cloud';
import { GUEST, ProfileCoordinator, type SyncState } from '../../services/account/coordinator';
import { readCache } from '../../services/account/vault';
import { ACTIVE_OWNER } from '../../services/account/snapshot';

interface AccountView {
    user: User | null; status: SyncState; error: string; updatedAt?: string;
    available: boolean; busy: boolean; canImport: boolean; hasBackup: boolean;
    login(): void; logout(): void; sync(): void; importGuest(): void; resolve(source: 'local' | 'cloud'): void;
    downloadBackup(): void;
}
const AccountContext = createContext<AccountView | null>(null);
export const useAccount = () => useContext(AccountContext);

export function AccountProvider({ children }: { children: ReactNode }) {
    const [manager] = useState(() => new ProfileCoordinator(cloud));
    const [user, setUser] = useState<User | null>(null);
    const [ready, setReady] = useState(false);
    const [busy, setBusy] = useState(false);
    const [locked, setLocked] = useState(false);
    const [error, setError] = useState('');
    const [status, setStatus] = useState<SyncState>('local');
    const [updatedAt, setUpdatedAt] = useState<string>();
    const [canImport, setCanImport] = useState(false);
    const [hasBackup, setHasBackup] = useState(false);
    const [generation, setGeneration] = useState(0);
    const queue = useRef(Promise.resolve());
    const mounted = useRef(false), initialized = useRef(false), switching = useRef(false);
    const syncQueued = useRef(false);
    const activeUser = useRef<User | null>(null);
    const refresh = async () => {
        if (!mounted.current) return;
        setStatus(manager.state); setUpdatedAt(manager.updatedAt);
        if (manager.owner === GUEST) { setCanImport(false); setHasBackup(false); return; }
        const current = await readCache(manager.owner), guest = await readCache(GUEST);
        setCanImport(manager.owner !== GUEST && !current?.snapshot.profiles.length && !!guest?.snapshot.profiles.length);
        setHasBackup(!!current?.backup);
    };
    const enqueue = (work: () => Promise<void>) => {
        queue.current = queue.current.then(work).catch(e => {
            if (mounted.current) setError(e instanceof Error ? e.message : 'Chưa kết nối được tài khoản; tiến trình vẫn lưu trên máy.');
        });
        return queue.current;
    };
    const sync = () => {
        if (!initialized.current || switching.current || syncQueued.current) return;
        syncQueued.current = true;
        void enqueue(async () => {
            setBusy(true); setError('');
            try { await manager.sync(); }
            finally { syncQueued.current = false; await refresh(); setBusy(false); }
        });
    };
    // All storage replacement happens while StudentProvider and games are unmounted.
    const replace = (work: () => Promise<void>, resumeOnError = false) => {
        switching.current = true;
        flushSync(() => { setReady(false); setBusy(true); setError(''); });
        return enqueue(async () => {
            let success = false;
            try { await work(); success = true; }
            finally {
                const resume = success || (resumeOnError && !localStorage.getItem('genius-profile-switch-v1'));
                initialized.current = resume;
                await refresh(); setBusy(false); switching.current = false;
                if (resume) { setGeneration(n => n + 1); setReady(true); }
            }
        });
    };
    const activate = (next: User | null) => {
        activeUser.current = next; setUser(next);
        return replace(() => manager.activate(next?.id || GUEST));
    };
    useEffect(() => {
        mounted.current = true;
        let stopped = false, release: (() => void) | undefined;
        const lockAbort = new AbortController();
        let lockNotice: number | undefined;
        let unsubscribe: (() => void) | undefined;
        const run = async () => {
            if (stopped) return;
            // Auth callbacks must return before any awaited Supabase operation.
            if (supabase) {
                const { data } = supabase.auth.onAuthStateChange((_event, session) => {
                    setTimeout(() => {
                        if (!stopped && (session?.user.id || GUEST) !== (activeUser.current?.id || GUEST)) void activate(session?.user || null);
                    }, 0);
                });
                unsubscribe = () => data.subscription.unsubscribe();
                const { data: session, error: authError } = await supabase.auth.getSession();
                if (stopped) return;
                await activate(session.session?.user || null);
                if (authError) setError('Chưa đăng nhập được. Hồ sơ trên máy được giữ lại; hãy thử đăng nhập Google lần nữa.');
            } else await activate(null);
        };
        if (navigator.locks) {
            // Queue briefly instead of ifAvailable: StrictMode's cleanup must release its first lease.
            lockNotice = window.setTimeout(() => { if (!stopped) setLocked(true); }, 800);
            void navigator.locks.request('genius-profile-workspace-v1', { signal: lockAbort.signal }, async () => {
                clearTimeout(lockNotice);
                if (stopped) return;
                setLocked(false);
                const held = new Promise<void>(resolve => { release = resolve; });
                try { await run(); if (!stopped) await held; } finally { release?.(); }
            }).catch(() => { clearTimeout(lockNotice); if (!stopped) setError('Không mở được bộ nhớ hồ sơ. Hãy tải lại trang.'); });
        } else {
            // Older browsers and HTTP LAN previews can still use the original guest workspace.
            // Account switching requires a lock; never expose an account workspace as guest data.
            if ((localStorage.getItem(ACTIVE_OWNER) || GUEST) === GUEST && !localStorage.getItem('genius-profile-switch-v1')) void activate(null);
            else setError('Hãy mở ứng dụng qua HTTPS trên Chrome, Safari hoặc Firefox mới để mở hồ sơ tài khoản an toàn.');
        }
        const timer = window.setInterval(() => { if (manager.owner !== GUEST) sync(); }, 15000);
        const onSaved = () => { if (manager.owner !== GUEST) sync(); };
        const onHidden = () => { if (document.visibilityState === 'hidden') onSaved(); };
        window.addEventListener('online', onSaved);
        window.addEventListener('focus', onSaved);
        window.addEventListener('profiles-saved', onSaved);
        document.addEventListener('visibilitychange', onHidden);
        return () => { stopped = true; mounted.current = false; unsubscribe?.(); release?.(); lockAbort.abort(); clearTimeout(lockNotice); clearInterval(timer);
            window.removeEventListener('online', onSaved); window.removeEventListener('focus', onSaved); window.removeEventListener('profiles-saved', onSaved); document.removeEventListener('visibilitychange', onHidden); };
    }, [manager]);

    const login = () => { void enqueue(async () => {
        if (!supabase) return;
        setBusy(true); setError('');
        try {
        await manager.checkpoint();
        const redirectTo = new URL(import.meta.env.BASE_URL, location.origin).href;
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo,
            scopes: 'openid email profile', queryParams: { prompt: 'select_account' } } });
        if (error) throw error;
        } finally { setBusy(false); }
    }); };
    const logout = () => { void replace(async () => {
        await manager.checkpoint();
        if (manager.owner !== GUEST) await manager.sync().catch(() => { /* Retained in the account's local vault. */ });
        if (supabase) {
            const { error } = await supabase.auth.signOut({ scope: 'local' });
            if (error) throw error;
        }
        activeUser.current = null; setUser(null);
        await manager.activate(GUEST);
    }); };
    const downloadBackup = () => { void enqueue(async () => {
        const cache = await readCache(manager.owner);
        if (!cache?.backup) return;
        const url = URL.createObjectURL(new Blob([JSON.stringify(cache.backup)], { type: 'application/json' }));
        const link = document.createElement('a'); link.href = url; link.download = 'genius-kids-ho-so-du-phong.json'; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    }); };
    const value: AccountView = { user, status, error, updatedAt, available: !!supabase && !!navigator.locks, busy, canImport, hasBackup, login, logout, sync, downloadBackup,
        importGuest: () => { void replace(() => manager.importGuest(), true); },
        resolve: source => { void replace(() => manager.resolve(source), true); },
    };
    return <AccountContext.Provider value={value}>
        {ready ? <React.Fragment key={generation}>{children}</React.Fragment> : <main className="min-h-screen bg-sky-50 flex items-center justify-center p-6">
            <section className="max-w-lg bg-white p-8 rounded-2xl shadow space-y-4" aria-live="polite">
                <h1 className="text-2xl font-bold text-brand-700">{locked ? 'Ứng dụng đang mở ở tab khác' : error ? 'Chưa mở được hồ sơ' : 'Đang mở hồ sơ…'}</h1>
                <p>{locked ? 'Đóng tab Genius Kids còn lại rồi tải lại trang này để tiếp tục.' : error || 'Tiến trình trên máy được giữ lại khi đổi tài khoản.'}</p>
                {(locked || error) && <button className="px-5 py-3 rounded-xl bg-brand-500 text-white" onClick={() => location.reload()}>Thử lại</button>}
                {!locked && error && user && <button className="ml-3 underline" onClick={logout}>Đăng xuất, dùng hồ sơ khách</button>}
            </section>
        </main>}
    </AccountContext.Provider>;
}
