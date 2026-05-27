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
  last_accessed_at?: string;
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

interface QuickAction {
  id: string;
  icon: string;
  title: string;
  description: string;
  action: () => void;
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
  const [uploadProgress, setUploadProgress] = useState<{ fileId: number; message: string; percentage: number } | null>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
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
      const fileData = response.data.results || response.data;
      
      fileData.forEach((file: FileItem, index: number) => {
        if (!file.last_accessed_at) {
          file.last_accessed_at = new Date(Date.now() - index * 3600000).toISOString();
        }
      });
      
      setFiles(fileData);
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

  const recentFiles = [...files].sort((a, b) => 
    new Date(b.last_accessed_at || b.updated_at).getTime() - new Date(a.last_accessed_at || a.updated_at).getTime()
  ).slice(0, 4);

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
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress({
              fileId: 0,
              message: '上传中...',
              percentage: percentCompleted
            });
          }
        }
      });

      const fileId = response.data.id;
      setUploadSuccess(`文件 "${file.name}" 上传成功！正在生成AI摘要...`);
      setUploadProgress({
        fileId,
        message: '处理中...',
        percentage: 30
      });
      
      const interval = window.setInterval(async () => {
        try {
          const progressResponse = await axios.get(`${API_BASE}/files/files/${fileId}/`, {
            headers: { Authorization: `Token ${token}` }
          });
          const fileData = progressResponse.data;
          
          if (fileData.process_status === 'completed') {
            if (pollingInterval) clearInterval(pollingInterval);
            setPollingInterval(null);
            setPollingFileId(null);
            setUploadProgress({ fileId, message: '完成！', percentage: 100 });
            setUploadSuccess(`文件 "${file.name}" 处理完成！AI摘要已生成。`);
            setTimeout(() => {
              setUploadSuccess(null);
              setUploadProgress(null);
            }, 3000);
            fetchFiles();
          } else if (fileData.process_status === 'failed') {
            if (pollingInterval) clearInterval(pollingInterval);
            setPollingInterval(null);
            setPollingFileId(null);
            setUploadProgress(null);
            setUploadError(`文件处理失败: ${fileData.process_message || '未知错误'}`);
            setTimeout(() => setUploadError(null), 5000);
          } else {
            setUploadProgress({
              fileId,
              message: fileData.process_message || '处理中...',
              percentage: Math.min(90, 30 + Math.floor(Math.random() * 10))
            });
          }
        } catch (error) {
          console.error('轮询进度失败:', error);
        }
      }, 2000);
      
      setPollingInterval(interval);
    } catch (error: any) {
      console.error('上传文件失败:', error);
      setUploadProgress(null);
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
    setFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, last_accessed_at: new Date().toISOString() }
        : file
    ));
    setSelectedFileId(fileId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedFileId(null);
  };

  const quickActions: QuickAction[] = [
    {
      id: 'upload',
      icon: '📤',
      title: '快速上传',
      description: '拖拽文件到这里或点击上传',
      action: () => document.querySelector('.upload-zone-trigger')?.click()
    },
    {
      id: 'search',
      icon: '🔍',
      title: '智能搜索',
      description: '在所有文档中搜索内容',
      action: () => setShowSearch(true)
    },
    {
      id: 'mindmap',
      icon: '🧠',
      title: '思维导图',
      description: '查看最新文档的知识图谱',
      action: () => files.length > 0 && handleFileCardClick(files[0].id)
    }
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-3xl font-bold text-ink font-serif">我的知识库</h2>
              <button
                onClick={() => {
                  setShowSearch(!showSearch);
                  setSelectedResult(null);
                }}
                className={`px-6 py-3 rounded-xl font-serif transition-all duration-300 flex items-center gap-2 ${
                  showSearch
                    ? 'bg-leather text-white shadow-lg'
                    : 'bg-paper-dark text-ink border border-paper hover:border-leather/50'
                }`}
              >
                {showSearch ? '← 返回藏书' : '🔍 搜索文档'}
              </button>
            </div>
            <p className="text-ink-light font-serif">整理您的知识，让AI帮您发现更多</p>
          </div>

          <AnimatePresence mode="wait">
            {uploadError && (
              <motion.div 
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl shadow-md"
              >
                <div className="flex items-center gap-3">
                  <motion.span 
                    className="text-2xl"
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    ❌
                  </motion.span>
                  <span className="font-serif text-sm">{uploadError}</span>
                  <button 
                    onClick={() => setUploadError(null)}
                    className="ml-auto text-red-400 hover:text-red-600 text-sm"
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            )}

            {uploadSuccess && (
              <motion.div 
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl shadow-md"
              >
                <div className="flex items-center gap-3">
                  <motion.span 
                    className="text-2xl"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.3 }}
                  >
                    ✅
                  </motion.span>
                  <span className="font-serif text-sm">{uploadSuccess}</span>
                  <button 
                    onClick={() => setUploadSuccess(null)}
                    className="ml-auto text-green-400 hover:text-green-600 text-sm"
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            )}

            {uploadProgress && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-md"
              >
                <div className="mb-2 flex items-center gap-3">
                  <motion.span 
                    className="text-2xl"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    🔄
                  </motion.span>
                  <span className="font-serif text-sm text-blue-700">{uploadProgress.message}</span>
                  <motion.span 
                    className="font-serif text-sm text-blue-600 font-bold ml-auto"
                    key={uploadProgress.percentage}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                  >
                    {uploadProgress.percentage}%
                  </motion.span>
                </div>
                <div className="w-full h-3 bg-blue-100 rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress.percentage}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {showSearch ? (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <SearchBar onResultClick={handleSearchResultClick} />
            </motion.div>
          ) : (
            <>
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-ink-light mb-3 uppercase tracking-wider font-serif flex items-center gap-2">
                  <span className="w-1 h-4 bg-leather rounded-full"></span>
                  快速操作
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {quickActions.map((action, index) => (
                    <motion.button
                      key={action.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={action.action}
                      className="group p-5 bg-paper border border-paper rounded-xl text-left hover:border-leather/40 hover:shadow-lg hover:shadow-leather/5 transition-all duration-300 relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-leather/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative">
                        <motion.div 
                          className="text-3xl mb-2 inline-block"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          {action.icon}
                        </motion.div>
                        <h4 className="font-bold text-ink mb-1 font-serif group-hover:text-leather transition-colors">{action.title}</h4>
                        <p className="text-sm text-ink-light font-serif">{action.description}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {recentFiles.length > 0 && (
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold text-ink-light uppercase tracking-wider font-serif flex items-center gap-2">
                      <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                      最近使用
                    </h3>
                    <span className="text-xs text-ink-light font-serif">{recentFiles.length} 个文档</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {recentFiles.map((file, index) => (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ y: -4, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleFileCardClick(file.id)}
                        className="group p-4 bg-paper border border-paper rounded-xl cursor-pointer hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/10 transition-all duration-300"
                      >
                        <div className="flex items-start gap-3">
                          <motion.div 
                            className="text-2xl mb-2 flex-shrink-0"
                            whileHover={{ scale: 1.1, rotate: 3 }}
                          >
                            📄
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-ink mb-1 font-serif text-sm truncate group-hover:text-blue-600 transition-colors">
                              {file.filename}
                            </h4>
                            <p className="text-xs text-ink-light font-serif">
                              {new Date(file.last_accessed_at || file.updated_at).toLocaleDateString('zh-CN', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        <motion.div 
                          className="mt-3 h-1 bg-paper-dark rounded-full overflow-hidden"
                          initial={{ scaleX: 0 }}
                          whileHover={{ scaleX: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600"></div>
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-8 upload-zone-trigger">
                <h3 className="text-sm font-semibold text-ink-light mb-3 uppercase tracking-wider font-serif flex items-center gap-2">
                  <span className="w-1 h-4 bg-green-500 rounded-full"></span>
                  添加新文档
                </h3>
                <UploadZone onUpload={handleUpload} />
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-ink-light uppercase tracking-wider font-serif flex items-center gap-2">
                    <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                    全部文档
                  </h3>
                  <span className="text-xs text-ink-light font-serif">{files.length} 个文档</span>
                </div>
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
                            delay: index * 0.03 
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
                      className="col-span-full text-center py-20"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <motion.div 
                        className="text-8xl mb-6 inline-block"
                        animate={{ 
                          y: [0, -10, 0],
                          scale: [1, 1.05, 1]
                        }}
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity, 
                          ease: 'easeInOut' 
                        }}
                      >
                        📚
                      </motion.div>
                      <motion.h3 
                        className="text-2xl font-bold text-ink mb-3 font-serif"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        您的知识库还是一片空白
                      </motion.h3>
                      <motion.p 
                        className="text-ink-light font-serif mb-8 max-w-md mx-auto"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        上传文档，让AI帮您梳理知识脉络，发现隐藏的关联，构建属于您的知识图谱
                      </motion.p>
                      <motion.button
                        onClick={() => {
                          document.querySelector('.upload-zone-trigger')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white rounded-xl font-serif font-semibold hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 shadow-lg"
                      >
                        <span className="flex items-center gap-2">
                          🚀 开始上传文档
                        </span>
                      </motion.button>
                      <motion.div 
                        className="mt-8 flex justify-center gap-8 text-sm text-ink-light"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span className="font-serif">支持 PDF、Word、图片</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          <span className="font-serif">AI自动摘要</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                          <span className="font-serif">智能思维导图</span>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </div>
              </div>
            </>
          )}

          {selectedResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedResult(null)}
            >
              <div className="bg-paper max-w-2xl w-full max-h-[80vh] overflow-y-auto rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-paper">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-ink font-serif">{selectedResult.filename}</h3>
                    <button
                      onClick={() => setSelectedResult(null)}
                      className="text-ink-light hover:text-ink transition-colors text-xl"
                    >
                      ✕
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
                      <h4 className="font-bold text-ink mb-2 font-serif">🤖 AI 摘要</h4>
                      <p className="text-ink-light leading-relaxed font-serif text-sm">{selectedResult.ai_summary}</p>
                    </div>
                  )}
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => handleFileCardClick(selectedResult.id)}
                      className="flex-1 px-4 py-2 bg-leather text-white rounded-xl font-serif hover:opacity-90 transition-opacity"
                    >
                      查看详情
                    </button>
                    <button
                      onClick={() => setSelectedResult(null)}
                      className="px-4 py-2 bg-paper-dark border border-paper text-ink rounded-xl font-serif hover:bg-paper/50 transition-colors"
                    >
                      关闭
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
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
