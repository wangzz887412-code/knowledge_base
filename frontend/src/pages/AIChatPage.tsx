import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from '../components/Sidebar';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFiles();
    fetchModelInfo();
    fetchChatHistories();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchFiles = async () => {
    try {
      const response = await axios.get(`${API_BASE}/files/files/?status=ready`, {
        headers: { Authorization: `Token ${token}` }
      });
      setFiles(response.data.map((file: { id: number; filename: string }) => ({
        id: file.id,
        filename: file.filename,
        selected: false
      })));
    } catch (error) {
      console.error('获取文件列表失败:', error);
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
    if (selectedFiles.includes(fileId)) {
      setSelectedFiles(selectedFiles.filter(id => id !== fileId));
    } else {
      setSelectedFiles([...selectedFiles, fileId]);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setSelectedFiles([]);
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
          chat_id: currentChatId
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
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
    <div className="flex min-h-screen bg-[#F5F5F5]">
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-3 border-b border-gray-200">
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

        <div className="flex-1 overflow-y-auto p-2">
          {chatHistories.length > 0 ? (
            <div className="space-y-1">
              {chatHistories.map((chat) => (
                <div
                  key={chat.id}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all group ${
                    currentChatId === chat.id
                      ? 'bg-[#E8F5E9] border border-[#C8E6C9]'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => fetchChatMessages(chat.id)}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    currentChatId === chat.id ? 'bg-[#10A37F]' : 'bg-gray-200'
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={currentChatId === chat.id ? 'text-white' : 'text-gray-600'}>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate text-sm">{chat.title || '未命名对话'}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {chat.message_count} 条消息 · {formatDate(chat.updated_at)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteChat(chat.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 text-red-500 rounded transition-all"
                    title="删除对话"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
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

        <div className="p-3 border-t border-gray-200">
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
              {selectedFiles.length > 0 && (
                <span className="bg-[#10A37F] text-white text-xs px-2 py-0.5 rounded-full">
                  {selectedFiles.length}
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
                    selectedFiles.includes(file.id)
                      ? 'bg-[#10A37F] text-white'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                  <span className="truncate">{file.filename}</span>
                  {selectedFiles.includes(file.id) && (
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
              <div className="w-8 h-8 bg-[#10A37F]/10 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10A37F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                  <path d="m9.5 17 5-5 5 5"></path>
                </svg>
              </div>
              <div>
                <h2 className="font-medium text-gray-900">AI 助手</h2>
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
                    transition={{ 
                      type: 'spring', 
                      stiffness: 300, 
                      damping: 30,
                      delay: index === messages.length - 1 ? 0 : 0
                    }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%]`}>
                      <div className={`flex items-center gap-2 mb-2 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}>
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
                      <span className={`text-xs ${
                        message.role === 'user' ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        {message.role === 'user' ? '我' : 'AI 助手'}
                        <span className="mx-1">·</span>
                        {formatDateTime(message.created_at)}
                      </span>
                    </div>
                    <div className={`px-4 py-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-[#10A37F] text-white rounded-br-md'
                        : 'bg-white text-gray-900 rounded-bl-md shadow-sm border border-gray-100'
                    }`}>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
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
                    </div>
                    
                    {/* 思考过程 - 可折叠 */}
                    {message.role === 'assistant' && (message.thinking || message.thinking_enabled) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2 w-full"
                      >
                        <ThinkingProcess
                          thinking={message.thinking || '正在分析问题...'}
                          isEnabled={message.thinking_enabled || false}
                        />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center"
                >
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-[#10A37F] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-gray-500 text-sm">AI 正在思考...</span>
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
              <div className="w-24 h-24 bg-[#10A37F]/10 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10A37F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                  <path d="m9.5 17 5-5 5 5"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">欢迎使用 AI 助手</h3>
              <p className="text-gray-500 text-sm text-center max-w-md">
                选择左侧文档，然后输入您的问题，我会基于文档内容为您解答。
              </p>
              <div className="mt-8 grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setInputMessage('请帮我总结一下上传的文档');
                  }}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-all text-left"
                >
                  总结文档内容
                </button>
                <button
                  onClick={() => {
                    setInputMessage('文档中提到了哪些关键点？');
                  }}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-all text-left"
                >
                  提取关键要点
                </button>
                <button
                  onClick={() => {
                    setInputMessage('根据文档内容，回答以下问题：');
                  }}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-all text-left"
                >
                  基于文档回答问题
                </button>
                <button
                  onClick={() => {
                    setInputMessage('帮我分析这份文档的核心观点');
                  }}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-all text-left"
                >
                  分析核心观点
                </button>
              </div>
            </motion.div>
          )}
        </div>

        <div className="bg-white border-t border-gray-200 px-8 py-4">
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
          <div className="flex items-end gap-3">
            <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-[#10A37F] transition-colors">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入您的问题..."
                className="w-full px-4 py-3 bg-transparent resize-none focus:outline-none text-sm text-gray-900 placeholder-gray-400"
                rows={2}
              />
            </div>
            <motion.button
              onClick={handleSend}
              disabled={!inputMessage.trim() || loading}
              className={`px-5 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                inputMessage.trim() && !loading
                  ? 'bg-[#10A37F] text-white hover:bg-[#0E8F6E] shadow-sm'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              whileHover={inputMessage.trim() && !loading ? { scale: 1.05 } : {}}
              whileTap={inputMessage.trim() && !loading ? { scale: 0.95 } : {}}
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
    </div>
  );
};

export default AIChatPage;