import React, { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, Compass, LogOut, ShoppingBag, Star, UserRound, X } from 'lucide-react';
import type { StudentProfile } from '../../../types';
import { getAvatarById } from '../../../services/avatarService';
import { getGradeLabel } from '../../utils/grade';
import { MusicControls } from '../MusicControls';
import './hub.css';

export interface HubHeaderProps {
    student?: StudentProfile | null;
    section: string;
    onBack?: () => void;
    backLabel?: string;
    onProfile?: () => void;
    onShop?: () => void;
    onLogout?: () => void;
}
function HubHeader({ student, section, onBack, backLabel = 'Về khám phá', onProfile, onShop, onLogout }: HubHeaderProps) {
    const [open, setOpen] = useState(false);
    const profile = useRef<HTMLDivElement>(null);
    const toggle = useRef<HTMLButtonElement>(null);
    const menuId = useId();
    const avatar = student ? getAvatarById(student.currentAvatarId) : undefined;
    useEffect(() => {
        if (!open) return;
        const outside = (e: PointerEvent) => { if (!profile.current?.contains(e.target as Node)) setOpen(false); };
        const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); toggle.current?.focus(); } };
        document.addEventListener('pointerdown', outside);
        document.addEventListener('keydown', escape);
        return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
    }, [open]);
    return <header className="hub-header"><div className="hub-header-inner">
        {onBack && <button className="hub-icon hub-back" aria-label={backLabel} title={backLabel} onClick={onBack}><ArrowLeft size={20}/></button>}
        <div className="hub-brand"><span className="hub-brand-mark"><Compass size={25}/></span><span>Genius Kids<small>{section}</small></span></div>
        <div className="hub-header-actions">
            {student && <span className="hub-wallet" aria-label={`${student.stars} sao`}><Star size={18} fill="currentColor"/><span>{new Intl.NumberFormat('vi-VN').format(student.stars)}</span></span>}
            <MusicControls variant="hub"/>
            {onShop && <button className="hub-icon hub-shop" aria-label="Cửa hàng" title="Cửa hàng" onClick={onShop}><ShoppingBag size={20}/></button>}
            {student && <div className="hub-profile" ref={profile} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
                <button ref={toggle} className="hub-profile-toggle" aria-label={`Hồ sơ ${student.name}`} aria-expanded={open} aria-controls={menuId} onClick={() => setOpen(!open)}>
                    <span className="hub-avatar">{avatar?.isEmoji ? avatar.imagePath : avatar ? <img src={avatar.imagePath} alt=""/> : <UserRound size={22}/>}</span>
                    <span className="hub-student-name">{student.name}<small>{getGradeLabel(student.grade)}</small></span><ChevronDown size={14}/>
                </button>
                {open && <div id={menuId} className="hub-profile-panel">
                    <strong>{student.name}</strong><span>{getGradeLabel(student.grade)} · {student.stars} sao</span>
                    {onProfile && <button onClick={onProfile}><UserRound size={18}/>Hồ sơ của em</button>}
                    {onShop && <button className="hub-mobile-shop" onClick={onShop}><ShoppingBag size={18}/>Cửa hàng</button>}
                    {onLogout && <button onClick={onLogout}><LogOut size={18}/>Đổi học sinh</button>}
                </div>}
            </div>}
        </div>
    </div></header>;
}
export function HubShell({ children, ...props }: HubHeaderProps & { children: React.ReactNode }) {
    return <div className="discovery-hub" data-theme={props.student?.currentThemeId || 'theme_classic'}><HubHeader {...props}/>{children}</div>;
}
export function HubIntro({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: React.ReactNode }) {
    return <div className="hub-intro"><div><span className="hub-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{children}</div>;
}
export function HubDialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    const dialog = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    useEffect(() => {
        const node = dialog.current;
        node?.showModal();
        return () => node?.close();
    }, []);
    return <dialog className="hub-dialog" ref={dialog} aria-labelledby={titleId} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => {
        if (e.target !== e.currentTarget) return;
        const r = e.currentTarget.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose();
    }}>
        <div className="hub-dialog-heading"><span className="hub-eyebrow">SẴN SÀNG KHÁM PHÁ</span><button className="hub-icon" onClick={onClose} aria-label="Đóng"><X size={20}/></button></div>
        <h2 id={titleId}>{title}</h2>{children}
    </dialog>;
}
