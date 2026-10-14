import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentProfile, Grade } from '@/types';
import { getGradeLabel } from '@/src/utils/grade';
import { getAvatarById } from '@/services/avatarService';
import { initializeTheme } from '@/services/themeService';
import { ArrowRight, BookOpen, Bot, Compass, Download, Gamepad2, Music2, Plus, RefreshCw, Sparkles, Star, UserRound } from 'lucide-react';
import { usePwaUpdate } from '../hooks/usePwaUpdate';
import { useStudent, useStudentActions } from '@/src/contexts/StudentContext';
import { DevTools } from '@/components/DevTools';
import { MusicControls } from '@/src/components/MusicControls';
import { AIAgentSettingsModal } from '@/src/components/AIAgentSettingsModal';
import { AccountPanel } from '@/src/components/AccountPanel';
import { HubDialog } from '@/src/components/hub/HubShell';
import './HomePage.css';

interface HomePageProps {
    onInstallClick?: () => void;
    canInstall?: boolean;
    onUpdateClick?: () => void;
}

const GRADES = [Grade.Preschool, Grade.Grade1, Grade.Grade2, Grade.Grade3, Grade.Grade4, Grade.Grade5];

export function HomePage({ onInstallClick, canInstall, onUpdateClick }: HomePageProps) {
    const update = usePwaUpdate();
    const navigate = useNavigate();
    const { students: profiles } = useStudent();
    const { setStudent, addStudent, updateStudent } = useStudentActions();
    const [isCreating, setIsCreating] = useState(false);
    const [newProfile, setNewProfile] = useState<{ name: string; grade: Grade }>({ name: '', grade: Grade.Grade2 });
    const [showAIAgentSettings, setShowAIAgentSettings] = useState(false);
    const [showDevTools, setShowDevTools] = useState(false);
    const [notice, setNotice] = useState('');
    const clickCount = useRef(0);
    const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const profilesRef = useRef<HTMLDivElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const createdName = useRef<string | null>(null);

    useEffect(() => {
        initializeTheme();
        return () => { if (clickTimerRef.current) clearTimeout(clickTimerRef.current); };
    }, []);

    useEffect(() => {
        if (!createdName.current) return;
        const cards = profilesRef.current?.querySelectorAll<HTMLButtonElement>('[data-profile-card]');
        cards?.[cards.length - 1]?.focus();
        setNotice(`Đã tạo hồ sơ ${createdName.current}. Chọn hồ sơ để bắt đầu nhé!`);
        createdName.current = null;
    }, [profiles]);

    // Secret: click the brand 7 times, with no more than 2 seconds between clicks.
    const handleTitleClick = () => {
        clickCount.current += 1;
        if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
        if (clickCount.current >= 7) {
            setShowDevTools(true);
            clickCount.current = 0;
        } else {
            clickTimerRef.current = setTimeout(() => { clickCount.current = 0; }, 2000);
        }
    };

    const handleAddStars = (profileId: string, amount: number) => {
        const profile = profiles.find(p => p.id === profileId);
        if (profile) updateStudent({ ...profile, stars: profile.stars + amount });
    };

    const openCreate = () => {
        setNewProfile({ name: '', grade: Grade.Grade2 });
        setNotice('');
        setIsCreating(true);
    };

    const handleCreate = (event: React.FormEvent) => {
        event.preventDefault();
        const name = newProfile.name.trim().slice(0, 50);
        if (!name) return;
        createdName.current = name;
        addStudent(name, newProfile.grade);
        setIsCreating(false);
    };

    const handleSelectProfile = (profile: StudentProfile) => {
        setStudent(profile);
        navigate('/mode');
    };

    const updateLabel = update.phase === 'downloading'
        ? `Đang tải${update.progress.total ? ` ${Math.floor(update.progress.completed / update.progress.total * 100)}%` : '…'}`
        : update.phase === 'available' || update.phase === 'ready' ? 'Có bản mới' : 'Cập nhật';

    return (
        <div className="discovery-hub welcome-page" data-theme="theme_classic">
            <a className="welcome-skip" href="#choose-profile">Đến phần chọn hồ sơ</a>
            <header className="hub-header">
                <div className="hub-header-inner welcome-header">
                    <div className="hub-brand" onClick={handleTitleClick}>
                        <span className="hub-brand-mark"><Compass size={25} /></span>
                        <span>Genius Kids<small>Thế giới của trí tò mò</small></span>
                    </div>
                    <div className="hub-header-actions welcome-tools" aria-label="Tiện ích">
                        <button type="button" onClick={onUpdateClick} title="Cập nhật và nội dung offline" aria-label={`Cập nhật và nội dung offline${updateLabel !== 'Cập nhật' ? ` · ${updateLabel}` : ''}`} className="welcome-tool">
                            <RefreshCw size={18} className={update.phase === 'downloading' || update.phase === 'checking' ? 'animate-spin' : ''} /><span>{updateLabel}</span>
                            {(update.phase === 'available' || update.phase === 'ready') && <i className="welcome-update-dot" />}
                        </button>
                        <button type="button" onClick={() => setShowAIAgentSettings(true)} className="welcome-tool" title="Cài đặt AI — Bo Biết Tuốt" aria-label="Cài đặt trợ lý AI"><Bot size={19} /><span>Trợ lý AI</span></button>
                        <MusicControls variant="hub" />
                        {canInstall && <button type="button" onClick={onInstallClick} className="welcome-tool welcome-install" aria-label="Cài ứng dụng" title="Cài ứng dụng"><Download size={18} /><span>Cài ứng dụng</span></button>}
                    </div>
                </div>
            </header>

            <main className="hub-main welcome-main">
                <section className="welcome-intro" aria-labelledby="welcome-title">
                    <div className="welcome-intro-copy">
                        <span className="hub-eyebrow">CHÀO NHÀ KHÁM PHÁ NHỎ</span>
                        <h1 id="welcome-title">Học, chơi và<br /><em>khám phá mỗi ngày.</em></h1>
                        <p>Từ một trang sách, một nốt nhạc đến cả vũ trụ.<br className="welcome-desktop-break" /> Có thật nhiều điều thú vị đang chờ em.</p>
                    </div>
                    <div className="welcome-art" aria-hidden="true">
                        <img className="welcome-art-library" src={`${import.meta.env.BASE_URL}hub/art/library.webp`} width="800" height="450" alt="" />
                        <img className="welcome-art-science" src={`${import.meta.env.BASE_URL}hub/art/science-sm.webp`} width="400" height="225" alt="" />
                        <span className="welcome-art-note"><Sparkles size={18} />Bắt đầu từ một chút tò mò</span>
                    </div>
                </section>

                <div className="welcome-interests" aria-label="Nội dung khám phá">
                    <span><BookOpen size={16} />Toán & ngôn ngữ</span><span><Compass size={16} />Khoa học & đọc sách</span><span><Music2 size={16} />Âm nhạc & sáng tạo</span><span><Gamepad2 size={17} />Trò chơi & tư duy</span>
                </div>

                <div className="welcome-workspace">
                    <section className="welcome-profiles" id="choose-profile" tabIndex={-1} aria-labelledby="profiles-title">
                        <div className="welcome-section-heading">
                            <div><h2 id="profiles-title">Hôm nay, ai cùng khám phá?</h2><p>{profiles.length ? 'Chọn hồ sơ của em để tiếp tục hành trình.' : 'Tạo hồ sơ đầu tiên để bắt đầu hành trình của riêng em.'}</p></div>
                            {profiles.length > 0 && <span className="welcome-profile-count">{profiles.length} hồ sơ</span>}
                        </div>
                        <div className="welcome-profile-grid" ref={profilesRef}>
                            {profiles.map(profile => {
                                const avatar = getAvatarById(profile.currentAvatarId);
                                return <button type="button" key={profile.id} data-profile-card className="welcome-profile-card" onClick={() => handleSelectProfile(profile)} aria-label={`Khám phá cùng ${profile.name}, ${getGradeLabel(profile.grade)}`}>
                                    <span className="welcome-avatar" aria-hidden="true">{avatar?.isEmoji ? avatar.imagePath : avatar ? <img src={avatar.imagePath} alt="" width="68" height="68" /> : <UserRound size={32} />}</span>
                                    <span className="welcome-profile-info"><strong>{profile.name}</strong><span>{getGradeLabel(profile.grade)}</span><span className="welcome-stars"><Star size={12} fill="currentColor" />{new Intl.NumberFormat('vi-VN').format(profile.stars)} sao</span></span>
                                    <span className="welcome-profile-arrow" aria-hidden="true"><ArrowRight size={18} /></span>
                                </button>;
                            })}
                            {profiles.length > 0 ? <button type="button" onClick={openCreate} className="welcome-add-profile"><span><Plus size={24} /></span><strong>Thêm hồ sơ mới</strong></button> : <div className="welcome-empty">
                                <span className="welcome-empty-icon"><Compass size={32} /></span>
                                <div><h3>Một hồ sơ nhỏ, cả thế giới mở ra</h3><p>Mỗi bạn có nhân vật, bộ sưu tập và hành trình riêng.</p><button type="button" className="welcome-primary" onClick={openCreate}><Plus size={18} />Tạo hồ sơ đầu tiên<ArrowRight size={18} /></button></div>
                            </div>}
                        </div>
                        <p className="welcome-notice" role="status">{notice}</p>
                    </section>
                    <AccountPanel />
                </div>

                <footer className="hub-footer welcome-footer"><span><Compass size={15} />Mỗi bạn một hành trình. Mỗi ngày một điều mới.</span><span>HỌC VUI · CHƠI KHÉO · LỚN KHÔN</span></footer>
            </main>

            {isCreating && <HubDialog title="Làm quen một chút nhé!" initialFocusRef={nameInputRef} onClose={() => setIsCreating(false)}>
                <form className="welcome-create-form" onSubmit={handleCreate}>
                    <p>Tên và cấp lớp giúp Genius Kids chọn nội dung phù hợp với em.</p>
                    <div className="welcome-name-label"><label htmlFor="profile-name">Tên của em</label><span id="profile-name-limit">Tối đa 50 ký tự</span></div>
                    <input id="profile-name" ref={nameInputRef} required maxLength={50} autoComplete="off" value={newProfile.name} onChange={event => setNewProfile({ ...newProfile, name: event.target.value })} placeholder="Ví dụ: Bi, Na…" aria-describedby="profile-name-limit" />
                    <fieldset><legend>Em đang học lớp nào?</legend><div className="welcome-grade-grid">
                        {GRADES.map(grade => <label key={grade} className="welcome-grade"><input type="radio" name="profile-grade" value={grade} checked={newProfile.grade === grade} onChange={() => setNewProfile({ ...newProfile, grade })} /><span>{getGradeLabel(grade)}</span></label>)}
                    </div></fieldset>
                    <div className="welcome-form-actions"><button type="button" className="welcome-secondary" onClick={() => setIsCreating(false)}>Để sau</button><button type="submit" className="welcome-primary" disabled={!newProfile.name.trim()}>Tạo hồ sơ<ArrowRight size={18} /></button></div>
                </form>
            </HubDialog>}
            {showDevTools && profiles.length > 0 && <DevTools profiles={profiles} onAddStars={handleAddStars} onClose={() => setShowDevTools(false)} />}
            {showAIAgentSettings && <AIAgentSettingsModal onClose={() => setShowAIAgentSettings(false)} />}
        </div>
    );
}
