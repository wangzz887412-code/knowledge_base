import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  useEffect(() => {
    console.debug('[MarkdownRenderer] 收到内容:', {
      length: content.length,
      hasCodeBlock: content.includes('```'),
      hasTable: content.includes('|'),
      preview: content.slice(0, 200) + (content.length > 200 ? '...' : '')
    });
  }, [content]);

  if (!content) {
    console.warn('[MarkdownRenderer] 内容为空');
    return <p className="text-gray-400 text-sm italic">暂无摘要内容</p>;
  }

  return (
    <div className="prose prose-sm max-w-none">
      <style>{`
        .prose h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #10A37F;
        }
        
        .prose h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .prose h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #374151;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }
        
        .prose p {
          color: #4b5563;
          line-height: 1.8;
          margin-bottom: 0.75rem;
        }
        
        .prose ul, .prose ol {
          color: #4b5563;
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        
        .prose li {
          margin-bottom: 0.5rem;
          line-height: 1.6;
        }
        
        .prose li::marker {
          color: #10A37F;
        }
        
        .prose strong {
          color: #1f2937;
          font-weight: 600;
        }
        
        .prose code:not(pre code) {
          background-color: #fef3c7;
          color: #d97706;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          font-family: 'Fira Code', 'Monaco', monospace;
        }
        
        .prose pre {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1rem;
          border-radius: 0.75rem;
          overflow-x: auto;
          margin: 1rem 0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .prose pre code {
          background-color: transparent;
          color: inherit;
          padding: 0;
          font-size: 0.875rem;
          line-height: 1.6;
        }
        
        .prose table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
          font-size: 0.875rem;
        }
        
        .prose th {
          background-color: #f3f4f6;
          color: #1f2937;
          font-weight: 600;
          padding: 0.75rem;
          text-align: left;
          border-bottom: 2px solid #d1d5db;
        }
        
        .prose td {
          padding: 0.75rem;
          border-bottom: 1px solid #e5e7eb;
          color: #4b5563;
        }
        
        .prose tr:hover td {
          background-color: #f9fafb;
        }
        
        .prose a {
          color: #10A37F;
          text-decoration: underline;
          font-weight: 500;
        }
        
        .prose a:hover {
          color: #0E8F6E;
        }
        
        .prose blockquote {
          border-left: 4px solid #10A37F;
          background-color: #f0fdf4;
          padding: 1rem;
          margin: 1rem 0;
          border-radius: 0 0.5rem 0.5rem 0;
          color: #065f46;
          font-style: italic;
        }
        
        .prose hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 2rem 0;
        }
      `}</style>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="w-full text-sm">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="bg-gray-50 text-gray-700 font-semibold px-4 py-3 text-left border-b-2 border-gray-200">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="px-4 py-3 text-gray-600 border-b border-gray-100">
                {children}
              </td>
            );
          },
          input({ ...props }) {
            return <input {...props} className="mr-2" />;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
