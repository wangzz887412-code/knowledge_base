import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { FileCard, FileCardSkeleton } from '../components/FileCard';
import { UploadZone } from '../components/UploadZone';
import { SearchBar } from '../components/SearchBar';
import { FileDetailModal } from '../components/FileDetailModal';

const API_BASE = 'http://localhost:8000/api';

interface FileItem {
  id: number;
  filename: string;
  file_type: string;
  file_size: number;
  categories: Array<{ id: number; name: string; color: string }>;
  status: string;
  extracted_text: string;
  ai_summary: string;
  created_at: string;
  updated_at: string;
}

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
}

const Dashboard: React.FC = () => {
  const { token } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [pollingFileId, setPollingFileId] = useState<number | null>(null);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
    // 清理轮询
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const fetchFiles = async () => {
    try {
      const response = await axios.get(`${API_BASE}/files/files/`, {
        headers: token ? { Authorization: `Token ${token}` } : {}
      });
      setFiles(response.data.results || response.data);
    } catch (error: any) {
      console.error('获取文件列表失败:', error);
      if (error.response?.status === 401) {
        setUploadError('请先登录');
      } else {
        setUploadError('获取文件列表失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (!token) {
      setUploadError('请先登录');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadError(null);
      setUploadSuccess(null);
      const response = await axios.post(`${API_BASE}/files/files/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Token ${token}`,
        },
      });

      const fileId = response.data.id;
      setUploadSuccess(`文件 "${file.name}" 上传成功！正在生成AI摘要...`);
      
      // 开始轮询进度
      setPollingFileId(fileId);
      const interval = window.setInterval(async () => {
        try {
          const progressResponse = await axios.get(`${API_BASE}/files/files/${fileId}/`, {
            headers: { Authorization: `Token ${token}` }
          });
          const fileData = progressResponse.data;
          
          if (fileData.process_status === 'completed') {
            // 处理完成
            if (pollingInterval) clearInterval(pollingInterval);
            setPollingInterval(null);
            setPollingFileId(null);
            setUploadSuccess(`文件 "${file.name}" 处理完成！AI摘要已生成。`);
            setTimeout(() => {
              setUploadSuccess(null);
            }, 3000);
            fetchFiles();
          } else if (fileData.process_status === 'failed') {
            // 处理失败
            if (pollingInterval) clearInterval(pollingInterval);
            setPollingInterval(null);
            setPollingFileId(null);
            setUploadError(`文件处理失败: ${fileData.process_message || '未知错误'}`);
            setTimeout(() => setUploadError(null), 5000);
          } else {
            // 更新进度消息
            setUploadSuccess(`文件 "${file.name}" ${fileData.process_message || '处理中...'}`);
          }
        } catch (error) {
          console.error('轮询进度失败:', error);
        }
      }, 2000);
      
      setPollingInterval(interval);
    } catch (error: any) {
      console.error('上传文件失败:', error);
      if (error.response?.status === 401) {
        setUploadError('登录已过期，请重新登录');
      } else {
        const errorMsg = error.response?.data?.detail || error.response?.data?.error || '上传失败，请稍后重试';
        setUploadError(errorMsg);
      }
      setTimeout(() => setUploadError(null), 5000);
    }
  };

  const handleSearchResultClick = (result: SearchResult) => {
    setSelectedResult(result);
    setShowSearch(false);
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
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-ink mb-2 font-serif">我的藏书</h2>
              <p className="text-ink-light font-serif">管理您的知识文档</p>
            </div>
            <button
              onClick={() => {
                setShowSearch(!showSearch);
                setSelectedResult(null);
              }}
              className={`px-6 py-3 rounded-xl font-serif transition-all duration-300 ${
                showSearch
                  ? 'bg-leather text-white shadow-lg'
                  : 'bg-paper-dark text-ink border border-paper hover:border-leather/50'
              }`}
            >
              {showSearch ? '← 返回藏书' : '🔍 搜索文档'}
            </button>
          </div>

          {uploadError && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg animate-shake">
              <div className="flex items-center gap-2">
                <span className="text-xl">❌</span>
                <span className="font-serif">{uploadError}</span>
              </div>
            </div>
          )}

          {uploadSuccess && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="text-xl">✅</span>
                <span className="font-serif">{uploadSuccess}</span>
              </div>
            </div>
          )}

          {selectedResult && (
            <div className="mb-8 p-6 bg-gold/10 border-l-4 border-gold rounded-r-xl">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-ink font-serif">{selectedResult.filename}</h3>
                <button
                  onClick={() => setSelectedResult(null)}
                  className="text-ink-light hover:text-ink transition-colors"
                >
                  ✕ 关闭
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-sm font-semibold text-ink-light">类型：</span>
                  <span className="text-ink font-serif">{selectedResult.file_type}</span>
                </div>
                <div>
                  <span className="text-sm font-semibold text-ink-light">大小：</span>
                  <span className="text-ink font-serif">
                    {(selectedResult.file_size / 1024).toFixed(2)} KB
                  </span>
                </div>
                <div>
                  <span className="text-sm font-semibold text-ink-light">上传时间：</span>
                  <span className="text-ink font-serif">
                    {new Date(selectedResult.created_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-semibold text-ink-light">分类：</span>
                  <div className="inline-flex gap-1 ml-2">
                    {selectedResult.categories.map((cat) => (
                      <span
                        key={cat.id}
                        className="px-2 py-1 rounded-full text-xs"
                        style={{ backgroundColor: cat.color + '20', color: cat.color }}
                      >
                        {cat.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              {selectedResult.ai_summary && (
                <div className="mt-4 pt-4 border-t border-paper">
                  <h4 className="font-bold text-ink mb-2 font-serif">AI 摘要</h4>
                  <p className="text-ink-light leading-relaxed font-serif">{selectedResult.ai_summary}</p>
                </div>
              )}
            </div>
          )}

          {showSearch ? (
            <div className="animate-fadeIn">
              <SearchBar onResultClick={handleSearchResultClick} />
            </div>
          ) : (
            <>
              <div className="mb-8">
                <UploadZone onUpload={handleUpload} />
              </div>

              <div>
                <h3 className="text-xl font-bold text-ink mb-4 font-serif">文档列表</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                      <FileCardSkeleton key={index} />
                    ))
                  ) : files.length > 0 ? (
                    <AnimatePresence mode="popLayout">
                      {files.map((file, index) => (
                        <motion.div
                          key={file.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ 
                            type: 'spring', 
                            stiffness: 300, 
                            damping: 30,
                            delay: index * 0.05 
                          }}
                        >
                          <FileCard
                            id={file.id}
                            title={file.filename}
                            category={file.categories.map(c => c.name).join(', ') || '未分类'}
                            aiSummary={file.ai_summary}
                            tags={file.categories}
                            onClick={() => handleFileCardClick(file.id)}
                            onDelete={fetchFiles}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  ) : (
                    <motion.div 
                      className="col-span-full text-center py-12"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="text-6xl mb-4">📭</div>
                      <p className="text-ink-light text-lg font-serif">还没有上传任何文档</p>
                    </motion.div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <FileDetailModal
        fileId={selectedFileId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUpdate={fetchFiles}
      />
    </div>
  );
};

export default Dashboard;
