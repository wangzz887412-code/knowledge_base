import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { MindMapViewer } from './MindMapViewer';
import { CanvasNotes } from './CanvasNotes';
import { MarkdownRenderer } from './MarkdownRenderer';

const API_BASE = 'http://localhost:8000/api';

interface FileDetail {
  id: number;
  filename: string;
  file_type: string;
  file_size: number;
  categories: Array<{ id: number; name: string; color: string }>;
  keywords: string[];
  status: string;
  process_status: string;
  process_progress: number;
  process_message: string;
  extracted_text: string;
  ai_summary: string;
  mindmap_data: Record<string, unknown> | null;
  notes: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface FileDetailModalProps {
  fileId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

type TabType = 'info' | 'mindmap' | 'notes';

interface MindMapData {
  id: string;
  label: string;
  children?: MindMapData[];
}

export const FileDetailModal: React.FC<FileDetailModalProps> = ({ fileId, isOpen, onClose, onUpdate }) => {
  const { token } = useAuth();
  const [fileDetail, setFileDetail] = useState<FileDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkNote, setBookmarkNote] = useState('');

  useEffect(() => {
    if (isOpen && fileId) {
      fetchFileDetail(fileId);
      checkBookmark(fileId);
    }
  }, [isOpen, fileId]);

  const fetchFileDetail = async (id: number) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/files/files/${id}/`, {
        headers: token ? { Authorization: `Token ${token}` } : {}
      });
      setFileDetail(response.data);
    } catch (error) {
      console.error('获取文件详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkBookmark = async (id: number) => {
    try {
      const response = await axios.get(`${API_BASE}/files/bookmarks/`, {
        headers: token ? { Authorization: `Token ${token}` } : {}
      });
      const bookmarks = response.data;
      const bookmarked = bookmarks.some((b: { file: { id: number } }) => b.file.id === id);
      setIsBookmarked(bookmarked);
    } catch (error) {
      console.error('检查书签失败:', error);
    }
  };

  const handleSaveNotes = async (notesData: string) => {
    if (!fileId) return;
    try {
      await axios.patch(`${API_BASE}/files/files/${fileId}/notes/`, { notes: notesData }, {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (fileDetail) {
        setFileDetail({ ...fileDetail, notes: notesData });
      }
      onUpdate?.();
    } catch (error) {
      console.error('保存笔记失败:', error);
    }
  };

  const handleToggleBookmark = async () => {
    if (!fileId) {
      alert('文件ID无效');
      return;
    }
    
    try {
      if (isBookmarked) {
        const response = await axios.get(`${API_BASE}/files/bookmarks/`, {
          headers: { Authorization: `Token ${token}` }
        });
        console.log('书签列表:', response.data);
        
        const bookmark = response.data.find((b: { file: { id: number } }) => b.file.id === fileId);
        if (bookmark) {
          const deleteResponse = await axios.delete(`${API_BASE}/files/bookmarks/${bookmark.id}/`, {
            headers: { Authorization: `Token ${token}` }
          });
          console.log('删除响应:', deleteResponse.data);
          if (deleteResponse.data.success) {
            setIsBookmarked(false);
            onUpdate?.();
          } else {
            alert(deleteResponse.data.error || '取消收藏失败');
          }
        } else {
          alert('未找到书签记录');
        }
      } else {
        const postData = { file: fileId.toString(), note: bookmarkNote };
        console.log('发送数据:', postData);

        const response = await axios.post(`${API_BASE}/files/bookmarks/`, postData, {
          headers: {
            Authorization: `Token ${token}`
          }
        });
        console.log('创建响应:', response.data);

        if (response.data.success) {
          setIsBookmarked(true);
          onUpdate?.();
        } else {
          alert(response.data.error || '收藏失败');
        }
      }
    } catch (error: any) {
      console.error('操作书签失败:', error);
      const errorMsg = error.response?.data?.error || error.message || '操作失败，请重试';
      alert(errorMsg);
    }
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
        
        <motion.div
          className="relative bg-[#FFFEF9] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border-2 border-[#E5DDD0]"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
        <div className="flex items-center justify-between p-6 border-b-2 border-[#E5DDD0]">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-[#3D2914] font-serif">
              {fileDetail?.filename || '文件详情'}
            </h2>
            {fileDetail && (
              <p className="text-sm text-[#8B7355] font-serif mt-1">
                上传于 {formatDate(fileDetail.created_at)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={bookmarkNote}
                onChange={(e) => setBookmarkNote(e.target.value)}
                placeholder="书签备注"
                className="px-3 py-2 bg-[#F5EDE0] border border-[#E5DDD0] rounded-lg text-sm font-serif w-32"
              />
              <button
                onClick={handleToggleBookmark}
                className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                  isBookmarked ? 'bg-[#10A37F]' : 'bg-gray-300'
                }`}
                title={isBookmarked ? '点击取消收藏' : '点击添加收藏'}
              >
                <span
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${
                    isBookmarked ? 'left-8' : 'left-1'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isBookmarked ? '#10A37F' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </span>
              </button>
              <span className={`text-sm font-medium ${isBookmarked ? 'text-[#10A37F]' : 'text-gray-500'}`}>
                {isBookmarked ? '已收藏' : '未收藏'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-[#8B7355] hover:text-[#3D2914] text-2xl transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex border-b-2 border-[#E5DDD0]">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-6 py-3 font-serif transition-all ${
              activeTab === 'info'
                ? 'text-[#D4A574] border-b-2 border-[#D4A574] bg-[#F5EDE0]'
                : 'text-[#8B7355] hover:text-[#3D2914]'
            }`}
          >
            📋 AI摘要
          </button>
          <button
            onClick={() => setActiveTab('mindmap')}
            className={`px-6 py-3 font-serif transition-all ${
              activeTab === 'mindmap'
                ? 'text-[#D4A574] border-b-2 border-[#D4A574] bg-[#F5EDE0]'
                : 'text-[#8B7355] hover:text-[#3D2914]'
            }`}
          >
            🧠 思维导图
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-6 py-3 font-serif transition-all ${
              activeTab === 'notes'
                ? 'text-[#D4A574] border-b-2 border-[#D4A574] bg-[#F5EDE0]'
                : 'text-[#8B7355] hover:text-[#3D2914]'
            }`}
          >
            ✏️ 笔记
          </button>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 230px)' }}>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-[#8B7355] font-serif">加载中...</div>
            </div>
          ) : (
            <React.Fragment>
              {activeTab === 'info' && fileDetail && (
                <div className="space-y-6 animate-fadeIn max-w-4xl">
                  {fileDetail.ai_summary && (
                    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-9 h-9 bg-gradient-to-br from-[#10A37F] to-[#0E8F6E] rounded-xl flex items-center justify-center flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                            <path d="m9.5 17 5-5 5 5"></path>
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">AI 摘要</div>
                          <p className="text-xs text-gray-500">由 AI 生成 · {fileDetail.ai_summary.length} 字符</p>
                        </div>
                      </div>
                      <MarkdownRenderer content={fileDetail.ai_summary} />
                    </div>
                  )}

                  {fileDetail.keywords && fileDetail.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {fileDetail.keywords.map((kw: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-[#F5EDE0] text-[#3D2914] rounded-full text-sm font-serif border border-[#E5DDD0] hover:bg-[#E5DDD0] transition-colors"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#F5EDE0] rounded-xl p-4 border border-[#E5DDD0]">
                      <div className="text-xs text-[#8B7355] mb-1">文件类型</div>
                      <div className="font-semibold text-[#3D2914] font-serif">{fileDetail.file_type}</div>
                    </div>
                    <div className="bg-[#F5EDE0] rounded-xl p-4 border border-[#E5DDD0]">
                      <div className="text-xs text-[#8B7355] mb-1">文件大小</div>
                      <div className="font-semibold text-[#3D2914] font-serif">{formatFileSize(fileDetail.file_size)}</div>
                    </div>
                    <div className="bg-[#F5EDE0] rounded-xl p-4 border border-[#E5DDD0]">
                      <div className="text-xs text-[#8B7355] mb-1">状态</div>
                      <div className="font-semibold text-[#3D2914] font-serif">
                        {fileDetail.status === 'ready' ? '✓ 已处理' :
                         fileDetail.status === 'processing' ? '⏳ 处理中' :
                         fileDetail.status === 'error' ? '✕ 处理失败' : '📤 上传中'}
                      </div>
                    </div>
                    <div className="bg-[#F5EDE0] rounded-xl p-4 border border-[#E5DDD0]">
                      <div className="text-xs text-[#8B7355] mb-1">更新时间</div>
                      <div className="font-semibold text-[#3D2914] font-serif text-sm">
                        {formatDate(fileDetail.updated_at)}
                      </div>
                    </div>
                  </div>

                  {fileDetail.categories.length > 0 && (
                    <div className="bg-[#F5EDE0] rounded-xl p-4 border border-[#E5DDD0]">
                      <div className="text-sm text-[#8B7355] mb-2">分类标签</div>
                      <div className="flex flex-wrap gap-2">
                        {fileDetail.categories.map((cat) => (
                          <span
                            key={cat.id}
                            className="px-3 py-1 rounded-full text-sm"
                            style={{ backgroundColor: cat.color + '20', color: cat.color }}
                          >
                            {cat.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'mindmap' && (
                <div className="animate-fadeIn" style={{ height: '500px' }}>
                  <MindMapViewer
                    data={(fileDetail?.mindmap_data as unknown as MindMapData) || null}
                    fileId={fileId?.toString()}
                    onNodeClick={() => {}}
                  />
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="animate-fadeIn h-full">
                  <CanvasNotes
                    fileId={fileId}
                    savedNotes={fileDetail?.notes || ''}
                    onSave={handleSaveNotes}
                  />
                </div>
              )}

            </React.Fragment>
          )}
        </div>

        {fileDetail && fileDetail.process_status !== 'completed' && (
          <div className="absolute bottom-0 left-0 right-0 bg-[#FFFEF9] border-t-2 border-[#E5DDD0] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-serif text-[#8B7355]">
                {fileDetail.process_message || '处理中...'}
              </span>
              <span className="text-sm font-serif text-[#10A37F]">
                {fileDetail.process_progress}%
              </span>
            </div>
            <div className="w-full h-2 bg-[#E5DDD0] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#10A37F] to-[#10B981] transition-all duration-300 ease-out"
                style={{ width: `${fileDetail.process_progress}%` }}
              />
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
    </AnimatePresence>
  );
};

export default FileDetailModal;
