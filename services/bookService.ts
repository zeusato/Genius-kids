import { Book, BookCategory, AgeGroup, ReadingProgress, LibraryFilter, Grade } from '@/types';

// Base URL for jsDelivr CDN
const BOOKS_CDN_BASE = 'https://cdn.jsdelivr.net/gh/zeusato/genius-kids-books@main';

/**
 * Get cover image URL for a book
 */
export function getBookCoverUrl(bookId: string): string {
    return `${BOOKS_CDN_BASE}/books/${bookId}/cover.jpeg`;
}

/**
 * Get page image URL for a book
 * Page numbers are 1-indexed (P1, P2, etc.)
 */
export function getPageImageUrl(bookId: string, pageNumber: number): string {
    return `${BOOKS_CDN_BASE}/books/${bookId}/P${pageNumber}.jpeg`;
}

/**
 * Map Grade to default AgeGroups for filtering
 */
export function getDefaultAgeGroupsForGrade(grade: Grade): AgeGroup[] {
    switch (grade) {
        case Grade.Grade1:
            return [AgeGroup.PRESCHOOL_GRADE1];
        case Grade.Grade2:
            return [AgeGroup.PRESCHOOL_GRADE1, AgeGroup.GRADE_2];
        case Grade.Grade3:
            return [AgeGroup.GRADE_2, AgeGroup.GRADE_3];
        case Grade.Grade4:
            return [AgeGroup.GRADE_3, AgeGroup.GRADE_4];
        case Grade.Grade5:
            return [AgeGroup.GRADE_4, AgeGroup.GRADE_5];
        default:
            return Object.values(AgeGroup);
    }
}

/**
 * Get default library filter based on student's grade
 */
export function getDefaultLibraryFilter(grade: Grade): LibraryFilter {
    return {
        categories: Object.values(BookCategory),
        ageGroups: getDefaultAgeGroupsForGrade(grade),
        favoritesOnly: false,
    };
}

/**
 * Filter books based on LibraryFilter settings
 */
export function filterBooks(books: Book[], filter: LibraryFilter, favoriteIds: string[] = []): Book[] {
    return books.filter(book => {
        // Check category
        if (filter.categories.length > 0 && !filter.categories.includes(book.category)) {
            return false;
        }

        // Check age groups (book matches if ANY of its age groups is in filter)
        if (filter.ageGroups.length > 0) {
            const hasMatchingAgeGroup = book.ageGroups.some(ag => filter.ageGroups.includes(ag));
            if (!hasMatchingAgeGroup) {
                return false;
            }
        }

        // Check favorites only
        if (filter.favoritesOnly && !favoriteIds.includes(book.id)) {
            return false;
        }

        return true;
    });
}

/**
 * Get reading progress for a specific book
 */
export function getBookProgress(progressList: ReadingProgress[] | undefined, bookId: string): ReadingProgress | null {
    if (!progressList) return null;
    return progressList.find(p => p.bookId === bookId) || null;
}

/**
 * Calculate reading progress percentage
 */
export function getProgressPercentage(progress: ReadingProgress | null, totalPages: number): number {
    if (!progress || totalPages === 0) return 0;
    return Math.round((progress.currentPage / totalPages) * 100);
}

/**
 * Create or update reading progress
 */
export function updateReadingProgress(
    progressList: ReadingProgress[] | undefined,
    bookId: string,
    currentPage: number,
    totalPages: number
): ReadingProgress[] {
    const now = new Date().toISOString();
    const existing = progressList || [];
    const existingIndex = existing.findIndex(p => p.bookId === bookId);

    const newProgress: ReadingProgress = {
        bookId,
        currentPage,
        lastReadAt: now,
        isCompleted: currentPage >= totalPages,
    };

    if (existingIndex >= 0) {
        // Update existing
        const updated = [...existing];
        updated[existingIndex] = newProgress;
        return updated;
    } else {
        // Add new
        return [...existing, newProgress];
    }
}

/**
 * Toggle favorite status for a book
 */
export function toggleFavoriteBook(favoriteIds: string[] | undefined, bookId: string): string[] {
    const existing = favoriteIds || [];
    if (existing.includes(bookId)) {
        return existing.filter(id => id !== bookId);
    } else {
        return [...existing, bookId];
    }
}

/**
 * Display labels for categories
 */
export const CATEGORY_LABELS: Record<BookCategory, string> = {
    [BookCategory.STORY]: 'Sách truyện',
    [BookCategory.REFERENCE]: 'Sách tham khảo',
    [BookCategory.SCIENCE]: 'Sách khoa học',
};

/**
 * Display labels for age groups
 */
export const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
    [AgeGroup.PRESCHOOL_GRADE1]: 'Mầm non - Lớp 1',
    [AgeGroup.GRADE_2]: 'Lớp 2',
    [AgeGroup.GRADE_3]: 'Lớp 3',
    [AgeGroup.GRADE_4]: 'Lớp 4',
    [AgeGroup.GRADE_5]: 'Lớp 5',
};
