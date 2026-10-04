import React from 'react';
import { Cloud, LogIn, LogOut, RefreshCw } from 'lucide-react';
import { useAccount } from '../contexts/AccountContext';

export function AccountPanel() {
    const account = useAccount();
    if (!account) return null;
    const { user, busy, status, error } = account;
    const button = 'min-h-[44px] px-4 py-2 rounded-xl border border-brand-200 font-semibold hover:bg-brand-50 disabled:opacity-50';
    return <section aria-label="Tài khoản và lưu tiến trình" className="w-full max-w-3xl bg-white border border-brand-100 rounded-2xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-3 items-center"><Cloud className="text-brand-600 shrink-0" /><div>
                <h2 className="font-bold text-gray-800">{user ? 'Hồ sơ trên tài khoản' : account.available ? 'Học ngay, hoặc đăng nhập để lưu tiến trình' : 'Hồ sơ trên máy này'}</h2>
                <p className="text-sm text-gray-600 break-all">{user?.email || 'Không đăng nhập: hồ sơ và tiến trình được lưu trên máy này.'}</p>
            </div></div>
            {user ? <button className={button + ' flex gap-2 items-center'} disabled={busy} onClick={account.logout}><LogOut size={17} />Đăng xuất</button>
                : account.available && <button className={button + ' flex gap-2 items-center text-brand-700'} disabled={busy} onClick={account.login}><LogIn size={18} />Đăng nhập bằng Google</button>}
        </div>
        {user && <>
            <div className="flex flex-wrap items-center gap-3 text-sm" role="status">
                <span>{busy ? 'Đang đồng bộ…' : status === 'saved' ? 'Đã lưu trên tài khoản' : status === 'conflict' ? 'Có bản lưu khác trên tài khoản' : status === 'pending' ? 'Đã lưu trên máy · chờ đồng bộ' : 'Đã lưu trên máy · chờ kết nối để đồng bộ'}{account.updatedAt && status === 'saved' ? ` · ${new Date(account.updatedAt).toLocaleTimeString('vi-VN')}` : ''}</span>
                <button className={button + ' flex gap-2 items-center'} disabled={busy} onClick={account.sync}><RefreshCw size={15} />Đồng bộ ngay</button>
            </div>
            <p className="text-xs text-gray-500">Tiến trình học, sao, thành tích, bộ sưu tập và các bản chơi dở theo hồ sơ được tự động lưu. Hồ sơ khách trên máy được giữ riêng.</p>
            {account.hasBackup && <button className="text-sm underline text-brand-700 min-h-[44px]" onClick={account.downloadBackup} disabled={busy}>Tải bản hồ sơ dự phòng</button>}
            {account.canImport && <div className="p-3 bg-sky-50 rounded-xl space-y-2"><p>Tài khoản chưa có hồ sơ. Có thể nhập hồ sơ trên máy để tiếp tục học trên các thiết bị khác.</p><button className={button} disabled={busy} onClick={account.importGuest}>Nhập hồ sơ trên máy vào tài khoản</button></div>}
            {status === 'conflict' && <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                <p>Thiết bị khác đã cập nhật hồ sơ. Chọn bản muốn tiếp tục; bản còn lại được giữ làm bản sao dự phòng trên máy. Sao và phần thưởng không cộng gộp.</p>
                <div className="flex flex-wrap gap-2"><button className={button} disabled={busy} onClick={() => account.resolve('cloud')}>Dùng bản trên tài khoản</button><button className={button} disabled={busy} onClick={() => account.resolve('local')}>Dùng bản trên máy</button></div>
            </div>}
        </>}
        {error && <p role="alert" className="text-sm text-amber-800">{error}</p>}
    </section>;
}
