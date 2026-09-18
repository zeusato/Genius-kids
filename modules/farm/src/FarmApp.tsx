import { useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import Game from './Game';
import { openLocalFarm } from './adapters/local';
import { farmSupabase, googleProviderReady, initialAuthMessage, SupabaseFarmTransport } from './online/client';
import { AccountPanel, syncLabel } from './online/AccountPanel';
import { openAccountFarm, type CloudFarmSession } from './online/session';
import type { SyncStatus } from './online/types';
import './online/account.css';

export interface FarmAppProps { guestDatabaseName?: string; onExit?: () => void }
export default function FarmApp({ guestDatabaseName, onExit }: FarmAppProps = {}) {
    const [user, setUser] = useState<User | null>(null), [ready, setReady] = useState(!farmSupabase), [recovery, setRecovery] = useState(false);
    useEffect(() => {
        if (!farmSupabase) return;
        let active = true;
        const { data } = farmSupabase.auth.onAuthStateChange((event, session) => {
            if (!active) return;
            setUser(session?.user ?? null); setReady(true);
            if (event === 'PASSWORD_RECOVERY') setRecovery(true);
            if (event === 'SIGNED_OUT') setRecovery(false);
        });
        // Listener handles INITIAL_SESSION. Never await auth methods inside this callback.
        return () => { active = false; data.subscription.unsubscribe(); };
    }, []);
    if (!ready) return <main className="farm-root farm-loading"><h1>Làng Mầm</h1><p>Đang mở cổng nông trại…</p>{onExit && <button onClick={onExit}>Về trò chơi</button>}</main>;
    return <AccountGarden key={`${guestDatabaseName ?? 'standalone'}:${user?.id ?? 'guest'}`} user={user} recovery={recovery} recovered={() => setRecovery(false)} guestDatabaseName={guestDatabaseName} onExit={onExit}/>;
}
function AccountGarden({ user, recovery, recovered, guestDatabaseName, onExit }: { user: User | null; recovery: boolean; recovered: () => void } & FarmAppProps) {
    const [session, setSession] = useState<CloudFarmSession | null>(null), [status, setStatus] = useState<SyncStatus>({ phase: 'checking' });
    const open = useMemo(() => {
        if (!user || !farmSupabase) return () => openLocalFarm(guestDatabaseName);
        const owner = user.id, client = farmSupabase;
        return async () => {
            const s = await openAccountFarm(owner, new SupabaseFarmTransport(client, owner), setStatus, guestDatabaseName);
            setSession(s); s.start(); return s;
        };
    }, [user?.id, guestDatabaseName]);
    useEffect(() => {
        if (!session) return;
        const sync = () => { if (document.visibilityState !== 'hidden') void session.sync(); };
        window.addEventListener('online', sync); document.addEventListener('visibilitychange', sync);
        return () => { window.removeEventListener('online', sync); document.removeEventListener('visibilitychange', sync); };
    }, [session]);
    return <Game openSession={open} onExit={onExit} accountStatus={user ? syncLabel(status) : 'Tài khoản'} openAccount={recovery || (!user && !!initialAuthMessage) || status.phase === 'unlinked' || status.phase === 'conflict'}
        accountPanel={<AccountPanel client={farmSupabase} user={user} session={session} status={status} recovery={recovery} recovered={recovered} googleReady={googleProviderReady} initialMessage={user ? '' : initialAuthMessage}/>}/>;
}
