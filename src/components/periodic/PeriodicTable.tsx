import React, { useState, useMemo } from 'react';
import { Info, X } from 'lucide-react';
import { ElementData, ELEMENTS_DATA, CATEGORY_COLORS } from '@/src/data/elementsData';
import { ElementCell } from './ElementCell';

interface PeriodicTableProps {
    onSelectElement: (element: ElementData) => void;
}

// Category descriptions for the info modal
const categoryDescriptions: Record<string, { name: string; description: string }> = {
    'alkali-metal': {
        name: 'Kim loại kiềm',
        description: 'Nhóm 1 (trừ Hydrogen). Kim loại mềm, phản ứng mạnh với nước tạo dung dịch kiềm. Ví dụ: Natri (Na), Kali (K).'
    },
    'alkaline-earth': {
        name: 'Kim loại kiềm thổ',
        description: 'Nhóm 2. Kim loại nhẹ, phản ứng với nước (chậm hơn kiềm). Ví dụ: Canxi (Ca), Magiê (Mg).'
    },
    'transition-metal': {
        name: 'Kim loại chuyển tiếp',
        description: 'Nhóm 3-12. Kim loại cứng, dẫn điện tốt, có nhiều trạng thái oxi hóa. Ví dụ: Sắt (Fe), Đồng (Cu), Vàng (Au).'
    },
    'post-transition': {
        name: 'Kim loại sau chuyển tiếp',
        description: 'Kim loại mềm hơn kim loại chuyển tiếp, điểm nóng chảy thấp. Ví dụ: Nhôm (Al), Chì (Pb), Thiếc (Sn).'
    },
    'metalloid': {
        name: 'Á kim (bán kim loại)',
        description: 'Có tính chất trung gian giữa kim loại và phi kim. Thường dùng làm chất bán dẫn. Ví dụ: Silic (Si), Germani (Ge).'
    },
    'nonmetal': {
        name: 'Phi kim',
        description: 'Không dẫn điện, không có ánh kim. Rất quan trọng cho sự sống. Ví dụ: Carbon (C), Oxy (O), Nitơ (N).'
    },
    'halogen': {
        name: 'Halogen',
        description: 'Nhóm 17. Phi kim phản ứng mạnh, tạo muối với kim loại. "Halogen" nghĩa là "tạo muối". Ví dụ: Clo (Cl), Flo (F).'
    },
    'noble-gas': {
        name: 'Khí hiếm (khí trơ)',
        description: 'Nhóm 18. Khí không màu, rất ít phản ứng vì lớp electron ngoài đã đầy. Ví dụ: Heli (He), Neon (Ne), Argon (Ar).'
    },
    'lanthanide': {
        name: 'Lanthanide (đất hiếm)',
        description: 'Nguyên tố 57-71. Kim loại đất hiếm, dùng trong nam châm, pin, màn hình. Ví dụ: Neodymi (Nd), Europi (Eu).'
    },
    'actinide': {
        name: 'Actinide',
        description: 'Nguyên tố 89-103. Tất cả đều phóng xạ. Bao gồm nhiên liệu hạt nhân. Ví dụ: Urani (U), Plutoni (Pu).'
    },
};

// Units explanation
const unitsExplanation = [
    { symbol: 'u', name: 'Đơn vị khối lượng nguyên tử', description: '1 u ≈ 1.66 × 10⁻²⁷ kg (khối lượng 1 proton)' },
    { symbol: '°C', name: 'Độ Celsius', description: 'Đơn vị nhiệt độ. Nước đóng băng ở 0°C, sôi ở 100°C' },
    { symbol: 'g/cm³', name: 'Gram trên centimet khối', description: 'Đơn vị mật độ. Nước có mật độ 1 g/cm³' },
];

// Info Modal Component
const InfoModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-white/20"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 flex items-center justify-between p-4 bg-slate-900/90 backdrop-blur-md border-b border-white/10">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Info size={22} className="text-cyan-400" />
                        Hướng dẫn Bảng Tuần Hoàn
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 space-y-6">
                    {/* Categories Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-cyan-400 mb-3">📚 Các nhóm nguyên tố</h3>
                        <div className="space-y-2">
                            {Object.entries(categoryDescriptions).map(([key, info]) => {
                                const style = CATEGORY_COLORS[key as keyof typeof CATEGORY_COLORS];
                                return (
                                    <div
                                        key={key}
                                        className="p-3 rounded-xl border"
                                        style={{
                                            backgroundColor: `${style?.color || '#666'}10`,
                                            borderColor: `${style?.color || '#666'}40`,
                                        }}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{
                                                    backgroundColor: style?.color || '#666',
                                                    boxShadow: `0 0 6px ${style?.glow || '#66666680'}`
                                                }}
                                            />
                                            <span
                                                className="font-semibold text-sm"
                                                style={{ color: style?.color || '#fff' }}
                                            >
                                                {info.name}
                                            </span>
                                        </div>
                                        <p className="text-white/70 text-sm pl-5">{info.description}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Units Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-emerald-400 mb-3">📏 Đơn vị đo lường</h3>
                        <div className="bg-slate-800/50 rounded-xl p-3 space-y-3">
                            {unitsExplanation.map((unit, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded font-mono text-sm font-bold">
                                        {unit.symbol}
                                    </span>
                                    <div>
                                        <p className="text-white font-medium text-sm">{unit.name}</p>
                                        <p className="text-white/60 text-xs">{unit.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Tips */}
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3">
                        <h3 className="text-purple-400 font-semibold mb-2">💡 Mẹo</h3>
                        <ul className="text-white/70 text-sm space-y-1">
                            <li>• Nhấn vào nguyên tố để xem mô hình nguyên tử 3D</li>
                            <li>• Dùng nút tìm kiếm để tìm nhanh nguyên tố</li>
                            <li>• Kéo để xoay mô hình 3D, cuộn để zoom</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Periodic table layout: [period][position in period] = atomicNumber
// Note: Lanthanides (57-71) and Actinides (89-103) are placed separately
const getElementPosition = (element: ElementData): { row: number; col: number } | null => {
    const { atomicNumber, period, group } = element;

    // Lanthanides (57-71) - row 8
    if (atomicNumber >= 57 && atomicNumber <= 71) {
        return { row: 8, col: atomicNumber - 54 }; // cols 3-17
    }

    // Actinides (89-103) - row 9
    if (atomicNumber >= 89 && atomicNumber <= 103) {
        return { row: 9, col: atomicNumber - 86 }; // cols 3-17
    }

    // Regular elements
    if (group === 0) return null; // Lanthanides/Actinides handled above

    return { row: period, col: group };
};

export const PeriodicTable: React.FC<PeriodicTableProps> = ({ onSelectElement }) => {
    const [showInfoModal, setShowInfoModal] = useState(false);

    // Create grid layout
    const grid = useMemo(() => {
        const gridMap: Map<string, ElementData> = new Map();

        ELEMENTS_DATA.forEach(element => {
            const pos = getElementPosition(element);
            if (pos) {
                gridMap.set(`${pos.row}-${pos.col}`, element);
            }
        });

        return gridMap;
    }, []);

    // Generate grid cells
    const renderGrid = () => {
        const rows: React.ReactNode[] = [];

        // Main table (periods 1-7, groups 1-18)
        for (let row = 1; row <= 7; row++) {
            const cells: React.ReactNode[] = [];
            for (let col = 1; col <= 18; col++) {
                const element = grid.get(`${row}-${col}`);
                if (element) {
                    cells.push(
                        <div key={`${row}-${col}`} className="flex items-center justify-center">
                            <ElementCell
                                element={element}
                                onClick={onSelectElement}
                                size="md"
                            />
                        </div>
                    );
                } else {
                    // Empty cell
                    cells.push(<div key={`${row}-${col}`} className="w-14 h-14 sm:w-16 sm:h-16" />);
                }
            }
            rows.push(
                <div key={`row-${row}`} className="flex gap-0.5 sm:gap-1 justify-center">
                    {cells}
                </div>
            );
        }

        // Add separator
        rows.push(
            <div key="separator" className="h-4 sm:h-6" />
        );

        // Lanthanides row (row 8)
        const lanthanides: React.ReactNode[] = [];
        lanthanides.push(<div key="spacer-left" className="w-14 h-14 sm:w-16 sm:h-16" />);
        lanthanides.push(<div key="spacer-left-2" className="w-14 h-14 sm:w-16 sm:h-16" />);
        for (let col = 3; col <= 17; col++) {
            const element = grid.get(`8-${col}`);
            if (element) {
                lanthanides.push(
                    <div key={`8-${col}`} className="flex items-center justify-center">
                        <ElementCell
                            element={element}
                            onClick={onSelectElement}
                            size="md"
                        />
                    </div>
                );
            } else {
                lanthanides.push(<div key={`8-${col}`} className="w-14 h-14 sm:w-16 sm:h-16" />);
            }
        }
        lanthanides.push(<div key="spacer-right" className="w-14 h-14 sm:w-16 sm:h-16" />);
        rows.push(
            <div key="lanthanides" className="flex gap-0.5 sm:gap-1 justify-center">
                {lanthanides}
            </div>
        );

        // Actinides row (row 9)
        const actinides: React.ReactNode[] = [];
        actinides.push(<div key="spacer-left" className="w-14 h-14 sm:w-16 sm:h-16" />);
        actinides.push(<div key="spacer-left-2" className="w-14 h-14 sm:w-16 sm:h-16" />);
        for (let col = 3; col <= 17; col++) {
            const element = grid.get(`9-${col}`);
            if (element) {
                actinides.push(
                    <div key={`9-${col}`} className="flex items-center justify-center">
                        <ElementCell
                            element={element}
                            onClick={onSelectElement}
                            size="md"
                        />
                    </div>
                );
            } else {
                actinides.push(<div key={`9-${col}`} className="w-14 h-14 sm:w-16 sm:h-16" />);
            }
        }
        actinides.push(<div key="spacer-right" className="w-14 h-14 sm:w-16 sm:h-16" />);
        rows.push(
            <div key="actinides" className="flex gap-0.5 sm:gap-1 justify-center">
                {actinides}
            </div>
        );

        return rows;
    };

    // Category legend
    const categories = Object.entries(CATEGORY_COLORS).filter(([key]) => key !== 'unknown');

    const categoryNames: Record<string, string> = {
        'alkali-metal': 'Kim loại kiềm',
        'alkaline-earth': 'Kim loại kiềm thổ',
        'transition-metal': 'Kim loại chuyển tiếp',
        'post-transition': 'Kim loại sau chuyển tiếp',
        'metalloid': 'Á kim',
        'nonmetal': 'Phi kim',
        'halogen': 'Halogen',
        'noble-gas': 'Khí hiếm',
        'lanthanide': 'Lanthanide',
        'actinide': 'Actinide',
    };

    return (
        <div className="w-full overflow-x-auto">
            {/* Legend with Info Button */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-center mb-6 px-2">
                {categories.map(([key, value]) => (
                    <div
                        key={key}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs sm:text-sm transition-all"
                        style={{
                            backgroundColor: `${value.color}20`,
                            border: `1px solid ${value.color}`,
                            color: value.color,
                        }}
                    >
                        <div
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
                            style={{
                                backgroundColor: value.color,
                                boxShadow: `0 0 6px ${value.glow}`
                            }}
                        />
                        <span className="hidden sm:inline">{categoryNames[key] || key}</span>
                    </div>
                ))}

                {/* Info Button */}
                <button
                    onClick={() => setShowInfoModal(true)}
                    className="relative z-20 flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 hover:border-cyan-400 transition-all"
                    title="Xem hướng dẫn"
                >
                    <Info size={18} />
                </button>
            </div>

            {/* Table */}
            <div className="flex flex-col gap-0.5 sm:gap-1 min-w-fit px-2">
                {renderGrid()}
            </div>

            {/* Info Modal */}
            {showInfoModal && <InfoModal onClose={() => setShowInfoModal(false)} />}
        </div>
    );
};
