import React from 'react';
import { Cloud, HardDrive, LogOut, RefreshCw } from 'lucide-react';
import { useAccount } from '../contexts/AccountContext';
import { GoogleSignInButton } from './GoogleSignInButton';
import './AccountPanel.css';

export function AccountPanel() {
    const account = useAccount();
    if (!account) return null;
    const { user, busy, status, error } = account;
    return <section aria-label="Tài khoản và lưu tiến trình" className="account-panel">
        <span className="account-panel-icon" aria-hidden="true">{account.available ? <Cloud size={23} /> : <HardDrive size={23} />}</span>
        <div className="account-panel-heading">
            <h2>{user ? 'Hồ sơ trên tài khoản' : account.available ? 'Mang theo hành trình của em' : 'Hồ sơ trên máy này'}</h2>
            <p>{user?.email || (account.available ? 'Đăng nhập để lưu tiến trình và tiếp tục trên thiết bị khác.' : 'Chọn hồ sơ để bắt đầu. Tiến trình được tự động lưu trên máy này.')}</p>
        </div>
        <div className="account-panel-actions">
            {user ? <button className="account-button" disabled={busy} onClick={account.logout}><LogOut size={17} />Đăng xuất</button>
                : account.available && <GoogleSignInButton disabled={busy} onClick={account.login} />}
        </div>
        {!user && account.available && <p className="account-panel-local"><HardDrive size={15} /><span>Không đăng nhập? Cứ chọn hồ sơ và khám phá. Tiến trình vẫn được lưu trên máy này.</span></p>}
        {user && <>
            <div className="account-sync" role="status">
                <span>{busy ? 'Đang đồng bộ…' : status === 'saved' ? 'Đã lưu trên tài khoản' : status === 'conflict' ? 'Có bản lưu khác trên tài khoản' : status === 'pending' ? 'Đã lưu trên máy · chờ đồng bộ' : 'Đã lưu trên máy · chờ kết nối để đồng bộ'}{account.updatedAt && status === 'saved' ? ` · ${new Date(account.updatedAt).toLocaleTimeString('vi-VN')}` : ''}</span>
                <button className="account-button" disabled={busy} onClick={account.sync}><RefreshCw size={15} />Đồng bộ ngay</button>
            </div>
            <p className="account-panel-detail">Tiến trình học, sao, thành tích, bộ sưu tập và các bản chơi dở theo hồ sơ được tự động lưu. Hồ sơ khách trên máy được giữ riêng.</p>
            {account.hasBackup && <button className="account-backup" onClick={account.downloadBackup} disabled={busy}>Tải bản hồ sơ dự phòng</button>}
            {account.canImport && <div className="account-callout"><p>Tài khoản chưa có hồ sơ. Có thể nhập hồ sơ trên máy để tiếp tục học trên các thiết bị khác.</p><button className="account-button" disabled={busy} onClick={account.importGuest}>Nhập hồ sơ trên máy vào tài khoản</button></div>}
            {status === 'conflict' && <div className="account-callout account-conflict">
                <p>Thiết bị khác đã cập nhật hồ sơ. Chọn bản muốn tiếp tục; bản còn lại được giữ làm bản sao dự phòng trên máy. Sao và phần thưởng không cộng gộp.</p>
                <div className="account-conflict-actions"><button className="account-button" disabled={busy} onClick={() => account.resolve('cloud')}>Dùng bản trên tài khoản</button><button className="account-button" disabled={busy} onClick={() => account.resolve('local')}>Dùng bản trên máy</button></div>
            </div>}
        </>}
        {error && <p role="alert" className="account-error">{error}</p>}
    </section>;
}
