import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = 'http://localhost:8000/api';

interface SearchResult {
  id: number;
  filename: string;
  file_type: string;
  file_size: number;
  categories: Array<{ id: number; name: string; color: string }>;
  status: string;
  extracted_text: string;
  ai_summary: string;
  created_at: string;
  highlight?: string;
}

interface SearchBarProps {
  onResultClick?: (result: SearchResult) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onResultClick }) => {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      performSearch();
    }, 300);
    return () => clearTimeout(debounceTimer.current);
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE}/ai/search/`, {
        params: { q: query, page: currentPage, page_size: 10 },
        headers: token ? { Authorization: `Token ${token}` } : {}
      });

      if (response.data.error) {
        setError(response.data.error);
        setResults([]);
      } else {
        setResults(response.data.results || []);
        setTotalResults(response.data.total || 0);
        setShowResults(true);
      }
    } catch (err) {
      setError('搜索失败，请稍后重试');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setCurrentPage(1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  const renderHighlight = (text: string) => {
    if (!text) return '';
    return (
      <div 
        dangerouslySetInnerHTML={{ 
          __html: text.replace(/<mark>/g, '<mark class="bg-yellow-200 text-black px-0.5 rounded">') 
        }} 
      />
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div ref={searchRef} className="w-full max-w-4xl mx-auto">
      <div className="relative mb-6">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="🔍 搜索您的藏书..."
            autoFocus
            className="w-full px-6 py-4 pr-12 bg-[#F5EDE0] border-2 border-[#E5DDD0] rounded-xl 
                     text-[#3D2914] placeholder:text-[#8B7355]/50 font-serif text-lg
                     focus:outline-none focus:border-[#D4A574]/50 focus:ring-2 focus:ring-[#D4A574]/20
                     transition-all duration-300 shadow-sm hover:shadow-md"
          />
          {loading && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#D4A574]"></div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 font-serif">
          ⚠️ {error}
        </div>
      )}

      {showResults && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[#8B7355] font-serif">
              找到 <span className="font-bold text-[#3D2914]">{totalResults}</span> 个相关结果
              {query && ` for "${query}"`}
            </p>
          </div>

          {results.length > 0 ? (
            <div className="space-y-4">
              {results.map((result) => (
                <div
                  key={result.id}
                  onClick={() => onResultClick?.(result)}
                  className="bg-[#FFFEF9] rounded-xl p-6 border border-[#E5DDD0] shadow-sm hover:shadow-md 
                           transition-all duration-300 cursor-pointer group hover:border-[#D4A574]/30"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-1 bg-[#D4A574]/10 text-[#D4A574] rounded-full font-serif">
                          {result.file_type}
                        </span>
                        {result.categories.map((cat) => (
                          <span
                            key={cat.id}
                            className="text-xs px-2 py-1 rounded-full font-serif"
                            style={{ backgroundColor: cat.color + '20', color: cat.color }}
                          >
                            {cat.name}
                          </span>
                        ))}
                      </div>
                      
                      <h3 className="text-xl font-bold text-[#3D2914] mb-2 group-hover:text-[#D4A574] transition-colors font-serif">
                        {result.filename}
                      </h3>
                      
                      {result.highlight && (
                        <div className="mb-3 p-3 bg-[#F5EDE0] rounded-lg border-l-4 border-[#FFD700]/50">
                          <p className="text-sm text-[#8B7355] leading-relaxed font-serif">
                            {renderHighlight(result.highlight)}
                          </p>
                        </div>
                      )}
                      
                      {result.ai_summary && (
                        <p className="text-sm text-[#8B7355] line-clamp-2 font-serif">
                          {result.ai_summary.substring(0, 150)}
                        </p>
                      )}
                    </div>
                    
                    <div className="ml-4 text-right">
                      <div className="text-xs text-[#8B7355] mb-1 font-serif">
                        {formatDate(result.created_at)}
                      </div>
                      <div className="text-xs text-[#8B7355] font-serif">
                        {formatFileSize(result.file_size)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-[#E5DDD0]">
                    <span className="text-xs text-[#FFD700] font-serif">
                      📖 {result.status === 'ready' ? '已处理' : result.status}
                    </span>
                    <button className="text-sm text-[#D4A574] hover:text-[#A08060] transition-colors font-serif
                                 opacity-0 group-hover:opacity-100">
                      查看详情 →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-[#FFFEF9] rounded-xl border border-[#E5DDD0]">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-bold text-[#3D2914] mb-2 font-serif">
                {query ? '未找到相关内容' : '还没有藏书'}
              </h3>
              <p className="text-[#8B7355] font-serif">
                {query ? '尝试使用不同的关键词' : '上传一些文件开始使用'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
