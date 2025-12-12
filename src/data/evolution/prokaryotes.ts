import { EvolutionNode } from './types';

export const bacteria: EvolutionNode = {
    id: 'bacteria',
    label: 'Vi khuẩn',
    englishLabel: 'Bacteria',
    type: 'domain',
    description: 'Vi sinh vật đơn bào nhân sơ, phân bố rộng khắp mọi nơi.',
    era: 'Archean',
    color: '#64748b', // Slate
    traits: ['Nhân sơ', 'Vách tế bào Peptidoglycan'],
    isPlaceholder: true,
    drillable: true
};

export const archaea: EvolutionNode = {
    id: 'archaea',
    label: 'Cổ khuẩn',
    englishLabel: 'Archaea',
    type: 'domain',
    description: 'Vi sinh vật đơn bào nhân sơ, thường sống ở môi trường cực đoan.',
    era: 'Archean',
    color: '#475569', // Slate-600
    traits: ['Nhân sơ', 'Màng lipid ether'],
    isPlaceholder: true,
    drillable: true
};
