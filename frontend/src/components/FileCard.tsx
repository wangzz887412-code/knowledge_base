import React from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = 'http://localhost:8000/api';

interface FileCardProps {
  id: number;
  title: string;
  category?: string;
  aiSummary?: string;
  tags?: Array<{ id: number; name: string; color: string }>;
  onClick: () => void;
  onDelete?: () => void;
}

export const FileCard: React.FC<FileCardProps> = ({
  id,
  title,
  category = '未分类',
  aiSummary,
  tags = [],
  onClick,
  onDelete
}) => {
  const { token } = useAuth();

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await axios.get(`${API_BASE}/files/files/${id}/download/`, {
        headers: { Authorization: `Token ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', title);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请重试');
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`确定要删除文件 "${title}" 吗？`)) return;
    
    try {
      await axios.delete(`${API_BASE}/files/files/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      onDelete?.();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    }
  };

  return (
    <motion.div
      onClick={onClick}
      className="bg-white rounded-xl p-4 border border-gray-100 cursor-pointer group"
      whileHover={{ 
        y: -4, 
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        borderColor: 'rgba(16, 163, 127, 0.3)'
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <motion.svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#6B7280" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              whileHover={{ stroke: '#10A37F' }}
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </motion.svg>
            <h3 className="font-medium text-gray-900 truncate group-hover:text-[#10A37F] transition-colors">
              {title}
            </h3>
          </div>
          
          {aiSummary && (
            <motion.div 
              className="mb-2 text-sm text-gray-600 line-clamp-2 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {aiSummary}
            </motion.div>
          )}
          
          {tags.length > 0 && (
            <motion.div 
              className="flex flex-wrap gap-1 mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              {tags.slice(0, 3).map((tag, index) => (
                <motion.span
                  key={tag.id}
                  className="px-2 py-0.5 text-xs rounded-full"
                  style={{ backgroundColor: tag.color + '20', color: tag.color }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                >
                  {tag.name}
                </motion.span>
              ))}
            </motion.div>
          )}
          
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-[#10A37F]/10 text-[#10A37F] rounded-full text-xs font-medium">
              {category}
            </span>
          </div>
        </div>
        <motion.div 
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100"
          initial={{ opacity: 0, x: 10 }}
          whileHover={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.button
            onClick={handleDownload}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="下载文件"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </motion.button>
          <motion.button
            onClick={handleDelete}
            className="p-2 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
            title="删除文件"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export const FileCardSkeleton: React.FC = () => {
  return (
    <motion.div 
      className="bg-white rounded-xl p-4 border border-gray-100"
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 bg-gray-200 rounded"></div>
        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
      </div>
      <div className="h-4 bg-gray-100 rounded w-1/3"></div>
    </motion.div>
  );
};

export default FileCard;
