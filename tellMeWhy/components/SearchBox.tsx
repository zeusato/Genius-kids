import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBoxProps {
    onSearch: (keyword: string) => void;
}

export const SearchBox: React.FC<SearchBoxProps> = ({ onSearch }) => {
    const [keyword, setKeyword] = useState('');

    const handleSearch = (value: string) => {
        setKeyword(value);
        onSearch(value);
    };

    const clearSearch = () => {
        setKeyword('');
        onSearch('');
    };

    return (
        <div className="relative">
            <div className="relative">
                <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                    size={20}
                />
                <input
                    type="text"
                    value={keyword}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Tìm kiếm câu hỏi, từ khóa..."
                    className="w-full pl-10 pr-10 py-3 rounded-lg border-2 border-slate-200 focus:border-brand-400 focus:outline-none transition-colors text-sm"
                />
                {keyword && (
                    <button
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>
        </div>
    );
};
