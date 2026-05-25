import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadZoneProps {
  onUpload: (file: File) => void;
}

const ALLOWED_TYPES = ['.pdf', '.doc', '.docx', '.txt', '.epub'];
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export const UploadZone: React.FC<UploadZoneProps> = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const validateFile = (file: File): string | null => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_TYPES.includes(extension)) {
      return `不支持的文件类型 ${extension}，请上传 ${ALLOWED_TYPES.join(', ')} 格式`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `文件大小超过限制（${(file.size / 1024 / 1024).toFixed(2)}MB），最大支持 50MB`;
    }
    return null;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setErrorMessage('');

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const error = validateFile(file);

      if (error) {
        setErrorMessage(error);
        setUploadStatus('error');
        setTimeout(() => {
          setUploadStatus('idle');
          setErrorMessage('');
        }, 3000);
      } else {
        setUploadStatus('uploading');
        onUpload(file);
        setTimeout(() => setUploadStatus('idle'), 2000);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const error = validateFile(file);

      if (error) {
        setErrorMessage(error);
        setUploadStatus('error');
        setTimeout(() => {
          setUploadStatus('idle');
          setErrorMessage('');
        }, 3000);
      } else {
        setUploadStatus('uploading');
        onUpload(file);
        setTimeout(() => setUploadStatus('idle'), 2000);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <motion.div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-4 border-dashed rounded-2xl p-12 text-center transition-colors duration-300 ${
        isDragging
          ? 'border-gold bg-gold/10'
          : uploadStatus === 'uploading'
          ? 'border-leather-light bg-paper-dark'
          : uploadStatus === 'error'
          ? 'border-red-400 bg-red-50'
          : uploadStatus === 'success'
          ? 'border-green-400 bg-green-50'
          : 'border-leather-light bg-paper hover:border-leather/50'
      }`}
      animate={{
        scale: isDragging ? 1.02 : 1,
        boxShadow: isDragging 
          ? '0 20px 40px -10px rgba(212, 175, 55, 0.3)' 
          : '0 0 0 0 rgba(0, 0, 0, 0)'
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={uploadStatus}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div 
            className="text-4xl mb-4"
            animate={uploadStatus === 'uploading' ? { rotate: 360 } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            {uploadStatus === 'uploading' ? '⏳' : uploadStatus === 'success' ? '✅' : uploadStatus === 'error' ? '❌' : '📖'}
          </motion.div>

          <h3 className="text-xl font-bold text-ink mb-2 font-serif">
            {uploadStatus === 'uploading'
              ? '正在上传...'
              : uploadStatus === 'success'
              ? '上传成功！'
              : uploadStatus === 'error'
              ? '上传失败'
              : '上传您的文档'}
          </h3>

          {uploadStatus === 'idle' && (
            <p className="text-ink-light mb-6 font-serif">拖拽文件到此处或点击选择</p>
          )}

          {errorMessage && (
            <motion.div 
              className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <p className="text-red-700 text-sm font-serif">{errorMessage}</p>
            </motion.div>
          )}

          {uploadStatus === 'idle' && (
            <>
              <label className="inline-block cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept={ALLOWED_TYPES.join(',')}
                />
                <motion.span 
                  className="px-6 py-3 bg-leather text-paper rounded-lg shadow-md font-serif inline-block"
                  whileHover={{ scale: 1.05, backgroundColor: '#C9A961' }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  选择文件
                </motion.span>
              </label>
              <p className="text-ink-light text-xs mt-4 font-serif">
                支持 {ALLOWED_TYPES.map(t => t.toUpperCase().replace('.', '')).join(', ')} 格式，最大 {formatFileSize(MAX_FILE_SIZE)}
              </p>
            </>
          )}

          {uploadStatus === 'uploading' && (
            <motion.div 
              className="mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="h-2 bg-leather/20 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-leather rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.5, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default UploadZone;
