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
  keywords?: string[];
  onClick: () => void;
  onDelete?: () => void;
}

export const FileCard: React.FC<FileCardProps> = ({
  id,
  title,
  category = '未分类',
  aiSummary,
  tags = [],
  keywords = [],
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

  const categoryColorMap: Record<string, string> = {
    '未分类': '#8C7B6C',
    '文档': '#8B5A2B',
    '代码': '#2C5F7C',
    '图片': '#7C5C8B',
    '数据': '#5C7C3B',
  };

  return (
    <motion.div
      onClick={onClick}
      className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-5 cursor-pointer group overflow-hidden"
      style={{
        border: '1px solid rgba(139,90,43,0.08)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03), 0 4px 12px rgba(0,0,0,0.03)',
      }}
      whileHover={{ 
        y: -4,
        boxShadow: '0 2px 6px rgba(139,90,43,0.06), 0 12px 28px rgba(0,0,0,0.07)',
        borderColor: 'rgba(247,208,44,0.3)',
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500 rounded-2xl"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139,90,43,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,90,43,0.8) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="absolute top-0 left-0 w-1 h-0 group-hover:h-full transition-all duration-300 rounded-r"
        style={{ background: 'linear-gradient(180deg, #F7D02C, #8B5A2B)' }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-2.5">
              <motion.div
                className="w-4 h-4 rounded flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(247,208,44,0.3), rgba(139,90,43,0.2))',
                  border: '1px solid rgba(139,90,43,0.15)',
                }}
              />
              <h3
                className="font-semibold text-[15px] truncate transition-colors duration-200"
                style={{ color: '#2C2416' }}
              >
                {title}
              </h3>
            </div>
            
            {aiSummary && (
              <motion.div 
                className="mb-2.5 text-[13px] line-clamp-2 leading-relaxed"
                style={{ color: '#6B5E52' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {aiSummary}
              </motion.div>
            )}
            
            {tags.length > 0 && (
              <motion.div 
                className="flex flex-wrap gap-1.5 mb-2.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                {tags.slice(0, 3).map((tag, index) => (
                  <motion.span
                    key={tag.id}
                    className="tag-chip"
                    style={{
                      backgroundColor: `${tag.color}10`,
                      color: tag.color,
                      borderColor: `${tag.color}25`,
                    }}
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

            {keywords.length > 0 && (
              <motion.div
                className="flex flex-wrap gap-1 mb-2.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                {keywords.slice(0, 5).map((kw, index) => (
                  <motion.span
                    key={index}
                    className="px-2 py-0.5 text-[11px] rounded-full transition-colors duration-200"
                    style={{
                      background: 'rgba(139,90,43,0.05)',
                      color: '#8C7B6C',
                      border: '1px solid rgba(139,90,43,0.08)',
                      fontFamily: "'Georgia', 'Noto Serif SC', serif",
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 + index * 0.05 }}
                  >
                    {kw}
                  </motion.span>
                ))}
              </motion.div>
            )}
            
            <div className="flex items-center gap-2 mt-1">
              <span
                className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={{
                  backgroundColor: `${categoryColorMap[category] || '#8C7B6C'}10`,
                  color: categoryColorMap[category] || '#8C7B6C',
                  border: `1px solid ${categoryColorMap[category] || '#8C7B6C'}20`,
                  fontFamily: "'Georgia', 'Noto Serif SC', serif",
                }}
              >
                {category}
              </span>
            </div>
          </div>

          <motion.div 
            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <motion.button
              onClick={handleDownload}
              className="p-2 rounded-lg transition-colors duration-200"
              style={{ color: '#8C7B6C' }}
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(139,90,43,0.06)' }}
              whileTap={{ scale: 0.9 }}
              title="下载文件"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </motion.button>
            <motion.button
              onClick={handleDelete}
              className="p-2 rounded-lg transition-colors duration-200"
              style={{ color: '#8C7B6C' }}
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(239,68,68,0.08)', color: '#EF4444' }}
              whileTap={{ scale: 0.9 }}
              title="删除文件"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export const FileCardSkeleton: React.FC = () => {
  return (
    <motion.div 
      className="bg-white/70 backdrop-blur-sm rounded-2xl p-5"
      style={{
        border: '1px solid rgba(139,90,43,0.08)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-4 h-4 rounded" style={{ background: 'rgba(139,90,43,0.1)' }} />
        <div className="h-5 rounded w-3/4" style={{ background: 'rgba(139,90,43,0.08)' }} />
      </div>
      <div className="h-4 rounded w-1/3" style={{ background: 'rgba(139,90,43,0.05)' }} />
    </motion.div>
  );
};

export default FileCard;