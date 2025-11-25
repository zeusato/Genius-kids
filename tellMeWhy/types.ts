// Types for Tell Me Why feature

export interface Category {
    id: number;
    name: string;
}

export interface AgeGroup {
    age_group_id: number;
    age_range: string;
    categories: Category[];
}

export interface CategoryStructure {
    age_groups: AgeGroup[];
}

export interface QuestionData {
    id: number;
    category: string;
    sub_category: string;
    question: string;
    answer: string;
    tags: string[];
    illustration_prompt?: string;
}

export interface UnlockedSubCategory {
    categoryId: number;
    subCategory: string;
}

export interface TellMeWhyProfile {
    unlockedSubCategories: UnlockedSubCategory[];
    favoriteQuestionIds: number[];
}

export interface TreeNode {
    id: string;
    label: string;
    type: 'category' | 'subcategory' | 'question';
    categoryId?: number;
    subCategory?: string;
    questionData?: QuestionData;
    children?: TreeNode[];
    isLocked?: boolean;
    unlockCost?: number;
}
