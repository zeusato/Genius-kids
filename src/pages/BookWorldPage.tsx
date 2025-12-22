import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudent, useStudentActions } from '@/src/contexts/StudentContext';
import { ArrowLeft, Heart, Filter, BookOpen, X, Check } from 'lucide-react';
import { MusicControls } from '@/src/components/MusicControls';
import { getAllBooks } from '@/src/data/booksData';
import {
    getBookCoverUrl,
    filterBooks,
    getBookProgress,
    getProgressPercentage,
    getDefaultLibraryFilter,
    CATEGORY_LABELS,
    AGE_GROUP_LABELS,
} from '@/services/bookService';
import { Book, BookCategory, AgeGroup, LibraryFilter } from '@/types';

export function BookWorldPage() {
    const navigate = useNavigate();
    const { currentStudent } = useStudent();
    const { updateStudent } = useStudentActions();
    const [showFilterModal, setShowFilterModal] = useState(false);

    if (!currentStudent) {
        navigate('/');
        return null;
    }

    // Get filter from profile or use default
    const currentFilter = currentStudent.libraryFilter || getDefaultLibraryFilter(currentStudent.grade);
    const favoriteIds = currentStudent.favoriteBookIds || [];

    // Filter books
    const allBooks = getAllBooks();
    const filteredBooks = useMemo(() => {
        return filterBooks(allBooks, currentFilter, favoriteIds);
    }, [allBooks, currentFilter, favoriteIds]);

    const handleBack = () => {
        navigate('/library');
    };

    const handleBookClick = (bookId: string) => {
        navigate(`/library/books/${bookId}`);
    };

    const handleToggleFavorite = (e: React.MouseEvent, bookId: string) => {
        e.stopPropagation();
        const newFavorites = favoriteIds.includes(bookId)
            ? favoriteIds.filter(id => id !== bookId)
            : [...favoriteIds, bookId];
        updateStudent({ ...currentStudent, favoriteBookIds: newFavorites });
    };

    const handleFilterChange = (newFilter: LibraryFilter) => {
        updateStudent({ ...currentStudent, libraryFilter: newFilter });
        setShowFilterModal(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white text-slate-600 hover:text-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all font-semibold"
                >
                    <ArrowLeft size={20} />
                    <span className="hidden sm:inline">Thư viện</span>
                </button>

                <h1 className="text-2xl md:text-3xl font-bold text-emerald-700 flex items-center gap-2">
                    <BookOpen size={28} />
                    Book World
                </h1>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowFilterModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-xl shadow-sm transition-all font-semibold"
                    >
                        <Filter size={18} />
                        <span className="hidden sm:inline">Lọc</span>
                    </button>
                    <MusicControls />
                </div>
            </div>

            {/* Books Grid */}
            {filteredBooks.length === 0 ? (
                <div className="text-center py-20">
                    <BookOpen size={64} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 text-lg">Không có sách nào phù hợp với bộ lọc</p>
                    <button
                        onClick={() => handleFilterChange(getDefaultLibraryFilter(currentStudent.grade))}
                        className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
                    >
                        Xóa bộ lọc
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredBooks.map(book => (
                        <BookCard
                            key={book.id}
                            book={book}
                            isFavorite={favoriteIds.includes(book.id)}
                            progress={getBookProgress(currentStudent.readingProgress, book.id)}
                            onClick={() => handleBookClick(book.id)}
                            onToggleFavorite={(e) => handleToggleFavorite(e, book.id)}
                        />
                    ))}
                </div>
            )}

            {/* Filter Modal */}
            {showFilterModal && (
                <FilterModal
                    currentFilter={currentFilter}
                    onApply={handleFilterChange}
                    onClose={() => setShowFilterModal(false)}
                />
            )}
        </div>
    );
}

// Book Card Component
interface BookCardProps {
    book: Book;
    isFavorite: boolean;
    progress: ReturnType<typeof getBookProgress>;
    onClick: () => void;
    onToggleFavorite: (e: React.MouseEvent) => void;
}

function BookCard({ book, isFavorite, progress, onClick, onToggleFavorite }: BookCardProps) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const progressPercent = getProgressPercentage(progress, book.totalPages);

    return (
        <div
            onClick={onClick}
            className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer hover:scale-105"
        >
            {/* Cover Image - 16:9 horizontal */}
            <div className="relative aspect-video bg-slate-100">
                {!imageLoaded && !imageError && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
                {imageError ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-100">
                        <BookOpen size={48} className="text-emerald-300" />
                    </div>
                ) : (
                    <img
                        src={getBookCoverUrl(book.id)}
                        alt={book.title}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageError(true)}
                    />
                )}

                {/* Favorite Button */}
                <button
                    onClick={onToggleFavorite}
                    className={`absolute top-2 right-2 p-2 rounded-full transition-all ${isFavorite
                        ? 'bg-red-500 text-white'
                        : 'bg-white/80 text-slate-400 hover:text-red-500'
                        }`}
                >
                    <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                </button>

                {/* Progress Bar */}
                {progress && progressPercent > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/20">
                        <div
                            className={`h-full transition-all ${progress.isCompleted ? 'bg-emerald-500' : 'bg-yellow-500'}`}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                )}

                {/* Completed Badge */}
                {progress?.isCompleted && (
                    <div className="absolute top-2 left-2 bg-emerald-500 text-white px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                        <Check size={12} />
                        Đã đọc
                    </div>
                )}
            </div>

            {/* Book Info */}
            <div className="p-3">
                <h3 className="font-bold text-slate-800 text-sm line-clamp-2 group-hover:text-emerald-600 transition-colors">
                    {book.title}
                </h3>
                {book.author && (
                    <p className="text-slate-500 text-xs mt-1 line-clamp-1">{book.author}</p>
                )}
                <p className="text-slate-400 text-xs mt-1 line-clamp-2 min-h-[2.5em]">{book.description}</p>
                <div className="mt-2">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${book.category === BookCategory.STORY ? 'bg-purple-100 text-purple-700' :
                        book.category === BookCategory.SCIENCE ? 'bg-blue-100 text-blue-700' :
                            'bg-orange-100 text-orange-700'
                        }`}>
                        {CATEGORY_LABELS[book.category]}
                    </span>
                </div>
            </div>
        </div>
    );
}

// Filter Modal Component
interface FilterModalProps {
    currentFilter: LibraryFilter;
    onApply: (filter: LibraryFilter) => void;
    onClose: () => void;
}

function FilterModal({ currentFilter, onApply, onClose }: FilterModalProps) {
    const [filter, setFilter] = useState<LibraryFilter>({ ...currentFilter });

    const toggleCategory = (category: BookCategory) => {
        if (filter.categories.includes(category)) {
            setFilter({ ...filter, categories: filter.categories.filter(c => c !== category) });
        } else {
            setFilter({ ...filter, categories: [...filter.categories, category] });
        }
    };

    const toggleAgeGroup = (ageGroup: AgeGroup) => {
        if (filter.ageGroups.includes(ageGroup)) {
            setFilter({ ...filter, ageGroups: filter.ageGroups.filter(ag => ag !== ageGroup) });
        } else {
            setFilter({ ...filter, ageGroups: [...filter.ageGroups, ageGroup] });
        }
    };

    const selectAllCategories = () => {
        setFilter({ ...filter, categories: Object.values(BookCategory) });
    };

    const selectAllAgeGroups = () => {
        setFilter({ ...filter, ageGroups: Object.values(AgeGroup) });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-white p-4 border-b flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800">Bộ lọc</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 space-y-6">
                    {/* Categories */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-slate-700">Thể loại</h3>
                            <button onClick={selectAllCategories} className="text-sm text-emerald-600 hover:underline">
                                Chọn tất cả
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {Object.values(BookCategory).map(category => (
                                <button
                                    key={category}
                                    onClick={() => toggleCategory(category)}
                                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${filter.categories.includes(category)
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {CATEGORY_LABELS[category]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Age Groups */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-slate-700">Độ tuổi</h3>
                            <button onClick={selectAllAgeGroups} className="text-sm text-emerald-600 hover:underline">
                                Chọn tất cả
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {Object.values(AgeGroup).map(ageGroup => (
                                <button
                                    key={ageGroup}
                                    onClick={() => toggleAgeGroup(ageGroup)}
                                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${filter.ageGroups.includes(ageGroup)
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {AGE_GROUP_LABELS[ageGroup]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Favorites Only */}
                    <div>
                        <button
                            onClick={() => setFilter({ ...filter, favoritesOnly: !filter.favoritesOnly })}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${filter.favoritesOnly
                                ? 'bg-red-100 text-red-700'
                                : 'bg-slate-100 text-slate-600'
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <Heart size={18} fill={filter.favoritesOnly ? 'currentColor' : 'none'} />
                                Chỉ hiện sách yêu thích
                            </span>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${filter.favoritesOnly ? 'bg-red-500 border-red-500' : 'border-slate-300'
                                }`}>
                                {filter.favoritesOnly && <Check size={12} className="text-white" />}
                            </div>
                        </button>
                    </div>
                </div>

                <div className="sticky bottom-0 bg-white p-4 border-t">
                    <button
                        onClick={() => onApply(filter)}
                        className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors"
                    >
                        Áp dụng
                    </button>
                </div>
            </div>
        </div>
    );
}

export default BookWorldPage;
