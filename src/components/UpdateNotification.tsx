import React, { useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle, Download, Loader2, Pause, RefreshCw, X } from 'lucide-react';
import { applyUpdate, checkForUpdates, downloadOffline, downloadUpdate, pauseOffline, refreshOfflineStatus } from '../../services/updateService';
import { usePwaUpdate } from '../hooks/usePwaUpdate';
import type { DownloadProgress } from '../../pwa/download';

const size = (bytes: number) => `${(bytes / 1024 / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} MB`;
function Progress({ progress, label }: { progress: DownloadProgress; label: string }) {
    const percent = progress.total ? Math.floor(progress.completed / progress.total * 100) : 0;
    return <div className="space-y-2 mt-4">
        <div className="flex justify-between gap-3 text-sm text-slate-600">
            <span>{label}</span><span className="font-bold tabular-nums">{progress.total ? `${percent}%` : 'Đang chuẩn bị…'}</span>
        </div>
        <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.total ? percent : undefined}
            className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-brand-500 transition-[width] duration-200" style={{ width: `${percent}%` }} />
        </div>
        {progress.total > 0 && <p className="text-xs text-slate-500 tabular-nums">
            Đã lưu {progress.completed}/{progress.total} tệp · {size(progress.bytes)} / {size(progress.totalBytes)}
        </p>}
    </div>;
}

export const UpdateNotification: React.FC<{ onDismiss?: () => void }> = ({ onDismiss }) => {
    const state = usePwaUpdate();
    const dialog = useRef<HTMLDivElement>(null);
    const dismissRef = useRef(onDismiss);
    dismissRef.current = onDismiss;
    const busy = ['checking', 'downloading', 'applying'].includes(state.phase);
    const canDownloadOffline = !['unsupported', 'applying', 'downloading', 'ready', 'available'].includes(state.phase)
        && (!state.targetVersion || state.targetVersion === state.currentVersion);
    useEffect(() => {
        void refreshOfflineStatus();
        const previousFocus = document.activeElement as HTMLElement | null;
        dialog.current?.focus();
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') dismissRef.current?.();
            if (event.key !== 'Tab') return;
            const elements = dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), [tabindex="0"]');
            if (!elements?.length) return;
            const first = elements[0], last = elements[elements.length - 1];
            if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => { document.removeEventListener('keydown', onKeyDown); previousFocus?.focus(); };
    }, []);
    const titles = {
        idle: 'Kiểm tra phiên bản mới', checking: 'Đang kiểm tra máy chủ…', available: 'Có phiên bản mới',
        downloading: 'Đang tải ứng dụng…', ready: 'Bản mới đã tải xong', current: 'Đang dùng phiên bản mới nhất',
        offline: 'Đang dùng khi offline', error: 'Cập nhật chưa hoàn tất', applying: 'Đang mở phiên bản mới…', unsupported: 'Cập nhật chưa khả dụng',
    };
    return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-3 sm:p-6">
        <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="update-title"
            className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl bg-white shadow-2xl outline-none">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
                <div><h2 id="update-title" className="text-xl font-bold text-slate-900">Cập nhật & nội dung offline</h2>
                    <p className="mt-1 text-sm text-slate-500">Chủ động tải, sẵn sàng học và chơi.</p></div>
                <button type="button" aria-label="Đóng cửa sổ cập nhật" onClick={onDismiss} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-brand-500"><X size={22} /></button>
            </div>
            <div className="p-5 sm:p-6 space-y-6">
                <section aria-labelledby="version-heading">
                    <div className="flex items-center gap-2">
                        {busy ? <Loader2 size={20} className="animate-spin text-brand-600" /> : state.phase === 'current' || state.phase === 'ready' ? <CheckCircle size={20} className="text-emerald-600" /> : <RefreshCw size={20} className="text-brand-600" />}
                        <h3 id="version-heading" className="font-bold text-slate-800" aria-live="polite">{titles[state.phase]}</h3>
                    </div>
                    <p className="mt-2 break-all text-xs text-slate-500">Bản đang mở: {state.currentVersion}</p>
                    {state.targetVersion && state.targetVersion !== state.currentVersion && <p className="mt-1 break-all text-xs text-slate-500">Bản mới: {state.targetVersion}</p>}
                    {state.phase === 'available' && <p className="mt-3 text-sm text-slate-600">Bấm tải để cập nhật ngay. Các tệp đã có sẽ được dùng lại; ảnh và âm thanh có thể tải riêng bên dưới.</p>}
                    {state.phase === 'ready' && <p className="mt-3 text-sm text-slate-600">Ứng dụng sẽ tải lại để mở bản mới. Hãy hoàn tất hoạt động đang chơi trước khi áp dụng.</p>}
                    {state.phase === 'unsupported' && <p className="mt-3 text-sm text-slate-600">Chức năng này hoạt động trên bản production hoặc bản preview qua HTTPS/localhost.</p>}
                    {state.error && <p role="alert" className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"><AlertCircle size={18} className="shrink-0 mt-0.5" />{state.error}</p>}
                    {(state.phase === 'downloading' || state.phase === 'error' && state.progress.total > 0) && <Progress progress={state.progress} label="Tài nguyên ứng dụng" />}
                    <div className="mt-4 flex flex-wrap gap-2">
                        {state.phase === 'ready' ? <button onClick={() => void applyUpdate()} className="rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white hover:bg-brand-700">Áp dụng và tải lại</button>
                            : (state.phase === 'available' || state.phase === 'error') && <button onClick={() => void downloadUpdate()} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white hover:bg-brand-700"><Download size={17} />{state.phase === 'error' ? 'Thử tải lại' : 'Tải bản mới'}</button>}
                        <button disabled={busy || state.phase === 'unsupported'} onClick={() => void checkForUpdates()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={16} />Kiểm tra cập nhật</button>
                    </div>
                </section>
                <section aria-labelledby="offline-heading" className="border-t border-slate-100 pt-5">
                    <h3 id="offline-heading" className="font-bold text-slate-800">Tải toàn bộ nội dung offline</h3>
                    <p className="mt-2 text-sm text-slate-600">Lưu bài học, trò chơi, ảnh và âm thanh có sẵn trên máy chủ. Trợ lý AI và nội dung trực tuyến vẫn cần mạng.</p>
                    <Progress progress={state.offline.progress} label={state.offline.phase === 'complete' ? 'Đã lưu đủ nội dung của bản này' : state.offline.phase === 'downloading' ? 'Đang tải nội dung' : 'Nội dung đã lưu trên máy'} />
                    {state.offline.error && <p role="alert" className="mt-2 text-sm text-amber-800">{state.offline.error}</p>}
                    <div className="mt-4">
                        {state.offline.phase === 'downloading' ? <button onClick={() => void pauseOffline()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"><Pause size={16} />Tạm dừng</button>
                            : state.offline.phase === 'complete' ? <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"><CheckCircle size={18} />Sẵn sàng dùng offline</span>
                                : <button disabled={!canDownloadOffline} onClick={() => void downloadOffline()} className="inline-flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm font-bold text-brand-700 hover:bg-brand-100 disabled:opacity-50"><Download size={17} />{state.offline.progress.completed > 0 ? 'Tải tiếp nội dung còn thiếu' : 'Tải toàn bộ'}</button>}
                    </div>
                    {!canDownloadOffline && state.phase !== 'unsupported' && <p className="mt-2 text-xs text-slate-500">Hoàn tất cập nhật ứng dụng trước khi tải nội dung offline.</p>}
                    <p className="mt-3 text-xs leading-relaxed text-slate-500">Giữ ứng dụng mở trong lúc tải. Nếu bị ngắt, mở lại và bấm tải tiếp; các tệp đã lưu sẽ được giữ lại. Dung lượng hiển thị là nội dung đã lưu, có thể khác dung lượng truyền qua mạng.</p>
                </section>
            </div>
        </div>
    </div>;
};
