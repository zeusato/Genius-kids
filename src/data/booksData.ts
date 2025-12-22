import { Book, BookCategory, AgeGroup } from '@/types';

/**
 * Books data - metadata for all available books
 * Images are stored on GitHub and served via jsDelivr CDN
 */
export const BOOKS_DATA: Book[] = [
    {
        id: 'Thac-nuoc-lap-lanh',
        title: 'Thác nước lấp lánh',
        author: 'Mạnh Quyết',
        description: 'Câu chuyện về tình bạn của Thỏ, Sóc và Gấu',
        category: BookCategory.STORY,
        ageGroups: [
            AgeGroup.PRESCHOOL_GRADE1,
            AgeGroup.GRADE_2,
            AgeGroup.GRADE_3,
            AgeGroup.GRADE_4,
            AgeGroup.GRADE_5,
        ],
        totalPages: 12,
    },
    {
        id: 'Lop-hoc-rung-xanh',
        title: 'Lớp học rừng xanh',
        author: 'Mạnh Quyết',
        description: 'Câu chuyện về sự chia sẻ, đoàn kết',
        category: BookCategory.STORY,
        ageGroups: [
            AgeGroup.PRESCHOOL_GRADE1,
            AgeGroup.GRADE_2,
            AgeGroup.GRADE_3,
            AgeGroup.GRADE_4,
            AgeGroup.GRADE_5,
        ],
        totalPages: 16,
        startPage: 0,
    },
    // Add more books here...
];

/**
 * Get all books
 */
export function getAllBooks(): Book[] {
    return BOOKS_DATA;
}

/**
 * Get book by ID
 */
export function getBookById(bookId: string): Book | undefined {
    return BOOKS_DATA.find(book => book.id === bookId);
}
