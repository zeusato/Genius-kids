// Service for Tell Me Why (1000 Questions Encyclopedia)

import categoryStructure from '../tellMeWhy/Data/contentCategory.json';
import animalData from '../tellMeWhy/Data/Animal_content.json';
import treeData from '../tellMeWhy/Data/Tree_content.json';
import dailyLifeData from '../tellMeWhy/Data/Daily_life_content.json';
import natureBasicData from '../tellMeWhy/Data/Nature_basic_content.json';
import earthData from '../tellMeWhy/Data/Earth_content.json';
import humanBodyData from '../tellMeWhy/Data/Human_body_content.json';
import physicsData from '../tellMeWhy/Data/physics_content.json';
import spaceData from '../tellMeWhy/Data/Space_content.json';
import chemicalData from '../tellMeWhy/Data/Chemical_content.json';
import spaceExtraData from '../tellMeWhy/Data/Space_extra_content.json';
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
        case 3: // Đời sống hằng ngày
            return dailyLifeData as QuestionData[];
        case 4: // Sự vật & hiện tượng cơ bản
            return natureBasicData as QuestionData[];
        case 5: // Trái Đất & Môi trường
            return earthData as QuestionData[];
        case 6: // Cơ thể người
            return humanBodyData as QuestionData[];
        case 7: // Vật lý đời sống
            return physicsData as QuestionData[];
        case 8: // Không gian & Hệ Mặt Trời
            return spaceData as QuestionData[];
        case 9: // Hóa học đời sống
            return chemicalData as QuestionData[];
        case 10: // Vũ trụ nâng cao
            return spaceExtraData as QuestionData[];
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
        const isFreeCategory = cat.id >= 1 && cat.id <= 4; // Categories 1-4 are free

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

        const isFreeCategory = cat.id >= 1 && cat.id <= 4; // Categories 1-4 are free

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
    currentContext?: 'favorites' | 'normal',
    currentQuestion?: QuestionData  // Add optional current question for context
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
    // If we have the current question object, use its category and subcategory directly
    let targetCategory: string | null = null;
    let targetSubCategory: string | null = null;
    let targetCategoryId: number | null = null;

    if (currentQuestion) {
        // Use category and sub_category from the question object
        targetCategory = currentQuestion.category;
        targetSubCategory = currentQuestion.sub_category;

        // Find the category ID by matching category name
        const categories = getAllCategories();
        const foundCat = categories.find(cat => {
            const content = loadCategoryContent(cat.id);
            if (!content || content.length === 0) return false;
            // Check if this category's questions have the same category name
            return content[0]?.category === targetCategory;
        });

        if (foundCat) {
            targetCategoryId = foundCat.id;
        }
    } else {
        // Fallback: find by question ID (less reliable if IDs are not unique across categories)
        const categories = getAllCategories();

        for (const cat of categories) {
            const content = loadCategoryContent(cat.id);
            if (!content) continue;

            const found = content.find(q => q.id === currentQuestionId);
            if (found) {
                targetCategory = found.category;
                targetSubCategory = found.sub_category;
                targetCategoryId = cat.id;
                break;
            }
        }
    }

    // If we couldn't find the question's context, return null
    if (!targetCategoryId || !targetSubCategory) return null;

    // Get all questions from the SAME category and SAME subcategory
    const categoryContent = loadCategoryContent(targetCategoryId);
    if (!categoryContent) return null;

    const subCatQuestions = categoryContent.filter(
        q => q.sub_category === targetSubCategory
    );

    // Sort by ID to ensure consistent ordering
    subCatQuestions.sort((a, b) => a.id - b.id);

    const subIndex = subCatQuestions.findIndex(q => q.id === currentQuestionId);

    if (subIndex === -1) return null;

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
