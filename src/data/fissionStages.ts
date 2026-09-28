import type { MitosisStage } from './mitosisStages';

// Thí nghiệm "Nhân đôi" của vi khuẩn (phân đôi) — đơn giản hơn hẳn nguyên phân của tế bào nhân thực.

export const FISSION_STAGES: MitosisStage[] = [
    { from: 0, phase: 'Lớn lên', title: 'Vi khuẩn ăn no và dài ra', text: 'Vi khuẩn hút chất dinh dưỡng xung quanh, lớn dần và dài gấp rưỡi lúc đầu.' },
    { from: 0.2, phase: 'Sao chép', title: 'Vòng ADN nhân đôi', text: 'Vòng ADN được sao chép thành hai bản giống hệt nhau, mỗi bản chạy về một đầu. Plasmid cũng được nhân đôi.' },
    { from: 0.45, phase: 'Thắt lại', title: 'Vách ngăn mọc ở giữa', text: 'Màng và thành tế bào mọc dần vào chính giữa như một bức vách, thắt vi khuẩn lại.' },
    { from: 0.8, phase: 'Tách đôi', title: '1 vi khuẩn → 2 vi khuẩn con', text: 'Vách ngăn khép kín: hai vi khuẩn con giống hệt nhau ra đời. Không cần nhiễm sắc thể xếp hàng như tế bào của em!' }
];

export const FISSION_DURATION = 20;

// Điều kiện lý tưởng: E. coli nhân đôi khoảng 20 phút một lần → bài học lũy thừa của 2
export const DOUBLING_MINUTES = 20;

export function doublingRows(): { label: string; count: number }[] {
    const rows: { label: string; count: number }[] = [];
    for (const minutes of [0, 20, 40, 60, 120, 240, 420]) {
        const n = 2 ** (minutes / DOUBLING_MINUTES);
        const label = minutes === 0 ? 'Bắt đầu' : minutes < 60 ? `${minutes} phút` : `${minutes / 60} giờ`;
        rows.push({ label, count: n });
    }
    return rows;
}
