import { EvolutionNode } from './evolution/types';
import { bacteria, archaea } from './evolution/prokaryotes';
import { protists } from './evolution/protists';
import { plantae } from './evolution/plants';
import { fungi } from './evolution/fungi';
import { animalia } from './evolution/animals';

// Re-export type for consumers
export type { EvolutionNode, EvolutionMilestone } from './evolution/types';

export const EVOLUTION_TREE_DATA: EvolutionNode = {
    id: 'life_origin',
    label: 'Nguồn Gốc Sự Sống',
    englishLabel: 'Origin of Life',
    type: 'root',
    description: 'Khởi đầu của mọi sự sống trên Trái Đất. Từ những hợp chất hữu cơ đơn giản trong "nồi súp nguyên thủy".',
    era: 'Hadean / Archean',
    color: '#0ea5e9', // Sky blue
    traits: ['Hóa học tiền sinh học'],
    infographicUrl: 'evolution/Origin of life.jpeg', // Note: file on disk is "Origin of life.jpeg"
    children: [
        {
            id: 'luca',
            label: 'Tổ tiên chung cuối cùng (LUCA)',
            englishLabel: 'LUCA',
            type: 'domain',
            description: 'Last Universal Common Ancestor - Tổ tiên chung của tất cả sinh vật hiện nay.',
            era: 'Archean',
            color: '#0891b2', // Cyan-700
            traits: ['DNA/RNA', 'Màng tế bào', 'Tổng hợp protein'],
            infographicUrl: 'evolution/LUCA.jpeg',
            milestone: {
                label: 'Sự Sống Đầu Tiên',
                year: '3.5 - 3.8 tỷ năm trước'
            },
            children: [
                bacteria,
                archaea,
                {
                    id: 'eukarya',
                    label: 'Sinh vật nhân thực',
                    englishLabel: 'Eukarya (Eukaryotes)',
                    type: 'domain',
                    description: 'Sinh vật có tế bào chứa nhân và các bào quan có màng bao bọc.',
                    era: 'Proterozoic',
                    color: '#8b5cf6', // Violet
                    traits: ['Nhân thực', 'Bào quan phức tạp'],
                    infographicUrl: 'evolution/Eukarya.jpeg',
                    milestone: {
                        label: 'Xuất Hiện Nhân',
                        year: '2.7 tỷ năm trước'
                    },
                    children: [
                        protists,
                        plantae,
                        fungi,
                        animalia
                    ]
                }
            ]
        }
    ]
};
