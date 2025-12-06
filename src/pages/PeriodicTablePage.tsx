import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { MusicControls } from '@/src/components/MusicControls';
import { PeriodicTable } from '@/src/components/periodic/PeriodicTable';
import { ElementDetail } from '@/src/components/periodic/ElementDetail';
import { ElementData, ELEMENTS_DATA } from '@/src/data/elementsData';

export const PeriodicTablePage: React.FC = () => {
    const navigate = useNavigate();
    const [selectedElement, setSelectedElement] = useState<ElementData | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    // Filter elements based on search
    const filteredElements = ELEMENTS_DATA.filter(el =>
        el.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        el.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        el.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        el.atomicNumber.toString() === searchQuery
    );

    const handleElementSelect = (element: ElementData) => {
        setSelectedElement(element);
        setShowSearch(false);
        setSearchQuery('');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
            {/* Background stars effect */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent" />

            {/* Header */}
            <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-4 bg-black/30 backdrop-blur-md border-b border-white/10">
                <button
                    onClick={() => navigate('/science')}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors font-semibold text-white shadow-md"
                >
                    <ArrowLeft size={20} />
                    <span className="hidden sm:inline">Quay lại</span>
                </button>

                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400">
                    Bảng Tuần Hoàn
                </h1>

                <div className="flex items-center gap-2">
                    {/* Search toggle */}
                    <button
                        onClick={() => setShowSearch(!showSearch)}
                        className={`p-2 rounded-xl transition-colors ${showSearch
                                ? 'bg-cyan-500 text-white'
                                : 'bg-white/10 hover:bg-white/20 text-white'
                            }`}
                    >
                        <Search size={20} />
                    </button>
                    <MusicControls />
                </div>
            </header>

            {/* Search dropdown */}
            {showSearch && (
                <div className="sticky top-[72px] z-30 px-4 py-3 bg-black/50 backdrop-blur-md border-b border-white/10">
                    <div className="max-w-md mx-auto relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm nguyên tố (tên, ký hiệu, số nguyên tử)..."
                            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                            autoFocus
                        />

                        {/* Search results */}
                        {searchQuery && (
                            <div className="absolute top-full left-0 right-0 mt-2 max-h-64 overflow-y-auto bg-slate-800/95 backdrop-blur-md rounded-xl border border-white/20 shadow-2xl">
                                {filteredElements.length > 0 ? (
                                    filteredElements.slice(0, 10).map(element => (
                                        <button
                                            key={element.atomicNumber}
                                            onClick={() => handleElementSelect(element)}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
                                        >
                                            <span className="w-10 h-10 flex items-center justify-center bg-cyan-500/20 rounded-lg text-cyan-400 font-bold">
                                                {element.symbol}
                                            </span>
                                            <div>
                                                <p className="text-white font-medium">{element.name}</p>
                                                <p className="text-white/50 text-sm">
                                                    #{element.atomicNumber} • {element.nameEn}
                                                </p>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-4 py-6 text-center text-white/50">
                                        Không tìm thấy nguyên tố nào
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Periodic Table */}
            <main className="py-6 sm:py-8">
                <PeriodicTable onSelectElement={handleElementSelect} />

                {/* Element count */}
                <div className="text-center mt-6 text-white/50 text-sm">
                    <p>118 nguyên tố • Chu kỳ 1-7 • Nhóm 1-18</p>
                </div>
            </main>

            {/* Element Detail Modal */}
            {selectedElement && (
                <ElementDetail
                    element={selectedElement}
                    onClose={() => setSelectedElement(null)}
                />
            )}
        </div>
    );
};
