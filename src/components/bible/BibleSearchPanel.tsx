'use client';

import { useState, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { searchBible } from '@/lib/bible-search';
import type { BibleSearchResult } from '@/lib/bible-search';
import './BibleSearchPanel.css';

interface BibleSearchPanelProps {
  onSelectVerse?: (book: number, chapter: number, verse: number) => void;
}

export default function BibleSearchPanel({ onSelectVerse }: BibleSearchPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BibleSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const searchResults = await searchBible(searchQuery);
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    handleSearch(value);
  };

  const handleVerseSelect = (result: BibleSearchResult) => {
    if (onSelectVerse) {
      onSelectVerse(result.book, result.chapter, result.verse);
    }
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="bible-search-panel">
      <div className="search-container">
        <button
          className="search-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Mở tìm kiếm"
        >
          <Search size={20} />
        </button>
      </div>

      {isOpen && (
        <div className="search-modal">
          <div className="search-header">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Tìm kiếm Kinh Thánh..."
                value={query}
                onChange={handleQueryChange}
                autoFocus
              />
              {query && (
                <button className="clear-btn" onClick={handleClear} aria-label="Xóa">
                  <X size={18} />
                </button>
              )}
            </div>
            <button className="close-btn" onClick={handleClear} aria-label="Đóng">
              <X size={20} />
            </button>
          </div>

          {searching && (
            <div className="search-loading">
              <Loader2 size={24} className="spinner" />
              <p>Đang tìm kiếm...</p>
            </div>
          )}

          {!searching && results.length === 0 && query && (
            <div className="search-empty">
              <p>Không tìm thấy kết quả cho &quot;{query}&quot;</p>
            </div>
          )}

          {!searching && results.length > 0 && (
            <div className="search-results">
              <p className="results-info">
                Tìm thấy {results.length} kết quả cho &quot;{query}&quot;
              </p>
              <div className="results-list">
                {results.map((result, idx) => (
                  <div
                    key={idx}
                    className="result-item"
                    onClick={() => handleVerseSelect(result)}
                  >
                    <div className="result-header">
                      <h4 className="result-ref">
                        {result.bookName} {result.chapter}:{result.verse}
                      </h4>
                    </div>
                    <p className="result-text">{result.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!searching && query === '' && (
            <div className="search-hint">
              <p>💡 Gõ từ khóa để tìm kiếm Kinh Thánh</p>
              <p className="hint-examples">
                Ví dụ: &quot;yêu thương&quot;, &quot;tin vui&quot;, &quot;bình an&quot;
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
