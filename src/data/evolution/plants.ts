import { EvolutionNode } from './types';

export const plantae: EvolutionNode = {
    id: 'plantae_simple',
    label: 'Thực Vật',
    englishLabel: 'Plants',
    type: 'kingdom',
    description: 'Sinh vật đa bào tự dưỡng, quang hợp.',
    era: 'Paleozoic',
    color: '#22c55e', // Green
    traits: ['Quang hợp', 'Vách tế bào Cellulose'],
    isPlaceholder: true,
    drillable: true
};
