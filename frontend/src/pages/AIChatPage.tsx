import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = 'http://localhost:8000/api';

interface ThinkingProcessProps {
  thinking: string;
  isEnabled: boolean;
}

const ThinkingProcess: React.FC<ThinkingProcessProps> = ({ thinking, isEnabled }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isEnabled) return null;

  return (
    <div className="w-full">
      <motion.div
        className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl overflow-hidden"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-amber-100/50 transition-colors"
        >
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#F59E0B" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M9.37 17a8 8 0 1 0 8.27-13"/>
              <path d="M9.3 7a4 4 0 1 0 4.3 6"/>
            </svg>
          </div>
          <div className="flex-1 text-left">
            <span className="text-sm font-medium text-amber-800">💡 思考过程</span>
          </div>
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </motion.svg>
        </button>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pl-15">
                <div className="pl-12">
                  <div className="bg-white/50 rounded-lg p-4 border border-amber-100">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="14" 
                          height="14" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="#F59E0B" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M12 6v6l4 2"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {thinking}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  file_ids: number[];
  created_at: string;
  thinking?: string;
  thinking_enabled?: boolean;
}

interface FileItem {
  id: number;
  filename: string;
  selected: boolean;
  file?: string;
  size?: number;
  file_type?: string;
}

interface KbDocItem {
  id: number;
  filename: string;
  ai_summary: string;
  extracted_text: string;
  file_type: string;
}

interface ChatHistoryItem {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

interface AIModel {
  model_id: string;
  name: string;
  provider: string;
  supports_vision: boolean;
  requires_api_key: boolean;
  supports_thinking?: boolean;
  context_window?: number;
  max_tokens?: number;
}

const AIChatPage: React.FC = () => {
  const { token } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modelInfo, setModelInfo] = useState({ model: 'glm-4-flash-250414', name: 'GLM-4-Flash-250414' });
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [chatHistories, setChatHistories] = useState<ChatHistoryItem[]>([]);
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [capabilityWarning, setCapabilityWarning] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [kbDocs, setKbDocs] = useState<KbDocItem[]>([]);
  const [selectedKbDocs, setSelectedKbDocs] = useState<number[]>([]);
  const [showKbSelector, setShowKbSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFiles();
    fetchModelInfo();
    fetchChatHistories();
    fetchKbDocs();
    
    // 检查URL参数中是否有doc_id，如果有则自动选择对应的知识库文档
    const params = new URLSearchParams(window.location.search);
    const docId = params.get('doc_id');
    if (docId) {
      const docIdNum = parseInt(docId, 10);
      // 延迟一下，等待知识库文档加载完成
      setTimeout(() => {
        if (kbDocs.some(doc => doc.id === docIdNum)) {
          setSelectedKbDocs([docIdNum]);
          // 显示一个提示
          setCapabilityWarning(`📄 已从知识库加载文档，您可以开始提问了！`);
          setTimeout(() => setCapabilityWarning(null), 4000);
        }
      }, 500);
    }
  }, [kbDocs]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchFiles = async () => {
    try {
      // 只获取AI助手自己的文件，不包含知识库文件
      const response = await axios.get(`${API_BASE}/files/files/?status=ready&source=ai_chat`, {
        headers: { Authorization: `Token ${token}` }
      });
      setFiles(response.data.map((file: { id: number; filename: string; file?: string; file_size?: number; file_type?: string }) => ({
        id: file.id,
        filename: file.filename,
        selected: false,
        file: file.file,
        size: file.file_size,
        file_type: file.file_type
      })));
    } catch (error) {
      console.error('获取文件列表失败:', error);
    }
  };

  const fetchKbDocs = async () => {
    try {
      const response = await axios.get(`${API_BASE}/files/files/?source=knowledge_base&page_size=100`, {
        headers: { Authorization: `Token ${token}` }
      });
      const docs = response.data.results || response.data;
      setKbDocs((Array.isArray(docs) ? docs : []).map((doc: { id: number; filename: string; ai_summary: string; extracted_text: string; file_type: string }) => ({
        id: doc.id,
        filename: doc.filename,
        ai_summary: doc.ai_summary,
        extracted_text: doc.extracted_text,
        file_type: doc.file_type
      })));
    } catch (error) {
      console.error('获取知识库文档失败:', error);
    }
  };

  const fetchModelInfo = async () => {
    try {
      const response = await axios.get(`${API_BASE}/ai/config/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setModelInfo({
        model: response.data.config.chat_model_id,
        name: response.data.config.chat_model_name || response.data.current_model?.name || 'AI助手'
      });
      setAvailableModels(response.data.available_models || []);
    } catch (error) {
      console.error('获取AI配置失败:', error);
    }
  };

  const fetchChatHistories = async () => {
    try {
      const response = await axios.get(`${API_BASE}/ai/chat/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setChatHistories(response.data.chat_histories || []);
    } catch (error) {
      console.error('获取对话历史失败:', error);
    }
  };

  const fetchChatMessages = async (chatId: number) => {
    try {
      const response = await axios.get(`${API_BASE}/ai/chat/?chat_id=${chatId}`, {
        headers: { Authorization: `Token ${token}` }
      });
      setMessages(response.data.messages);
      setCurrentChatId(chatId);
    } catch (error) {
      console.error('获取对话消息失败:', error);
    }
  };

  const handleFileToggle = (fileId: number) => {
    if (selectedKbDocs.includes(fileId)) {
      setSelectedKbDocs(selectedKbDocs.filter(id => id !== fileId));
    } else {
      setSelectedKbDocs([...selectedKbDocs, fileId]);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setSelectedKbDocs([]);
    setInputMessage('');
  };

  const handleDeleteChat = async (chatId: number) => {
    if (!confirm('确定要删除这个对话吗？')) return;
    
    try {
      await axios.delete(`${API_BASE}/ai/chat/?chat_id=${chatId}`, {
        headers: { Authorization: `Token ${token}` }
      });
      setChatHistories(chatHistories.filter(ch => ch.id !== chatId));
      if (currentChatId === chatId) {
        handleNewChat();
      }
    } catch (error) {
      console.error('删除对话失败:', error);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!confirm('确定要删除这条消息吗？')) return;
    
    try {
      await axios.delete(`${API_BASE}/ai/chat/?message_id=${messageId}`, {
        headers: { Authorization: `Token ${token}` }
      });
      setMessages(messages.filter(m => m.id !== messageId));
    } catch (error) {
      console.error('删除消息失败:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadFiles = Array.from(e.target.files || []);
    if (uploadFiles.length === 0) return;
    
    // 检查当前模型是否支持视觉能力（如果有图片）
    const hasImages = uploadFiles.some(file => file.type.startsWith('image/'));
    if (hasImages) {
      const currentModel = availableModels.find(m => m.model_id === modelInfo.model);
      if (currentModel && !currentModel.supports_vision) {
        setCapabilityWarning('当前模型不支持视觉能力，建议切换到多模态模型（带V）以获得更好的体验。');
        setTimeout(() => setCapabilityWarning(null), 5000);
      }
    }
    
    setUploading(true);
    try {
      // 逐个上传文件，因为后端每次只接受一个文件
      const uploadedFileIds: number[] = [];
      for (const file of uploadFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('source', 'ai_chat'); // 标记为AI助手的文件
        
        const response = await axios.post(`${API_BASE}/files/files/`, formData, {
          headers: { 
            Authorization: `Token ${token}`
          }
        });
        
        if (response.data.id) {
          uploadedFileIds.push(response.data.id);
        }
      }
      
      // 如果是图片，预览图片
      const imageFiles = uploadFiles.filter(file => file.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        const imagePreviews = imageFiles.map(file => URL.createObjectURL(file));
        setUploadedImages(prev => [...prev, ...imagePreviews]);
      }
      
      // 刷新文件列表
      await fetchFiles();
      
      // 自动选择新上传的文件
      setSelectedFiles(prev => [...prev, ...uploadedFileIds]);
      
    } catch (error) {
      console.error('上传文件失败:', error);
      alert('上传失败，请重试');
    } finally {
      setUploading(false);
      // 清空文件输入
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...uploadedImages];
    newImages.splice(index, 1);
    setUploadedImages(newImages);
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm('确定要删除这个文件吗？')) return;
    
    try {
      await axios.delete(`${API_BASE}/files/files/${fileId}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      
      // 从文件列表中移除
      setFiles(files.filter(f => f.id !== fileId));
      // 从已选择列表中移除
      setSelectedFiles(selectedFiles.filter(id => id !== fileId));
      setSelectedKbDocs(selectedKbDocs.filter(id => id !== fileId));
      
      alert('文件已删除');
    } catch (error) {
      console.error('删除文件失败:', error);
      alert('删除失败，请重试');
    }
  };

  const handleDownloadFile = (file: FileItem) => {
    if (!file.file) {
      alert('文件路径不存在');
      return;
    }
    
    // 创建下载链接
    const link = document.createElement('a');
    link.href = file.file;
    link.download = file.filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleCopy = async (content: string, messageId: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'txt':
      case 'md':
        return '📃';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return '🖼️';
      default:
        return '📎';
    }
  };

  const getCurrentModel = () => {
    return availableModels.find(m => m.model_id === modelInfo.model);
  };

  const handleSend = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: messages.length + 1,
      role: 'user',
      content: inputMessage,
      file_ids: selectedFiles,
      created_at: new Date().toISOString()
    };

    setMessages([...messages, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE}/ai/chat/`,
        {
          message: inputMessage,
          file_ids: selectedFiles,
          chat_id: currentChatId,
          kb_doc_ids: selectedKbDocs
        },
        {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const assistantMessage: ChatMessage = {
        id: messages.length + 2,
        role: 'assistant',
        content: response.data.response,
        file_ids: selectedFiles,
        created_at: new Date().toISOString(),
        thinking: response.data.thinking || '',
        thinking_enabled: response.data.thinking_enabled || false
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (!currentChatId) {
        setCurrentChatId(response.data.chat_id);
      }
      
      fetchChatHistories();
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: messages.length + 2,
        role: 'assistant',
        content: '抱歉，处理您的请求时出现错误，请重试。',
        file_ids: [],
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return '今天';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨天';
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  const [modelChangeMessage, setModelChangeMessage] = useState<{show: boolean, text: string, type: 'success' | 'error'} | null>(null);
  
  const handleModelChange = async (modelId: string) => {
    try {
      const response = await axios.put(
        `${API_BASE}/ai/config/`,
        { chat_model_id: modelId },
        { headers: { Authorization: `Token ${token}` } }
      );
      if (response.data.success) {
        const selectedModel = availableModels.find(m => m.model_id === modelId);
        setModelInfo({
          model: modelId,
          name: selectedModel?.name || 'AI助手'
        });
        setShowModelSelector(false);
        setModelChangeMessage({
          show: true,
          text: `✓ 已切换到 ${selectedModel?.name}，设置已同步更新`,
          type: 'success'
        });
        setTimeout(() => setModelChangeMessage(null), 3000);
      }
    } catch (error) {
      console.error('切换模型失败:', error);
      setModelChangeMessage({
        show: true,
        text: '切换模型失败，请重试',
        type: 'error'
      });
      setTimeout(() => setModelChangeMessage(null), 3000);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-screen bg-[#F5F5F5] overflow-hidden">
      {/* 左侧边栏 - 对话历史 */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden">
        <div className="p-3 border-b border-gray-200 flex-shrink-0">
          <button
            onClick={handleNewChat}
            className="w-full py-3 px-4 bg-[#10A37F] text-white rounded-lg font-medium hover:bg-[#0E8F6E] transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            新对话
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
          {chatHistories.length > 0 ? (
            <div className="space-y-1">
              {chatHistories.map((chat) => (
                <motion.div
                  key={chat.id}
                  className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all group relative ${
                    currentChatId === chat.id
                      ? 'bg-gradient-to-r from-[#E8F5E9] to-[#F0FDF4] border border-[#10A37F]/30 shadow-sm'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                  onClick={() => fetchChatMessages(chat.id)}
                  whileHover={{ x: 2 }}
                  layout
                >
                  {currentChatId === chat.id && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#10A37F] rounded-r-full" />
                  )}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    currentChatId === chat.id ? 'bg-[#10A37F] shadow-sm' : 'bg-gray-100'
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={currentChatId === chat.id ? 'text-white' : 'text-gray-500'}>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate text-sm">{chat.title || '未命名对话'}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      {chat.message_count} 条消息 · {formatDate(chat.updated_at)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteChat(chat.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-all"
                    title="删除对话"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 bg-[#10A37F]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10A37F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                  <path d="m9.5 17 5-5 5 5"></path>
                </svg>
              </div>
              <p className="text-gray-500 text-sm">开始新对话</p>
              <p className="text-gray-400 text-xs mt-1">点击上方按钮开始与AI助手交流</p>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={() => setShowFileSelector(!showFileSelector)}
            className="w-full py-2 px-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 flex items-center justify-between transition-all"
          >
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              参考文档
              {selectedKbDocs.length > 0 && (
                <span className="bg-[#10A37F] text-white text-xs px-2 py-0.5 rounded-full">
                  {selectedKbDocs.length}
                </span>
              )}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showFileSelector ? 'rotate-180' : ''}`}>
              <path d="m6 9 6 6 6-6"></path>
            </svg>
          </button>
          
          {showFileSelector && (
            <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
              {files.map((file) => (
                <button
                  key={file.id}
                  onClick={() => handleFileToggle(file.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                    selectedKbDocs.includes(file.id)
                      ? 'bg-[#10A37F] text-white'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                  <span className="truncate">{file.filename}</span>
                  {selectedKbDocs.includes(file.id) && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </button>
              ))}
              {files.length === 0 && (
                <p className="text-center text-gray-400 text-xs py-4">暂无文档</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 中间聊天区域 */}
      <div className="flex-1 flex flex-col">
        {/* 模型切换提示 */}
        <AnimatePresence>
          {modelChangeMessage?.show && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`absolute top-2 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg border-l-4 ${
                modelChangeMessage.type === 'success'
                  ? 'bg-green-50 border-green-500 text-green-700'
                  : 'bg-red-50 border-red-500 text-red-700'
              }`}
            >
              <p className="text-sm font-medium">{modelChangeMessage.text}</p>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-[#10A37F] to-[#0E8F6E] rounded-xl flex items-center justify-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                  <path d="m9.5 17 5-5 5 5"></path>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-gray-900">AI 助手</h2>
                  {(() => {
                    const cm = getCurrentModel();
                    return cm ? (
                      <div className="flex items-center gap-1">
                        {cm.context_window && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                            {(cm.context_window / 1000).toFixed(0)}K
                          </span>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
                <p className="text-xs text-gray-500">{modelInfo.name}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="px-3 py-1.5 bg-[#10A37F]/10 text-[#10A37F] rounded-full text-xs font-medium flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>{modelInfo.name}</span>
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                animate={{ rotate: showModelSelector ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </motion.svg>
            </motion.button>
            
            <AnimatePresence>
              {showModelSelector && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-6 top-14 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 min-w-[320px] max-h-[400px] overflow-y-auto"
                >
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">选择AI模型</p>
                  </div>
                  
                  {/* 多模态模型（带V）*/}
                  {availableModels.filter(m => m.supports_vision).length > 0 && (
                    <>
                      <div className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                        <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                          <span>🎨</span> 多模态模型（带V）
                        </p>
                        <p className="text-[10px] text-blue-400">适合看图说话、视觉问答</p>
                      </div>
                      {availableModels.filter(m => m.supports_vision).map((model) => (
                        <motion.button
                          key={model.model_id}
                          onClick={() => handleModelChange(model.model_id)}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                            modelInfo.model === model.model_id ? 'bg-[#10A37F]/5' : ''
                          }`}
                          whileHover={{ x: 4 }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{model.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-gray-500">{model.provider}</p>
                                {model.supports_thinking && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">🧠 思考</span>
                                )}
                                <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">👁️ 视觉</span>
                                {model.context_window && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full" title="上下文窗口">
                                    {(model.context_window / 1000).toFixed(0)}K
                                  </span>
                                )}
                              </div>
                            </div>
                            {modelInfo.model === model.model_id && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="px-2 py-0.5 bg-[#10A37F] text-white text-xs rounded-full"
                              >
                                当前
                              </motion.span>
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </>
                  )}
                  
                  {/* 纯文本模型 */}
                  {availableModels.filter(m => !m.supports_vision).length > 0 && (
                    <>
                      <div className="px-3 py-1.5 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 mt-1">
                        <p className="text-xs text-gray-600 font-medium flex items-center gap-1">
                          <span>📝</span> 纯文本模型
                        </p>
                        <p className="text-[10px] text-gray-400">适合写代码、对话、文本处理</p>
                      </div>
                      {availableModels.filter(m => !m.supports_vision).map((model) => (
                        <motion.button
                          key={model.model_id}
                          onClick={() => handleModelChange(model.model_id)}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                            modelInfo.model === model.model_id ? 'bg-[#10A37F]/5' : ''
                          }`}
                          whileHover={{ x: 4 }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{model.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-gray-500">{model.provider}</p>
                                {model.supports_thinking && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">🧠 思考</span>
                                )}
                                {model.context_window && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full" title="上下文窗口">
                                    {(model.context_window / 1000).toFixed(0)}K
                                  </span>
                                )}
                              </div>
                            </div>
                            {modelInfo.model === model.model_id && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="px-2 py-0.5 bg-[#10A37F] text-white text-xs rounded-full"
                              >
                                当前
                              </motion.span>
                            )}
                          </div>
                          {!model.requires_api_key && (
                            <span className="text-xs text-green-600 mt-1 inline-block">✓ 本地模型，无需API密钥</span>
                          )}
                        </motion.button>
                      ))}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            
            <button
              onClick={handleNewChat}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-all flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              新对话
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-sm text-gray-700 transition-all flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"></path>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              返回
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          {messages.length > 0 ? (
            <div className="max-w-3xl mx-auto space-y-6">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 300, 
                      damping: 30,
                      delay: index === messages.length - 1 ? 0 : 0
                    }}
                    className={`flex items-start ${message.role === 'user' ? 'justify-end' : 'justify-start'} group`}
                  >
                    <div className={`max-w-[70%] flex ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-2`}>
                      <motion.div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.role === 'user' ? 'bg-[#10A37F]' : 'bg-gray-200'
                        }`}
                        whileHover={{ scale: 1.1 }}
                      >
                        {message.role === 'user' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                            <path d="m9.5 17 5-5 5 5"></path>
                          </svg>
                        )}
                      </motion.div>
                      <div className="flex-1">
                        <div className={`flex items-center gap-2 mb-1 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}>
                          <span className={`text-xs ${
                            message.role === 'user' ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            {message.role === 'user' ? '我' : 'AI 助手'}
                            <span className="mx-1">·</span>
                            {formatDateTime(message.created_at)}
                          </span>
                        </div>
                        
                        {/* 思考过程 - 放在回答上方 */}
                        {message.role === 'assistant' && (message.thinking || message.thinking_enabled) && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-2"
                          >
                            <ThinkingProcess
                              thinking={message.thinking || '正在分析问题...'}
                              isEnabled={message.thinking_enabled || false}
                            />
                          </motion.div>
                        )}
                        
                        <div className={`px-4 py-3 rounded-2xl relative ${
                          message.role === 'user'
                            ? 'bg-[#10A37F] text-white rounded-br-md'
                            : 'bg-white text-gray-900 rounded-bl-md shadow-sm border border-gray-100'
                        }`}>
                          {message.role === 'user' ? (
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                          ) : (
                            <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-code:text-rose-600 prose-code:bg-rose-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:shadow-sm prose-a:text-[#10A37F] prose-li:text-gray-700 prose-strong:text-gray-900">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          )}
                          {message.file_ids.length > 0 && (
                            <div className={`flex flex-wrap gap-2 mt-3 ${
                              message.role === 'user' ? 'text-white/70' : 'text-gray-500'
                            }`}>
                              {message.file_ids.map((fileId) => {
                                const file = files.find(f => f.id === fileId);
                                return (
                                  <span key={fileId} className="px-2 py-1 bg-black/10 rounded-full text-xs flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                                      <polyline points="14 2 14 8 20 8"></polyline>
                                    </svg>
                                    {file?.filename || `文件 ${fileId}`}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                          {/* 操作按钮组 */}
                          <div className={`absolute top-2 ${message.role === 'user' ? 'right-2' : 'right-2'} flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all`}>
                            <button
                              onClick={() => handleCopy(message.content, message.id)}
                              className="p-1 hover:bg-black/10 rounded transition-all"
                              title="复制内容"
                            >
                              {copiedId === message.id ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={message.role === 'user' ? 'text-white' : 'text-green-500'}>
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={message.role === 'user' ? 'text-white/60 hover:text-white' : 'text-gray-400 hover:text-gray-600'}>
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              className="p-1 hover:bg-black/10 rounded transition-all"
                              title="删除消息"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={message.role === 'user' ? 'text-white/60 hover:text-white' : 'text-gray-400 hover:text-gray-600'}>
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start max-w-[70%]"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                        <path d="m9.5 17 5-5 5 5"></path>
                      </svg>
                    </div>
                    <div className="bg-white px-5 py-3.5 rounded-2xl rounded-bl-md shadow-sm border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.span
                              key={i}
                              className="w-2 h-2 rounded-full bg-[#10A37F]"
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                            />
                          ))}
                        </div>
                        <span className="text-gray-400 text-sm">AI 正在思考...</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col items-center justify-center px-4"
            >
              <motion.div 
                className="w-20 h-20 bg-gradient-to-br from-[#10A37F] to-[#0E8F6E] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#10A37F]/20"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                  <path d="m9.5 17 5-5 5 5"></path>
                </svg>
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">你好，我是 AI 助手</h3>
              <p className="text-gray-500 text-sm text-center max-w-md mb-8">
                上传文件或直接输入问题，我会为你提供帮助
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {[
                  { icon: '📝', text: '帮我总结文档内容', prompt: '请帮我总结一下上传的文档' },
                  { icon: '🔍', text: '提取关键要点', prompt: '文档中提到了哪些关键点？' },
                  { icon: '💡', text: '分析核心观点', prompt: '帮我分析这份文档的核心观点' },
                  { icon: '✍️', text: '帮我写一段代码', prompt: '请帮我写一段代码来实现：' },
                ].map((item, i) => (
                  <motion.button
                    key={i}
                    onClick={() => setInputMessage(item.prompt)}
                    className="flex items-center gap-3 px-4 py-3.5 bg-white border border-gray-200 hover:border-[#10A37F]/30 hover:bg-[#10A37F]/5 rounded-xl text-sm text-gray-700 transition-all text-left shadow-sm hover:shadow-md"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    whileHover={{ y: -2 }}
                  >
                    <span className="text-lg flex-shrink-0">{item.icon}</span>
                    <span>{item.text}</span>
                  </motion.button>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>支持Markdown</span>
                {getCurrentModel()?.context_window && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                    {(getCurrentModel()!.context_window! / 1000).toFixed(0)}K 上下文
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </div>

        <div className="bg-white border-t border-gray-200 px-8 py-4">
          {/* 能力警告提示 */}
          <AnimatePresence>
            {capabilityWarning && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl"
              >
                <div className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-amber-800">{capabilityWarning}</p>
                    <button
                      onClick={() => setShowModelSelector(true)}
                      className="mt-1 text-sm text-amber-600 hover:text-amber-700 font-medium"
                    >
                      切换模型 →
                    </button>
                  </div>
                  <button
                    onClick={() => setCapabilityWarning(null)}
                    className="text-amber-400 hover:text-amber-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 知识库文档引用选择器 */}
          <div className="mb-3">
            <button
              onClick={() => setShowKbSelector(!showKbSelector)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedKbDocs.length > 0
                  ? 'bg-[#10A37F]/10 text-[#10A37F] border border-[#10A37F]/30'
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-[#10A37F]/30 hover:text-[#10A37F]'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
              引用知识库
              {selectedKbDocs.length > 0 && (
                <span className="bg-[#10A37F] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {selectedKbDocs.length}
                </span>
              )}
            </button>
            {showKbSelector && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 p-3 bg-white border border-gray-200 rounded-xl shadow-sm max-h-48 overflow-y-auto"
              >
                {kbDocs.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-3">知识库暂无可用文档</p>
                ) : (
                  <div className="space-y-1">
                    {kbDocs.map((doc) => (
                      <label
                        key={doc.id}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                          selectedKbDocs.includes(doc.id) ? 'bg-[#10A37F]/5 border border-[#10A37F]/20' : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedKbDocs.includes(doc.id)}
                          onChange={() => {
                            setSelectedKbDocs(prev =>
                              prev.includes(doc.id) ? prev.filter(id => id !== doc.id) : [...prev, doc.id]
                            );
                          }}
                          className="w-3.5 h-3.5 text-[#10A37F] rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-gray-700 block truncate" title={doc.filename}>
                            {doc.filename}
                          </span>
                          {doc.ai_summary && (
                            <span className="text-[10px] text-gray-400 block truncate">{doc.ai_summary.slice(0, 40)}...</span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">{doc.file_type}</span>
                      </label>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
          
          {/* 已选择的参考文档 */}
          {selectedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {selectedFiles.map((fileId) => {
                const file = files.find(f => f.id === fileId);
                return (
                  <span
                    key={fileId}
                    className="px-3 py-1.5 bg-[#10A37F]/10 text-[#10A37F] rounded-full text-sm flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    {file?.filename || `文件 ${fileId}`}
                    <button
                      onClick={() => handleFileToggle(fileId)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          
          {/* 上传的图片预览 */}
          {uploadedImages.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {uploadedImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img src={image} alt={`上传的图片 ${index + 1}`} className="w-24 h-24 object-cover rounded-lg border border-gray-200" />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <div className="bg-gray-50 rounded-xl border border-gray-200 focus-within:border-[#10A37F] transition-colors">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入您的问题..."
                  className="w-full px-4 py-3 bg-transparent resize-none focus:outline-none text-sm text-gray-900 placeholder-gray-400"
                  rows={2}
                />
                {/* 当前模型能力标签 */}
                <div className="px-3 pb-2 flex items-center gap-2 border-t border-gray-100">
                  {(() => {
                    const currentModel = getCurrentModel();
                    if (!currentModel) return null;
                    return (
                      <div className="flex items-center gap-1">
                        {currentModel.supports_vision && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] flex items-center gap-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            视觉
                          </span>
                        )}
                        {currentModel.supports_thinking && (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] flex items-center gap-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="M12 6v6l4 2"></path>
                            </svg>
                            思考
                          </span>
                        )}
                        {currentModel.context_window && (
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] flex items-center gap-0.5" title="上下文窗口">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                              <line x1="3" y1="9" x2="21" y2="9"></line>
                              <line x1="9" y1="21" x2="9" y2="9"></line>
                            </svg>
                            {(currentModel.context_window / 1000).toFixed(0)}K
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
            <motion.button
              onClick={handleSend}
              disabled={!inputMessage.trim() || loading || uploading}
              className={`px-5 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                inputMessage.trim() && !loading && !uploading
                  ? 'bg-[#10A37F] text-white hover:bg-[#0E8F6E] shadow-sm'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              whileHover={inputMessage.trim() && !loading && !uploading ? { scale: 1.05 } : {}}
              whileTap={inputMessage.trim() && !loading && !uploading ? { scale: 0.95 } : {}}
            >
              {loading ? (
                <motion.div 
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m22 11.08-7.928 7.928a2 2 0 0 1-2.828 0L2 12V2h10.08a2 2 0 0 1 1.414.586l4.586 4.586A2 2 0 0 1 22 11.08z"></path>
                </svg>
              )}
              <span>{loading ? '发送中' : '发送'}</span>
            </motion.button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            按 Enter 发送，Shift + Enter 换行
          </p>
        </div>
      </div>

      {/* 右侧文件面板 */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              文件列表
            </h3>
            <label className="flex items-center gap-1 px-3 py-1.5 bg-[#10A37F] text-white text-xs rounded-lg cursor-pointer hover:bg-[#0E8F6E] transition-colors">
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt,.md"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14"></path>
                <path d="M5 12h14"></path>
              </svg>
              {uploading ? '上传中...' : '上传'}
            </label>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          {/* 已选择文件 */}
          {selectedFiles.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">已选择 ({selectedFiles.length})</h4>
              <div className="space-y-2">
                {selectedFiles.map((fileId) => {
                  const file = files.find(f => f.id === fileId);
                  return (
                    <div key={fileId} className="flex items-center justify-between p-2 bg-[#10A37F]/5 rounded-lg border border-[#10A37F]/20">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-lg">{getFileIcon(file?.filename || '')}</span>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-sm text-gray-700 truncate" title={file?.filename}>
                            {file?.filename}
                          </span>
                          {file?.size && (
                            <span className="text-xs text-gray-400">
                              {formatFileSize(file.size)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => file && handleDownloadFile(file)}
                          className="text-gray-400 hover:text-blue-500 p-1 transition-colors"
                          title="下载文件"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleFileToggle(fileId)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="取消选择"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 所有文件 */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">所有文件 ({files.length})</h4>
            {files.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                </div>
                <p className="text-sm text-gray-400">暂无文件</p>
                <p className="text-xs text-gray-300 mt-1">上传文件开始使用</p>
              </div>
            ) : (
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className={`p-3 rounded-lg transition-colors ${
                      selectedFiles.includes(file.id)
                        ? 'bg-[#10A37F]/5 border border-[#10A37F]/20'
                        : 'hover:bg-gray-50 border border-transparent'
                    } border`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-base flex-shrink-0">{getFileIcon(file.filename)}</span>
                        <span 
                          className="text-sm text-gray-700 cursor-pointer hover:text-[#10A37F] break-all leading-snug"
                          onClick={() => handleFileToggle(file.id)}
                          title={file.filename}
                        >
                          {file.filename}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {file.size && (
                          <span className="text-xs text-gray-400">
                            {formatFileSize(file.size)}
                          </span>
                        )}
                        {selectedFiles.includes(file.id) ? (
                          <span className="text-xs text-[#10A37F] px-1.5 py-0.5 bg-[#10A37F]/10 rounded">
                            已选
                          </span>
                        ) : (
                          <button
                            onClick={() => handleFileToggle(file.id)}
                            className="text-xs text-gray-500 hover:text-[#10A37F] px-2 py-1 transition-colors"
                            title="选择文件"
                          >
                            选择
                          </button>
                        )}
                        <button
                          onClick={() => handleDownloadFile(file)}
                          className="text-gray-400 hover:text-blue-500 p-1 transition-colors"
                          title="下载文件"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                          title="删除文件"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatPage;