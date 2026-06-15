import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface GearHeaderProps {
    title: string;
    onBack?: () => void;
    /** Nội dung phụ bên phải (vd: nút Làm mới). */
    right?: React.ReactNode;
}

// Header dùng chung cho cả hai mode. Đã bỏ hai nút music/sound CŨ vì chúng
// không nối với audio nào (state chết) — gây hiểu nhầm cho trẻ.
const GearHeader: React.FC<GearHeaderProps> = ({ title, onBack, right }) => (
    <div className="flex items-center justify-between bg-gradient-to-r from-amber-100 via-orange-100 to-amber-100 px-4 py-3 border-b border-amber-200 shadow-sm z-50 relative">
        <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-full font-medium shadow hover:shadow-md transition-all"
        >
            <ArrowLeft size={18} />
            Menu
        </button>
        <h1 className="text-xl font-bold text-amber-800">{title}</h1>
        <div className="flex items-center gap-2 min-w-[88px] justify-end">{right}</div>
    </div>
);

export default GearHeader;
