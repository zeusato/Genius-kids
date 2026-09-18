import { useState } from 'react';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { homeLevel } from '../core/progression';
import { serializeBackup } from '../core/validation';
import { Icon } from '../ui/Icon';
import type { CloudFarmSession } from './session';
import type { SyncStatus } from './types';
import { authRedirect, signInWithGoogle } from './google';

function GoogleMark() {
    return <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.89-1.74 2.98-4.31 2.98-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.12H3.05v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.92A6 6 0 0 1 6.09 12c0-.67.11-1.31.31-1.92V7.49H3.05A10 10 0 0 0 2 12c0 1.61.38 3.14 1.05 4.51l3.35-2.59Z"/><path fill="#EA4335" d="M12 5.96c1.47 0 2.79.5 3.82 1.49l2.86-2.86A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.95 5.49l3.35 2.59A6.01 6.01 0 0 1 12 5.96Z"/></svg>;
}

export const syncLabel = (s: SyncStatus) => ({ checking: 'Kiểm tra bản online…', unlinked: 'Chọn nông trại', pending: 'Đang đồng bộ…', saved: 'Đã lưu online', offline: 'Đã lưu trên máy · ngoại tuyến', conflict: 'Có hai bản lưu', error: 'Đã lưu trên máy · chờ đồng bộ' })[s.phase];
function authMessage(error: unknown) {
    const code = (error as { code?: string })?.code;
    if (code === 'invalid_credentials') return 'Email hoặc mật khẩu chưa đúng.';
    if (code === 'email_not_confirmed') return 'Hãy mở email xác nhận tài khoản trước khi đăng nhập.';
    if (code === 'user_already_exists') return 'Email đã có tài khoản. Hãy đăng nhập hoặc lấy lại mật khẩu.';
    if (code === 'weak_password') return 'Mật khẩu chưa đủ mạnh. Hãy dùng ít nhất 8 ký tự, gồm chữ và số.';
    if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit') return 'Đã gửi nhiều yêu cầu. Hãy chờ một lúc rồi thử lại.';
    return 'Chưa thực hiện được. Kiểm tra kết nối và thử lại sau.';
}
function download(text: string) {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' })), a = document.createElement('a');
    a.href = url; a.download = 'lang-mam-before-cloud-replace.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000);
}
export function AccountPanel({ client, user, session, status, recovery, recovered, googleReady, initialMessage = '' }: {
    client: SupabaseClient | null; user: User | null; session: CloudFarmSession | null; status: SyncStatus;
    recovery: boolean; recovered: () => void;
    googleReady: () => Promise<boolean>; initialMessage?: string;
}) {
    const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
    const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(''), [problem, setProblem] = useState(initialMessage), [logout, setLogout] = useState(false);
    const [emailOpen, setEmailOpen] = useState(false);
    async function action(job: () => Promise<void>) {
        setBusy(true); setProblem(''); setMessage('');
        try { await job(); } catch (e) { setProblem(e instanceof Error ? e.message : 'Chưa thực hiện được.'); } finally { setBusy(false); }
    }
    async function authenticate() {
        if (!client) return;
        const redirect = authRedirect(location.href);
        const result = recovery ? await client.auth.updateUser({ password })
            : mode === 'reset' ? await client.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirect })
            : mode === 'register' ? await client.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: redirect } })
            : await client.auth.signInWithPassword({ email: email.trim(), password });
        if (result.error) throw new Error(authMessage(result.error));
        setPassword('');
        if (recovery) { recovered(); setMessage('Đã đổi mật khẩu.'); }
        else if (mode === 'reset') setMessage('Nếu email có tài khoản, thư đổi mật khẩu sẽ được gửi tới hộp thư.');
        else if (mode === 'register') setMessage('Kiểm tra hộp thư để xác nhận tài khoản rồi đăng nhập.');
    }
    const remote = status.remote, local = session?.getSnapshot();
    const choice = status.phase === 'unlinked' || status.phase === 'conflict';
    return <section className="farm-account" aria-label="Tài khoản và đồng bộ">
        <div className="farm-account-heading"><Icon name="home" size={30}/><div><h3>Nông trại theo bạn</h3><p>{user ? user.email : 'Đăng nhập để mang khu vườn sang thiết bị khác.'}</p></div></div>
        {!client ? <p>Chưa kết nối dịch vụ tài khoản. Nông trại vẫn được lưu trên máy này.</p> : !user || recovery ? <>
            {!recovery && <div className="farm-google-entry"><button className="farm-google-login" disabled={busy} onClick={() => void action(() => signInWithGoogle(client, location.href, googleReady))}><GoogleMark/><span>{busy ? 'Đang kết nối…' : 'Tiếp tục với Google'}</span></button><small>Dùng tài khoản Google có sẵn · không cần tạo mật khẩu mới</small><button className="farm-account-link" aria-expanded={emailOpen} disabled={busy} onClick={() => setEmailOpen(v => !v)}>{emailOpen ? 'Thu gọn đăng nhập email' : 'Dùng email và mật khẩu'}</button></div>}
            {(recovery || emailOpen) && <form onSubmit={e => { e.preventDefault(); void action(authenticate); }}>
            {!recovery && <div className="farm-tabs"><button type="button" disabled={busy} aria-pressed={mode === 'login'} onClick={() => { setMode('login'); setProblem(''); }}>Đăng nhập</button><button type="button" disabled={busy} aria-pressed={mode === 'register'} onClick={() => { setMode('register'); setProblem(''); }}>Tạo tài khoản</button></div>}
            {!recovery && <label>Email<input type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} disabled={busy}/></label>}
            {(recovery || mode !== 'reset') && <label>{recovery ? 'Mật khẩu mới' : 'Mật khẩu'}<input type="password" autoComplete={recovery || mode === 'register' ? 'new-password' : 'current-password'} minLength={mode === 'login' && !recovery ? 1 : 8} maxLength={128} required value={password} onChange={e => setPassword(e.target.value)} disabled={busy}/></label>}
            <button className="farm-primary" disabled={busy}>{busy ? 'Đang kết nối…' : recovery ? 'Lưu mật khẩu mới' : mode === 'register' ? 'Tạo tài khoản' : mode === 'reset' ? 'Gửi thư đổi mật khẩu' : 'Vào nông trại'}</button>
            {!recovery && mode !== 'reset' && <button type="button" className="farm-account-link" disabled={busy} onClick={() => { setMode('reset'); setProblem(''); }}>Quên mật khẩu?</button>}
            <small>Bản chơi trên máy được giữ riêng. Sau khi đăng nhập, bạn chọn nông trại muốn liên kết.</small>
        </form>}
        {!recovery && !emailOpen && <p className="farm-note">Sau khi đăng nhập, bạn chọn khu vườn muốn lưu cùng tài khoản.</p>}
        </> : <>
            <p className="farm-account-status" role="status">{syncLabel(status)}{status.syncedAt && status.phase === 'saved' ? ` · ${new Date(status.syncedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : ''}</p>
            {status.message && <p className="farm-note">{status.message}</p>}
            {choice && local && <div className="farm-account-choice"><p>{remote ? 'Chọn khu vườn sẽ tiếp tục chơi. Bản còn lại được giữ làm bản sao trên máy.' : 'Chưa có nông trại online. Liên kết khu vườn này với tài khoản?'}</p>
                <div><section><Icon name="home"/><b>Trên máy này</b><small>Nhà chính {homeLevel(local)} · {local.plots.length} luống</small><button disabled={busy} onClick={() => void action(() => session!.choose('local'))}>{remote ? 'Dùng bản trên máy' : 'Liên kết nông trại'}</button></section>
                {remote && <section><Icon name="sprout"/><b>Trên tài khoản</b><small>Nhà chính {homeLevel(remote.state)} · {remote.state.plots.length} luống</small><small>{new Date(remote.updated_at).toLocaleString('vi-VN')}</small><button className="farm-primary" disabled={busy} onClick={() => void action(() => session!.choose('cloud'))}>Dùng bản online</button></section>}</div>
            </div>}
            {!choice && <button disabled={busy || !session} onClick={() => void action(() => session!.sync())}>Đồng bộ ngay</button>}
            <details><summary>Bản sao & đăng xuất</summary><p className="farm-note">Đăng xuất sẽ trở về vườn khách. Vườn tài khoản được giữ riêng trên máy này; phần chưa đồng bộ sẽ gửi tiếp khi đăng nhập lại.</p><button disabled={busy || !session} onClick={() => void action(async () => { const backup = await session!.recovery(); if (backup) download(serializeBackup(backup)); else setMessage('Chưa có bản lưu bị thay thế.'); })}>Tải bản trước khi thay thế</button>
                {!logout ? <button disabled={busy} onClick={() => setLogout(true)}>Đăng xuất</button> : <div><p>Trở về vườn khách trên máy này?</p><button disabled={busy} onClick={() => void action(async () => { const { error } = await client.auth.signOut({ scope: 'local' }); if (error) throw new Error(authMessage(error)); })}>Đăng xuất tài khoản</button><button disabled={busy} onClick={() => setLogout(false)}>Ở lại</button></div>}
            </details>
        </>}
        {message && <p role="status">{message}</p>}{problem && <p role="alert" className="farm-warning">{problem}</p>}
    </section>;
}
