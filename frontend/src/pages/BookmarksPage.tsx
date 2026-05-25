import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { FileCard, FileCardSkeleton } from '../components/FileCard';
import { FileDetailModal } from '../components/FileDetailModal';

const API_BASE = 'http://localhost:8000/api';

interface BookmarkItem {
  id: number;
  file: {
    id: number;
    filename: string;
    file_type: string;
    file_size: number;
    categories: Array<{ id: number; name: string; color: string }>;
    status: string;
    created_at: string;
  };
  note: string;
  created_at: string;
}

const BookmarksPage: React.FC = () => {
  const { token } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const response = await axios.get(`${API_BASE}/files/bookmarks/`, {
        headers: token ? { Authorization: `Token ${token}` } : {}
      });
      setBookmarks(response.data);
    } catch (error) {
      console.error('获取书签失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (bookmarkId: number) => {
    try {
      await axios.delete(`${API_BASE}/files/bookmarks/${bookmarkId}/remove/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setBookmarks(bookmarks.filter(b => b.id !== bookmarkId));
    } catch (error) {
      console.error('移除书签失败:', error);
    }
  };

  const handleFileCardClick = (fileId: number) => {
    setSelectedFileId(fileId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedFileId(null);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-ink mb-2 font-serif">我的书签</h2>
            <p className="text-ink-light font-serif">快速访问您标记的重要文档</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <FileCardSkeleton key={index} />
              ))
            ) : bookmarks.length > 0 ? (
              bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="relative group"
                >
                  <FileCard
                    id={bookmark.file.id}
                    title={bookmark.file.filename}
                    category={bookmark.file.categories.map(c => c.name).join(', ') || '未分类'}
                    onClick={() => handleFileCardClick(bookmark.file.id)}
                  />
                  <button
                    onClick={() => handleRemoveBookmark(bookmark.id)}
                    className="absolute top-3 right-12 p-2 bg-white/90 rounded-lg shadow-sm
                             opacity-0 group-hover:opacity-100 transition-opacity
                             hover:bg-red-50 text-red-500 hover:text-red-700"
                    title="移除书签"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                  </button>
                  {bookmark.note && (
                    <div className="absolute bottom-3 left-3 right-3 p-2 bg-white/95 rounded-lg shadow-sm
                                    opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-gray-500 truncate">{bookmark.note}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="text-6xl mb-4">📑</div>
                <p className="text-ink-light text-lg font-serif">还没有添加任何书签</p>
                <p className="text-ink-light font-serif">点击文件详情页的收藏按钮添加书签</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <FileDetailModal
        fileId={selectedFileId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default BookmarksPage;
