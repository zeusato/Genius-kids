export interface EvolutionMilestone {
    label: string;
    description?: string;
    year?: string; // e.g. "3.5 tỷ năm trước"
    icon?: string;
}

// Mục trong bộ sưu tập của một node (kiểu cấu trúc bọt biển, ví dụ cây có hoa…) — các "lá ví dụ"
// cũ không phải một nhánh trọn vẹn nên được gộp vào node cha thay vì vẽ thành cành riêng.
export interface GalleryItem {
    label: string;
    englishLabel?: string;
    description?: string;
    infographicUrl?: string;
}

export interface EvolutionNode {
    id: string;
    label: string;
    englishLabel?: string;
    type: 'root' | 'domain' | 'kingdom' | 'phylum' | 'class' | 'order' | 'family' | 'genus' | 'species' | 'branch' | 'milestone' | 'clade' | 'superorder' | 'suborder';
    description?: string;
    imageUrl?: string;
    expanded?: boolean;
    infographicUrl?: string;

    // Advanced feature props
    era: string; // e.g. "Paleozoic", "Precambrian" — chỉ view cũ còn dùng; thời gian thật ở times.ts
    milestone?: EvolutionMilestone;
    traits: string[];

    children?: EvolutionNode[];
    color: string;

    // Visual helper
    isPlaceholder?: boolean;
    drillable?: boolean; // If true, clicking this node triggers a drill-down (view cũ)

    /** Nhóm "gộp", không phải một nhánh trọn vẹn (vd Giáp xác, Sên trần) — không dùng làm đáp án đố. */
    grade?: boolean;
    gallery?: { title: string; items: GalleryItem[] };
    /** Chỉ node 'humans' — ghim "Bạn ở đây". */
    youAreHere?: boolean;
}
