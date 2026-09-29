import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Info, X } from 'lucide-react';
import { CATEGORY_COLORS } from '@/src/data/elementsData';
import { ELEMENTS, gridPos, type ElementFull } from './engine/elements';
import type { CellLook } from './engine/lenses';
import { ElementCell, type CellMark } from './ElementCell';

interface PeriodicTableProps {
    onSelectElement: (element: ElementFull) => void;
    onHoverElement?: (element: ElementFull | null) => void;
    lookOf: (element: ElementFull) => CellLook;
    collected?: ReadonlySet<number>;
    marks?: ReadonlyMap<number, CellMark>;
    /** Mở màn: các ô chưa sáng. */
    darkSet?: ReadonlySet<number> | null;
    /** Nội dung khoang trống giữa bảng (nhóm 3–12, chu kỳ 1–3). */
    bay?: React.ReactNode;
}

// Category descriptions for the info modal
export const categoryDescriptions: Record<string, { name: string; description: string }> = {
    'alkali-metal': { name: 'Kim loại kiềm', description: 'Nhóm 1 (trừ Hydrogen). Kim loại mềm, phản ứng mạnh với nước tạo dung dịch kiềm. Ví dụ: Natri (Na), Kali (K).' },
    'alkaline-earth': { name: 'Kim loại kiềm thổ', description: 'Nhóm 2. Kim loại nhẹ, phản ứng với nước (chậm hơn kiềm). Ví dụ: Calcium (Ca), Magnesium (Mg).' },
    'transition-metal': { name: 'Kim loại chuyển tiếp', description: 'Nhóm 3-12. Kim loại cứng, dẫn điện tốt, có nhiều trạng thái oxi hóa. Ví dụ: Sắt (Fe), Đồng (Cu), Vàng (Au).' },
    'post-transition': { name: 'Kim loại sau chuyển tiếp', description: 'Kim loại mềm hơn kim loại chuyển tiếp, điểm nóng chảy thấp. Ví dụ: Nhôm (Al), Chì (Pb), Thiếc (Sn).' },
    'metalloid': { name: 'Á kim (bán kim loại)', description: 'Có tính chất trung gian giữa kim loại và phi kim. Thường dùng làm chất bán dẫn. Ví dụ: Silicon (Si), Germanium (Ge).' },
    'nonmetal': { name: 'Phi kim', description: 'Không dẫn điện, không có ánh kim. Rất quan trọng cho sự sống. Ví dụ: Carbon (C), Oxygen (O), Nitơ (N).' },
    'halogen': { name: 'Halogen', description: 'Nhóm 17. Phi kim phản ứng mạnh, tạo muối với kim loại. "Halogen" nghĩa là "tạo muối". Ví dụ: Chlorine (Cl), Fluorine (F).' },
    'noble-gas': { name: 'Khí hiếm (khí trơ)', description: 'Nhóm 18. Khí không màu, rất ít phản ứng vì lớp electron ngoài đã đầy. Ví dụ: Helium (He), Neon (Ne), Argon (Ar).' },
    'lanthanide': { name: 'Lanthanide (đất hiếm)', description: 'Nguyên tố 57-71. Kim loại đất hiếm, dùng trong nam châm, pin, màn hình. Ví dụ: Neodymium (Nd), Europium (Eu).' },
    'actinide': { name: 'Actinide', description: 'Nguyên tố 89-103. Tất cả đều phóng xạ. Bao gồm nhiên liệu hạt nhân. Ví dụ: Uranium (U), Plutonium (Pu).' },
};

export const categoryNames: Record<string, string> = {
    'alkali-metal': 'Kim loại kiềm', 'alkaline-earth': 'Kim loại kiềm thổ', 'transition-metal': 'Kim loại chuyển tiếp',
    'post-transition': 'Kim loại sau chuyển tiếp', 'metalloid': 'Á kim', 'nonmetal': 'Phi kim', 'halogen': 'Halogen',
    'noble-gas': 'Khí hiếm', 'lanthanide': 'Lanthanide', 'actinide': 'Actinide', 'unknown': 'Chưa xác định',
};

const unitsExplanation = [
    { symbol: 'u', name: 'Đơn vị khối lượng nguyên tử (amu)', description: '1 u ≈ 1.66 × 10⁻²⁷ kg (khối lượng 1 proton)' },
    { symbol: '°C', name: 'Độ Celsius', description: 'Đơn vị nhiệt độ. Nước đóng băng ở 0°C, sôi ở 100°C' },
    { symbol: 'g/cm³', name: 'Gram trên centimet khối', description: 'Đơn vị mật độ. Nước có mật độ 1 g/cm³' },
];

export const InfoModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
        <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-white/20" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between p-4 bg-slate-900/90 backdrop-blur-md border-b border-white/10">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><Info size={22} className="text-cyan-400" />Hướng dẫn Bảng Tuần Hoàn</h2>
                <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-cyan-400 mb-3">📚 Các nhóm nguyên tố</h3>
                    <div className="space-y-2">
                        {Object.entries(categoryDescriptions).map(([key, info]) => {
                            const style = CATEGORY_COLORS[key as keyof typeof CATEGORY_COLORS];
                            return (
                                <div key={key} className="p-3 rounded-xl border" style={{ backgroundColor: `${style?.color || '#666'}10`, borderColor: `${style?.color || '#666'}40` }}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: style?.color || '#666', boxShadow: `0 0 6px ${style?.glow || '#66666680'}` }} />
                                        <span className="font-semibold text-sm" style={{ color: style?.color || '#fff' }}>{info.name}</span>
                                    </div>
                                    <p className="text-white/70 text-sm pl-5">{info.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-emerald-400 mb-3">📏 Đơn vị đo lường</h3>
                    <div className="bg-slate-800/50 rounded-xl p-3 space-y-3">
                        {unitsExplanation.map((unit, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded font-mono text-sm font-bold">{unit.symbol}</span>
                                <div><p className="text-white font-medium text-sm">{unit.name}</p><p className="text-white/60 text-xs">{unit.description}</p></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-3">
                    <h3 className="text-sky-300 font-semibold mb-2">🔤 Tên nguyên tố theo sách giáo khoa mới</h3>
                    <p className="text-white/70 text-sm">Chương trình 2018 gọi tên nguyên tố theo IUPAC (hydrogen, oxygen, carbon…). Riêng 13 nguyên tố vẫn giữ tên tiếng Việt: vàng, bạc, đồng, chì, sắt, nhôm, kẽm, lưu huỳnh, thiếc, nitơ, natri, kali, thủy ngân. Tên cũ (hiđro, oxi…) vẫn tìm được.</p>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3">
                    <h3 className="text-purple-400 font-semibold mb-2">💡 Mẹo</h3>
                    <ul className="text-white/70 text-sm space-y-1">
                        <li>• Chạm vào ô để mở mẫu vật 3D, làm thí nghiệm và lặn vào nguyên tử</li>
                        <li>• Đổi <b>kính lọc</b> để xem bảng theo nhiệt độ, đời sống, nguồn gốc vũ trụ, lịch sử…</li>
                        <li>• Phím mũi tên để đi qua các ô, Enter để mở</li>
                        <li>• Hình hiển thị được phóng to có chủ ý; ảnh infographic cần có mạng</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
);

const Empty: React.FC<{ slot?: string; children?: React.ReactNode }> = ({ slot, children }) => (
    <div data-slot={slot} className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">{children}</div>
);

// Bố cục: [chu kỳ][cột] như bản cũ — 7 hàng chính + khoảng cách + 2 hàng f. KHÔNG đổi kích thước/khoảng cách.
export const PeriodicTable: React.FC<PeriodicTableProps> = ({ onSelectElement, onHoverElement, lookOf, collected, marks, darkSet, bay }) => {
    const grid = useMemo(() => {
        const m = new Map<string, ElementFull>();
        ELEMENTS.forEach(e => { const p = gridPos(e); m.set(`${p.row}-${p.col}`, e); });
        return m;
    }, []);

    const cell = (row: number, col: number) => {
        const e = grid.get(`${row}-${col}`);
        if (!e) {
            const marker = row === 6 && col === 3 ? '57–71' : row === 7 && col === 3 ? '89–103' : null;
            return (
                <Empty key={`${row}-${col}`} slot={`${row}-${col}`}>
                    {marker && <span className="w-full h-full rounded-lg border border-dashed border-slate-400/30 text-slate-400/70 text-[8px] sm:text-[10px] flex items-center justify-center">{marker}</span>}
                </Empty>
            );
        }
        return (
            <div key={`${row}-${col}`} className="flex items-center justify-center">
                <ElementCell element={e} onClick={onSelectElement} onHover={onHoverElement} look={lookOf(e)}
                    collected={collected?.has(e.atomicNumber)} mark={marks?.get(e.atomicNumber) ?? null} dark={darkSet?.has(e.atomicNumber)} />
            </div>
        );
    };

    const rows: React.ReactNode[] = [];
    for (let row = 1; row <= 7; row++) {
        const cells: React.ReactNode[] = [];
        for (let col = 1; col <= 18; col++) cells.push(cell(row, col));
        rows.push(<div key={`row-${row}`} className="flex gap-0.5 sm:gap-1 justify-center">{cells}</div>);
    }
    rows.push(<div key="separator" className="h-4 sm:h-6" />);
    for (const row of [9, 10]) {
        const cells: React.ReactNode[] = [<Empty key="l1" />, <Empty key="l2" />];
        for (let col = 3; col <= 17; col++) cells.push(cell(row, col));
        cells.push(<Empty key="r" />);
        rows.push(<div key={`row-${row}`} className="flex gap-0.5 sm:gap-1 justify-center">{cells}</div>);
    }

    // Khoang giữa: đặt tuyệt đối trên các ô trống (hàng 1–3, cột 3–12), không đẩy ô nào.
    const wrap = useRef<HTMLDivElement>(null);
    const [bayRect, setBayRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
    useLayoutEffect(() => {
        const root = wrap.current;
        if (!root) return;
        const measure = () => {
            const a = root.querySelector<HTMLElement>('[data-slot="1-3"]'), b = root.querySelector<HTMLElement>('[data-slot="3-12"]');
            if (!a || !b) return;
            const r = root.getBoundingClientRect(), ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
            const z = root.offsetWidth ? r.width / root.offsetWidth : 1;   // bù CSS zoom của khung vừa màn
            setBayRect({ left: (ra.left - r.left) / z, top: (ra.top - r.top) / z, width: (rb.right - ra.left) / z, height: (rb.bottom - ra.top) / z });
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(root);
        return () => ro.disconnect();
    }, []);

    return (
        <div ref={wrap} className="relative flex flex-col gap-0.5 sm:gap-1 min-w-fit px-2">
            {rows}
            {bay && bayRect && (
                <div className="absolute z-20" style={{ left: bayRect.left, top: bayRect.top, width: bayRect.width, height: bayRect.height }}>{bay}</div>
            )}
        </div>
    );
};
