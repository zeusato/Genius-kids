import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentProfile, Grade } from '@/types';
import { getAllProfiles, createProfile, saveProfiles } from '@/services/profileService';
import { getAvatarById } from '@/services/avatarService';
import { initializeTheme } from '@/services/themeService';
import { Plus, CheckCircle, Download } from 'lucide-react';
import { useStudentActions } from '@/src/contexts/StudentContext';
import { DevTools } from '@/components/DevTools';
import { MusicControls } from '@/src/components/MusicControls';

interface HomePageProps {
    onInstallClick?: () => void;
    canInstall?: boolean;
    showVersionCheck?: boolean;
}

const Button = ({ onClick, children, variant = 'primary', className = '' }: any) => {
    const baseStyle = 'px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center';
    const variants = {
        primary: 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg hover:shadow-xl',
        secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
    };
    return <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`}>{children}</button>;
};

const Card = ({ children, className = '' }: any) => {
    return <div className={`bg-white p-6 rounded-2xl shadow-md border border-gray-100 ${className}`}>{children}</div>;
};

export function HomePage({ onInstallClick, canInstall, showVersionCheck }: HomePageProps) {
    const navigate = useNavigate();
    const { setStudent } = useStudentActions();
    const [profiles, setProfiles] = useState<StudentProfile[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newProfile, setNewProfile] = useState<{ name: string, grade: Grade }>({ name: '', grade: Grade.Grade2 });

    // DevTools secret feature
    const [showDevTools, setShowDevTools] = useState(false);
    const [clickCount, setClickCount] = useState(0);
    const [selectedProfile, setSelectedProfile] = useState<StudentProfile | null>(null);
    const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const loadedProfiles = getAllProfiles();
        setProfiles(loadedProfiles);
        initializeTheme();
    }, []);

    // Secret: Click title 7 times in 2 seconds to open DevTools
    const handleTitleClick = () => {
        const newCount = clickCount + 1;
        setClickCount(newCount);

        if (clickTimerRef.current) {
            clearTimeout(clickTimerRef.current);
        }

        if (newCount >= 7) {
            setShowDevTools(true);
            setClickCount(0);
        } else {
            clickTimerRef.current = setTimeout(() => setClickCount(0), 2000);
        }
    };

    // Add stars to selected profile by ID
    const handleAddStars = (profileId: string, amount: number) => {
        const allProfiles = getAllProfiles();
        const profileToUpdate = allProfiles.find(p => p.id === profileId);
        if (!profileToUpdate) return;

        const updatedProfile = {
            ...profileToUpdate,
            stars: profileToUpdate.stars + amount
        };

        const updatedProfiles = allProfiles.map(p =>
            p.id === updatedProfile.id ? updatedProfile : p
        );

        saveProfiles(updatedProfiles);
        setProfiles(updatedProfiles);
        if (selectedProfile?.id === profileId) {
            setSelectedProfile(updatedProfile);
        }
    };

    const handleCreate = () => {
        if (!newProfile.name) return;

        const profile = createProfile(newProfile.name, newProfile.grade);
        const updated = [...profiles, profile];
        setProfiles(updated);
        saveProfiles(updated);
        setIsCreating(false);
    };

    const handleSelectProfile = (profile: StudentProfile) => {
        setSelectedProfile(profile);
        setStudent(profile);
        navigate('/mode');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
            {/* Top Header Bar - Fixed */}
            <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-4 pointer-events-none">
                {/* Version Check Indicator - Left */}
                {showVersionCheck && (
                    <div className="pointer-events-auto flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2.5 rounded-lg shadow-md border border-green-200 animate-in fade-in slide-in-from-top duration-500 h-[44px]">
                        <CheckCircle size={18} className="flex-shrink-0" />
                        <span className="text-sm font-semibold whitespace-nowrap">Newest Version</span>
                    </div>
                )}

                {/* Spacer when version check not shown */}
                {!showVersionCheck && <div />}

                {/* Right side controls */}
                <div className="flex items-center gap-3">
                    {/* Music Controls */}
                    <div className="pointer-events-auto">
                        <MusicControls />
                    </div>

                    {/* Install Button */}
                    {canInstall && (
                        <button
                            onClick={onInstallClick}
                            className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 bg-white border border-brand-500 text-brand-600 rounded-lg shadow-md hover:bg-brand-50 hover:shadow-lg transition-all font-semibold h-[44px] animate-bounce"
                        >
                            <Download size={18} className="flex-shrink-0" />
                            <span className="hidden sm:inline whitespace-nowrap">Tải App</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="text-center space-y-2">
                <h1
                    onClick={handleTitleClick}
                    className="text-5xl font-extrabold text-brand-600 tracking-tight drop-shadow-sm cursor-pointer select-none"
                >
                    MathGenius Kids
                </h1>
                <p className="text-xl text-slate-500">Học toán thật vui!</p>
            </div>

            {!isCreating ? (
                <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
                    {profiles.map(p => {
                        const avatar = getAvatarById(p.currentAvatarId);
                        return (
                            <button key={p.id} onClick={() => handleSelectProfile(p)} className="group relative bg-white p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all border-2 border-transparent hover:border-brand-400 text-left flex items-center space-x-4">
                                <div className="bg-brand-50 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                                    {avatar?.isEmoji ? (
                                        <span className="text-5xl">{avatar.imagePath}</span>
                                    ) : (
                                        <img src={avatar?.imagePath} alt={avatar?.name} className="w-16 h-16 rounded-full object-cover" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-800 group-hover:text-brand-600">{p.name}</h3>
                                    <p className="text-slate-500 font-medium">Lớp {p.grade}</p>
                                </div>
                            </button>
                        );
                    })}

                    <button onClick={() => setIsCreating(true)} className="flex flex-col items-center justify-center p-6 rounded-3xl border-4 border-dashed border-brand-200 text-brand-400 hover:bg-brand-50 hover:border-brand-400 hover:text-brand-600 transition-all h-full min-h-[140px]">
                        <Plus size={40} />
                        <span className="font-bold mt-2">Thêm học sinh mới</span>
                    </button>
                </div>
            ) : (
                <Card className="w-full max-w-md animate-in fade-in zoom-in duration-300">
                    <h2 className="text-2xl font-bold mb-6 text-center">Tạo hồ sơ mới</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-1">Tên của bé</label>
                            <input
                                type="text"
                                value={newProfile.name}
                                onChange={e => setNewProfile({ ...newProfile, name: e.target.value })}
                                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none text-lg"
                                placeholder="Ví dụ: Bi, Na..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-1">Lớp</label>
                            <div className="grid grid-cols-5 gap-2">
                                {[1, 2, 3, 4, 5].map(g => (
                                    <button
                                        key={g}
                                        onClick={() => setNewProfile({ ...newProfile, grade: g as Grade })}
                                        className={`p-2 rounded-lg font-bold border-2 ${newProfile.grade === g ? 'bg-brand-500 text-white border-brand-600' : 'bg-white border-gray-200 text-slate-500'}`}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button variant="secondary" className="flex-1" onClick={() => setIsCreating(false)}>Hủy</Button>
                            <Button className="flex-1" onClick={handleCreate}>Bắt đầu ngay</Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* DevTools Modal */}
            {showDevTools && profiles.length > 0 && (
                <DevTools
                    profiles={profiles}
                    onAddStars={handleAddStars}
                    onClose={() => setShowDevTools(false)}
                />
            )}
        </div>
    );
}
