// Service for Tell Me Why (1000 Questions Encyclopedia)

import categoryStructure from '../tellMeWhy/Data/contentCategory.json';
import animalData from '../tellMeWhy/Data/Animal_content.json';
import treeData from '../tellMeWhy/Data/Tree_content.json';
import {
    CategoryStructure,
    QuestionData,
    TreeNode,
    TellMeWhyProfile,
    UnlockedSubCategory,
    Category
} from '../tellMeWhy/types';

const UNLOCK_COST_PER_SUBCATEGORY = 30;
const FREE_CATEGORY_ID = 1; // "Động vật" is free

/**
 * Get all categories from structure (flattened, sorted by ID)
 */
export const getAllCategories = (): Category[] => {
    const struct = categoryStructure as CategoryStructure;
    const allCategories: Category[] = [];

    struct.age_groups.forEach(group => {
        allCategories.push(...group.categories);
    });

    // Sort by ID
    return allCategories.sort((a, b) => a.id - b.id);
};

/**
 * Load content data for a specific category
 * Returns null if category doesn't have content yet
 */
export const loadCategoryContent = (categoryId: number): QuestionData[] | null => {
    switch (categoryId) {
        case 1: // Động vật
            return animalData as QuestionData[];
        case 2: // Thực vật
            return treeData as QuestionData[];
        // Add more cases as content becomes available
        // case 3: return phenomenaData;
        default:
            return null;
    }
};

/**
 * Get all unique sub-categories for a category
 */
export const getSubCategories = (categoryId: number): string[] => {
    const content = loadCategoryContent(categoryId);
    if (!content) return [];

    const subCats = new Set<string>();
    content.forEach(q => subCats.add(q.sub_category));

    return Array.from(subCats).sort();
};

/**
 * Get questions for a specific sub-category
 */
export const getQuestionsBySubCategory = (
    categoryId: number,
    subCategory: string
): QuestionData[] => {
    const content = loadCategoryContent(categoryId);
    if (!content) return [];

    return content.filter(q => q.sub_category === subCategory);
};

/**
 * Build tree structure for navigation
 */
export const buildTreeStructure = (profile: TellMeWhyProfile): TreeNode[] => {
    const categories = getAllCategories();
    const treeNodes: TreeNode[] = [];

    // Build Favorites category if there are any favorite questions
    if (profile.favoriteQuestionIds.length > 0) {
        const favoriteQuestions: QuestionData[] = [];

        // Collect all favorite questions from all categories
        categories.forEach(cat => {
            const content = loadCategoryContent(cat.id);
            if (!content) return;

            content.forEach(q => {
                if (profile.favoriteQuestionIds.includes(q.id)) {
                    favoriteQuestions.push(q);
                }
            });
        });

        // Create Favorites category node
        if (favoriteQuestions.length > 0) {
            const favoritesNode: TreeNode = {
                id: 'cat-favorites',
                label: '⭐ Yêu thích',
                type: 'category',
                children: favoriteQuestions.map(q => ({
                    id: `fav-q-${q.id}`,
                    label: q.question,
                    type: 'question',
                    questionData: q
                }))
            };

            treeNodes.push(favoritesNode);
        }
    }

    categories.forEach(cat => {
        const content = loadCategoryContent(cat.id);

        // Only show categories with content
        if (!content || content.length === 0) return;

        const subCategories = getSubCategories(cat.id);
        const isFreeCategory = cat.id === FREE_CATEGORY_ID;

        const categoryNode: TreeNode = {
            id: `cat-${cat.id}`,
            label: cat.name,
            type: 'category',
            categoryId: cat.id,
            children: []
        };

        subCategories.forEach(subCat => {
            const isUnlocked = isFreeCategory ||
                profile.unlockedSubCategories.some(
                    u => u.categoryId === cat.id && u.subCategory === subCat
                );

            const questions = getQuestionsBySubCategory(cat.id, subCat);

            const subCatNode: TreeNode = {
                id: `subcat-${cat.id}-${subCat}`,
                label: subCat,
                type: 'subcategory',
                categoryId: cat.id,
                subCategory: subCat,
                isLocked: !isUnlocked,
                unlockCost: isUnlocked ? undefined : UNLOCK_COST_PER_SUBCATEGORY,
                children: []
            };

            // Only add question nodes if unlocked
            if (isUnlocked) {
                questions.forEach(q => {
                    subCatNode.children!.push({
                        id: `q-${q.id}`,
                        label: q.question,
                        type: 'question',
                        questionData: q
                    });
                });
            }

            categoryNode.children!.push(subCatNode);
        });

        treeNodes.push(categoryNode);
    });

    return treeNodes;
};

/**
 * Search questions by keyword
 */
export const searchQuestions = (keyword: string, profile: TellMeWhyProfile): QuestionData[] => {
    const normalizedKeyword = keyword.toLowerCase().trim();
    if (!normalizedKeyword) return [];

    const results: QuestionData[] = [];
    const categories = getAllCategories();

    categories.forEach(cat => {
        const content = loadCategoryContent(cat.id);
        if (!content) return;

        const isFreeCategory = cat.id === FREE_CATEGORY_ID;

        content.forEach(q => {
            // Check if this question's subcategory is unlocked
            const isUnlocked = isFreeCategory ||
                profile.unlockedSubCategories.some(
                    u => u.categoryId === cat.id && u.subCategory === q.sub_category
                );

            if (!isUnlocked) return;

            // Search in question, answer, and tags
            const inQuestion = q.question.toLowerCase().includes(normalizedKeyword);
            const inAnswer = q.answer.toLowerCase().includes(normalizedKeyword);
            const inTags = q.tags.some(tag => tag.toLowerCase().includes(normalizedKeyword));

            if (inQuestion || inAnswer || inTags) {
                results.push(q);
            }
        });
    });

    return results;
};

/**
 * Check if can unlock a subcategory
 */
export const canUnlockSubCategory = (
    categoryId: number,
    subCategory: string,
    currentStars: number,
    profile: TellMeWhyProfile
): boolean => {
    // Free category
    if (categoryId === FREE_CATEGORY_ID) return true;

    // Already unlocked
    const alreadyUnlocked = profile.unlockedSubCategories.some(
        u => u.categoryId === categoryId && u.subCategory === subCategory
    );
    if (alreadyUnlocked) return true;

    // Check if has enough stars
    return currentStars >= UNLOCK_COST_PER_SUBCATEGORY;
};

/**
 * Unlock a subcategory
 */
export const unlockSubCategory = (
    categoryId: number,
    subCategory: string,
    profile: TellMeWhyProfile
): TellMeWhyProfile => {
    // Check if already unlocked
    const alreadyUnlocked = profile.unlockedSubCategories.some(
        u => u.categoryId === categoryId && u.subCategory === subCategory
    );

    if (alreadyUnlocked || categoryId === FREE_CATEGORY_ID) {
        return profile;
    }

    return {
        ...profile,
        unlockedSubCategories: [
            ...profile.unlockedSubCategories,
            { categoryId, subCategory }
        ]
    };
};

/**
 * Toggle favorite status of a question
 */
export const toggleFavorite = (
    questionId: number,
    profile: TellMeWhyProfile
): TellMeWhyProfile => {
    const isFavorite = profile.favoriteQuestionIds.includes(questionId);

    return {
        ...profile,
        favoriteQuestionIds: isFavorite
            ? profile.favoriteQuestionIds.filter(id => id !== questionId)
            : [...profile.favoriteQuestionIds, questionId]
    };
};

/**
 * Get next/previous question in the same subcategory or favorites list
 */
export const getAdjacentQuestion = (
    currentQuestionId: number,
    direction: 'next' | 'prev',
    profile: TellMeWhyProfile,
    currentContext?: 'favorites' | 'normal'
): QuestionData | null => {
    // If viewing from favorites, navigate within favorites
    if (currentContext === 'favorites' || profile.favoriteQuestionIds.includes(currentQuestionId)) {
        const favoriteQuestions: QuestionData[] = [];
        const categories = getAllCategories();

        categories.forEach(cat => {
            const content = loadCategoryContent(cat.id);
            if (!content) return;

            content.forEach(q => {
                if (profile.favoriteQuestionIds.includes(q.id)) {
                    favoriteQuestions.push(q);
                }
            });
        });

        const currentIndex = favoriteQuestions.findIndex(q => q.id === currentQuestionId);
        if (currentIndex === -1) return null;

        if (direction === 'next') {
            if (currentIndex < favoriteQuestions.length - 1) {
                return favoriteQuestions[currentIndex + 1];
            }
        } else {
            if (currentIndex > 0) {
                return favoriteQuestions[currentIndex - 1];
            }
        }

        return null;
    }

    // Normal navigation within subcategory
    const categories = getAllCategories();

    for (const cat of categories) {
        const content = loadCategoryContent(cat.id);
        if (!content) continue;

        const index = content.findIndex(q => q.id === currentQuestionId);
        if (index === -1) continue;

        // Found the current question, get current subcategory
        const currentQ = content[index];
        const subCatQuestions = content.filter(q => q.sub_category === currentQ.sub_category);
        const subIndex = subCatQuestions.findIndex(q => q.id === currentQuestionId);

        if (direction === 'next') {
            if (subIndex < subCatQuestions.length - 1) {
                return subCatQuestions[subIndex + 1];
            }
        } else {
            if (subIndex > 0) {
                return subCatQuestions[subIndex - 1];
            }
        }

        return null;
    }

    return null;
};

/**
 * Load Tell Me Why profile from localStorage
 */
export const loadTellMeWhyProfile = (studentId: string): TellMeWhyProfile => {
    const key = `tellMeWhy_${studentId}`;
    const stored = localStorage.getItem(key);

    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse Tell Me Why profile', e);
        }
    }

    // Default profile
    return {
        unlockedSubCategories: [],
        favoriteQuestionIds: []
    };
};

/**
 * Save Tell Me Why profile to localStorage
 */
export const saveTellMeWhyProfile = (studentId: string, profile: TellMeWhyProfile): void => {
    const key = `tellMeWhy_${studentId}`;
    localStorage.setItem(key, JSON.stringify(profile));
};
