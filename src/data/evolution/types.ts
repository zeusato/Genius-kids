import { LucideIcon } from 'lucide-react';

export interface EvolutionMilestone {
    label: string;
    description?: string;
    year?: string; // e.g. "3.5 tỷ năm trước"
    icon?: string;
}

export interface EvolutionNode {
    id: string;
    label: string;
    englishLabel?: string;
    type: 'root' | 'domain' | 'kingdom' | 'phylum' | 'class' | 'order' | 'family' | 'genus' | 'species' | 'branch' | 'milestone';
    description?: string;
    imageUrl?: string;
    expanded?: boolean;
    infographicUrl?: string;

    // Advanced feature props
    era: string; // e.g. "Paleozoic", "Precambrian"
    milestone?: EvolutionMilestone;
    traits: string[];

    children?: EvolutionNode[];
    color: string;

    // Visual helper
    isPlaceholder?: boolean;
    drillable?: boolean; // If true, clicking this node triggers a drill-down
}
