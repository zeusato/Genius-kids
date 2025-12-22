import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStudent, useStudentActions } from '@/src/contexts/StudentContext';
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, Home, Maximize2, Minimize2 } from 'lucide-react';
import HTMLFlipBook from 'react-pageflip';
import { getBookById } from '@/src/data/booksData';
import { getPageImageUrl, getBookCoverUrl, updateReadingProgress, toggleFavoriteBook } from '@/services/bookService';

// Page component for react-pageflip - MUST use forwardRef
const Page = React.forwardRef<HTMLDivElement, { children: React.ReactNode }>(
    ({ children }, ref) => {
        return (
            <div ref={ref} className="page-content bg-white">
                {children}
            </div>
        );
    }
);
Page.displayName = 'Page';

export function BookReaderPage() {
    const navigate = useNavigate();
    const { bookId } = useParams<{ bookId: string }>();
    const { currentStudent } = useStudent();
    const { updateStudent } = useStudentActions();
    const flipBookRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [currentPage, setCurrentPage] = useState(0);
    const [dimensions, setDimensions] = useState({ width: 600, height: 338 });
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Get book data
    const book = bookId ? getBookById(bookId) : undefined;

    // Calculate dimensions to maximize page size (16:9 aspect ratio)
    useEffect(() => {
        const updateDimensions = () => {
            const container = containerRef.current;
            if (!container) return;

            const isMobile = window.innerWidth < 768;

            // Less padding on mobile for maximum content space
            const horizontalPadding = isMobile ? 48 : 100;
            const verticalPadding = isMobile ? 16 : 48;

            const containerWidth = container.clientWidth - horizontalPadding;
            const containerHeight = container.clientHeight - verticalPadding;

            const aspectRatio = 16 / 9;

            // On mobile, use nearly full width
            const scaleFactor = isMobile ? 0.98 : 0.95;

            let width = containerWidth * scaleFactor;
            let height = width / aspectRatio;

            // If height exceeds container, constrain by height
            if (height > containerHeight * scaleFactor) {
                height = containerHeight * scaleFactor;
                width = height * aspectRatio;
            }

            // Max reasonable size (only apply on desktop)
            if (!isMobile) {
                width = Math.min(width, 1100);
                height = Math.min(height, 619);
            }

            setDimensions({ width: Math.floor(width), height: Math.floor(height) });
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);

        // Recalculate on fullscreen change
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
            setTimeout(updateDimensions, 100);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            window.removeEventListener('resize', updateDimensions);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    if (!currentStudent) {
        navigate('/');
        return null;
    }

    if (!book) {
        navigate('/library/books');
        return null;
    }

    const isFavorite = (currentStudent.favoriteBookIds || []).includes(book.id);
    const totalFlipPages = book.totalPages + 2; // cover + pages + end

    // Save progress when page changes
    const handlePageFlip = useCallback((e: any) => {
        const newPage = e.data;
        setCurrentPage(newPage);

        // Save progress (page 0 = cover, page 1+ = content)
        const progressPage = Math.max(0, newPage);
        const newProgress = updateReadingProgress(
            currentStudent.readingProgress,
            book.id,
            progressPage,
            book.totalPages
        );
        updateStudent({ ...currentStudent, readingProgress: newProgress });
    }, [currentStudent, book, updateStudent]);

    const handlePrevPage = () => {
        flipBookRef.current?.pageFlip()?.flipPrev();
    };

    const handleNextPage = () => {
        flipBookRef.current?.pageFlip()?.flipNext();
    };

    const handleToggleFavorite = () => {
        const newFavorites = toggleFavoriteBook(currentStudent.favoriteBookIds, book.id);
        updateStudent({ ...currentStudent, favoriteBookIds: newFavorites });
    };

    const handleBack = () => {
        navigate('/library/books');
    };

    const handleToggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                handleNextPage();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                handlePrevPage();
            } else if (e.key === 'Escape') {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else {
                    handleBack();
                }
            } else if (e.key === 'f' || e.key === 'F') {
                handleToggleFullscreen();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Build pages array
    const pages = [];

    // Cover page
    pages.push(
        <Page key="cover">
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
                <img
                    src={getBookCoverUrl(book.id)}
                    alt={book.title}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
                    draggable={false}
                />
            </div>
        </Page>
    );

    // Content pages
    const startPage = book.startPage ?? 1;
    const endPage = startPage + book.totalPages - 1;

    for (let i = startPage; i <= endPage; i++) {
        pages.push(
            <Page key={`page-${i}`}>
                <div className="w-full h-full flex items-center justify-center bg-white p-2">
                    <img
                        src={getPageImageUrl(book.id, i)}
                        alt={`Trang ${i}`}
                        className="max-w-full max-h-full object-contain"
                        draggable={false}
                        loading={i <= startPage + 1 ? 'eager' : 'lazy'}
                    />
                </div>
            </Page>
        );
    }

    // End page
    pages.push(
        <Page key="end">
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-6 text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-emerald-700 mb-2">Hết truyện!</h2>
                <p className="text-emerald-600 mb-6">{book.title}</p>
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-lg"
                >
                    <Home size={20} />
                    Về thư viện
                </button>
            </div>
        </Page>
    );

    const displayPage = currentPage === 0 ? 'Bìa' : currentPage >= totalFlipPages - 1 ? 'Hết' : `Trang ${currentPage}`;

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-black/30 z-20">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all text-sm"
                >
                    <ArrowLeft size={18} />
                    <span className="hidden sm:inline">Quay lại</span>
                </button>

                <div className="text-center text-white">
                    <h1 className="text-sm font-medium opacity-90">{book.title}</h1>
                    <p className="text-xs opacity-60">{displayPage} / {book.totalPages}</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleToggleFavorite}
                        className={`p-2 rounded-xl transition-all ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                        <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                    </button>
                    <button
                        onClick={handleToggleFullscreen}
                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                    >
                        {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                </div>
            </div>

            {/* Flipbook Container */}
            <div className="flex-1 flex items-center justify-center relative overflow-hidden">
                {/* Navigation Buttons */}
                <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 0}
                    className="absolute left-2 sm:left-4 z-10 p-3 bg-white/10 hover:bg-white/30 disabled:opacity-20 disabled:cursor-not-allowed text-white rounded-full transition-all backdrop-blur-sm"
                >
                    <ChevronLeft size={24} />
                </button>

                {/* Flipbook - Single Page Mode (usePortrait=true forces single page) */}
                <div className="flip-book-container">
                    <HTMLFlipBook
                        ref={flipBookRef}
                        width={dimensions.width}
                        height={dimensions.height}
                        size="fixed"
                        minWidth={300}
                        maxWidth={1200}
                        minHeight={169}
                        maxHeight={675}
                        showCover={true}
                        mobileScrollSupport={true}
                        onFlip={handlePageFlip}
                        className="book-shadow"
                        style={{}}
                        startPage={0}
                        drawShadow={true}
                        flippingTime={800}
                        usePortrait={true}
                        startZIndex={0}
                        autoSize={false}
                        maxShadowOpacity={0.5}
                        showPageCorners={true}
                        disableFlipByClick={false}
                        swipeDistance={30}
                        clickEventForward={true}
                        useMouseEvents={true}
                    >
                        {pages}
                    </HTMLFlipBook>
                </div>

                <button
                    onClick={handleNextPage}
                    disabled={currentPage >= totalFlipPages - 1}
                    className="absolute right-2 sm:right-4 z-10 p-3 bg-white/10 hover:bg-white/30 disabled:opacity-20 disabled:cursor-not-allowed text-white rounded-full transition-all backdrop-blur-sm"
                >
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* Progress Bar */}
            <div className="p-3 bg-black/30">
                <div className="flex items-center gap-3 max-w-xl mx-auto">
                    <span className="text-white/60 text-xs min-w-[32px]">Bìa</span>
                    <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                            style={{ width: `${(currentPage / (totalFlipPages - 1)) * 100}%` }}
                        />
                    </div>
                    <span className="text-white/60 text-xs min-w-[32px] text-right">{book.totalPages}</span>
                </div>
            </div>

            {/* Custom styles for flip effect */}
            <style>{`
                .flip-book-container {
                    perspective: 2000px;
                }
                .book-shadow {
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    border-radius: 8px;
                    overflow: hidden;
                }
                .page-content {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: white;
                }
                /* Make page corners more visible for drag hint */
                .stf__item {
                    cursor: grab;
                }
                .stf__item:active {
                    cursor: grabbing;
                }
            `}</style>
        </div>
    );
}

export default BookReaderPage;
