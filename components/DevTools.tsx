import React, { useState } from 'react';
import { X, Lock, User } from 'lucide-react';
import { StudentProfile } from '@/types';

interface DevToolsProps {
    profiles: StudentProfile[];
    onAddStars: (profileId: string, amount: number) => void;
    onClose: () => void;
}

export const DevTools: React.FC<DevToolsProps> = ({ profiles, onAddStars, onClose }) => {
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [selectedProfileId, setSelectedProfileId] = useState<string>(profiles[0]?.id || '');
    const [amount, setAmount] = useState(100);
    const [error, setError] = useState('');

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'GoD') {
            setIsAuthenticated(true);
            setError('');
        } else {
            setError('Sai mật khẩu!');
            setTimeout(() => {
                onClose();
            }, 1000);
        }
    };

    const handleAddStars = () => {
        if (selectedProfileId) {
            onAddStars(selectedProfileId, amount);
        }
    };

    const selectedProfile = profiles.find(p => p.id === selectedProfileId);

    // Password Screen
    if (!isAuthenticated) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-1 rounded-2xl shadow-2xl">
                    <div className="bg-white rounded-xl p-8 max-w-sm w-full relative">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                                <Lock size={32} className="text-purple-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-purple-600">🔒 Dev Tools</h2>
                            <p className="text-sm text-slate-500 mt-1">Nhập mật khẩu để tiếp tục</p>
                        </div>

                        <form onSubmit={handlePasswordSubmit}>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Nhập mật khẩu..."
                                className={`w-full px-4 py-3 border-2 ${error ? 'border-red-500' : 'border-purple-200'
                                    } rounded-xl focus:outline-none focus:border-purple-500 text-center font-semibold mb-4`}
                                autoFocus
                            />

                            {error && (
                                <p className="text-red-500 text-sm text-center mb-4 animate-pulse">
                                    ❌ {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg"
                            >
                                🔓 Mở khóa
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // Main DevTools Screen
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-1 rounded-2xl shadow-2xl">
                <div className="bg-white rounded-xl p-6 max-w-md w-full relative">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-purple-600">🔧 Dev Tools</h2>
                            <p className="text-xs text-slate-500">Chỉ dành cho developer</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Profile Selector */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <User size={16} />
                            Chọn học sinh
                        </label>
                        <select
                            value={selectedProfileId}
                            onChange={(e) => setSelectedProfileId(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 text-lg font-semibold bg-white cursor-pointer"
                        >
                            {profiles.map((profile) => (
                                <option key={profile.id} value={profile.id}>
                                    {profile.name} - Lớp {profile.grade}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Current Stars */}
                    {selectedProfile && (
                        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-4 mb-6">
                            <p className="text-sm text-slate-600 mb-1">Số sao hiện tại của {selectedProfile.name}</p>
                            <div className="flex items-center gap-2">
                                <span className="text-3xl">⭐</span>
                                <span className="text-3xl font-bold text-orange-600">{selectedProfile.stars}</span>
                            </div>
                        </div>
                    )}

                    {/* Add Stars Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Thêm số sao
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 text-lg font-semibold text-center"
                            min="0"
                            step="10"
                        />
                    </div>

                    {/* Quick Buttons */}
                    <div className="grid grid-cols-4 gap-2 mb-6">
                        {[10, 50, 100, 500].map((value) => (
                            <button
                                key={value}
                                onClick={() => setAmount(value)}
                                className="px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors text-sm font-semibold"
                            >
                                +{value}
                            </button>
                        ))}
                    </div>

                    {/* Add Button */}
                    <button
                        onClick={handleAddStars}
                        className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg"
                    >
                        ✨ Thêm {amount} sao cho {selectedProfile?.name}
                    </button>

                    {/* Warning */}
                    <p className="text-xs text-center text-slate-400 mt-4">
                        ⚠️ Chỉ dùng để test, không share với người dùng
                    </p>
                </div>
            </div>
        </div>
    );
};
