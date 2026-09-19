import { useState } from 'react';
import type { FarmState } from '../core/types';
import { homeLevel } from '../core/progression';
import type { CloudSave } from './types';

/** A choice is never an upload: only the final button commits the selection. */
export function FarmSaveChoice({ local, remote, busy, choose }: {
    local: FarmState; remote: CloudSave | null; busy: boolean;
    choose: (source: 'cloud' | 'local') => void;
}) {
    const [source, setSource] = useState<'cloud' | 'local'>(remote ? 'cloud' : 'local');
    return <div className="farm-account-choice">
        <h3>{remote ? 'Tài khoản đã có nông trại' : 'Lưu khu vườn cùng tài khoản'}</h3>
        <p>{remote ? 'Chọn nông trại để tiếp tục. Bản cloud được ưu tiên.' : 'Tài khoản chưa có nông trại. Bạn có thể lưu khu vườn trên máy lên cloud.'}</p>
        <fieldset disabled={busy} className="farm-save-options"><legend>Nông trại muốn giữ</legend>
            {remote && <label className={source === 'cloud' ? 'chosen' : ''}>
                <input type="radio" name="farm-save-source" value="cloud" checked={source === 'cloud'} onChange={() => setSource('cloud')}/>
                <span><b>Nông trại trên cloud <em>Ưu tiên</em></b><small>Nhà chính {homeLevel(remote.state)} · {remote.state.plots.length} luống · {remote.state.coins.toLocaleString('vi-VN')} xu</small><small>Đã lưu {new Date(remote.updated_at).toLocaleString('vi-VN')}</small></span>
            </label>}
            <label className={source === 'local' ? 'chosen' : ''}>
                <input type="radio" name="farm-save-source" value="local" checked={source === 'local'} onChange={() => setSource('local')}/>
                <span><b>Nông trại trên máy</b><small>Nhà chính {homeLevel(local)} · {local.plots.length} luống · {local.coins.toLocaleString('vi-VN')} xu</small><small>Đã lưu {new Date(local.lastWallTime).toLocaleString('vi-VN')}</small></span>
            </label>
        </fieldset>
        {remote && <p className={source === 'local' ? 'farm-warning' : 'farm-note'}>{source === 'local' ? 'Bản trên máy sẽ thay nông trại đang lưu trên cloud. Bản cloud hiện tại được giữ làm bản dự phòng.' : 'Tiếp tục từ bản cloud. Bản trên máy được giữ làm bản dự phòng.'}</p>}
        <button className="farm-primary" disabled={busy} onClick={() => choose(source)}>{busy ? 'Đang mở nông trại…' : source === 'cloud' ? 'Tiếp tục với nông trại cloud' : remote ? 'Giữ bản trên máy và thay bản cloud' : 'Lưu nông trại lên cloud'}</button>
    </div>;
}
