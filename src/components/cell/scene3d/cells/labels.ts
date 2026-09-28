import { CellType } from '../../../../data/cellData';
import { LabelSpec } from '../CellLabels';

// Độ ưu tiên giữ nhãn khi chồng nhau: bào quan to/đặc trưng trước, "nền" sau
const PRIORITY: Record<string, number> = {
    nucleus: 10, nucleoid: 10, vacuole: 10, chloroplast: 9, cell_wall: 9, plasma_membrane: 9, capsule: 8,
    mitochondria: 8, flagellum: 8, golgi: 7, er: 7, cell_wall_bac: 7, lysosome: 6, centrosome: 6,
    pili: 6, plasmid: 6, ribosome: 5, cytoskeleton: 4, cytoplasm: 3, cytoplasm_bac: 3
};

export function labelSpecsFor(cell: CellType): LabelSpec[] {
    return cell.organelles.map((o) => ({
        id: o.id,
        name: o.name,
        emoji: o.emoji,
        color: o.color,
        priority: PRIORITY[o.id] ?? 5
    }));
}
