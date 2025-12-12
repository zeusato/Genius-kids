import { EvolutionNode } from './types';

export const fungi: EvolutionNode = {
    id: 'fungi_simple',
    label: 'Nấm',
    englishLabel: 'Fungi',
    type: 'kingdom',
    description: 'Sinh vật dị dưỡng, hấp thụ chất dinh dưỡng từ môi trường.',
    era: 'Paleozoic',
    color: '#eab308', // Yellow
    traits: ['Dị dưỡng', 'Vách tế bào Chitin'],
    isPlaceholder: true,
    drillable: true
};
