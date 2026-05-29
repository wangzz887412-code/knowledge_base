import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/', label: '我的藏书', icon: '📚', desc: '知识文档库' },
  { path: '/ai-chat', label: 'AI 助手', icon: '🤖', desc: '智能对话' },
  { path: '/bookmarks', label: '我的书签', icon: '📑', desc: '收藏夹' },
  { path: '/settings', label: '设置', icon: '⚙️', desc: '偏好配置' },
  { path: '/help', label: '帮助中心', icon: '📖', desc: '使用指南' },
];

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-64 min-h-screen flex flex-col relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #1a1510 0%, #1f1a14 40%, #241e17 100%)',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(247,208,44,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(247,208,44,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 flex flex-col h-full p-5">
        <div className="mb-10 mt-2">
          <div className="flex items-center gap-3 mb-3">
            <motion.div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #F7D02C 0%, #E5B820 100%)' }}
              whileHover={{ rotate: -5, scale: 1.05 }}
            >
              <span className="text-base">📚</span>
            </motion.div>
            <div>
              <h1 className="text-lg font-bold tracking-wider"
                style={{ color: '#F7D02C', fontFamily: "'Georgia', 'Noto Serif SC', serif" }}
              >
                知识宝库
              </h1>
              <p className="text-[10px] tracking-[0.2em] uppercase opacity-40" style={{ color: '#C4A882' }}>
                KNOWLEDGE VAULT
              </p>
            </div>
          </div>
        </div>

        <div
          className="mb-7 px-3 py-3 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(247,208,44,0.06) 0%, rgba(247,208,44,0.02) 100%)',
            border: '1px solid rgba(247,208,44,0.1)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #8B5A2B, #6B4226)', color: '#FAF7F2' }}>
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#E8D5C0' }}>{user?.username}</p>
              <p className="text-[10px] tracking-wider opacity-40" style={{ color: '#C4A882' }}>管理员</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav flex-1 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`block py-2.5 px-3 rounded-lg transition-all duration-300 text-sm ${
                isActive(item.path) ? 'active' : ''
              }`}
              style={{
                color: isActive(item.path) ? '#F7D02C' : '#C4A882',
                background: isActive(item.path)
                  ? 'linear-gradient(90deg, rgba(247,208,44,0.1) 0%, rgba(247,208,44,0.04) 100%)'
                  : 'transparent',
              }}
            >
              <span className="flex items-center gap-3">
                <span className="text-base w-6 text-center">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </span>
            </Link>
          ))}
        </nav>

        <div className="pt-6 mt-auto border-t" style={{ borderColor: 'rgba(196,168,130,0.12)' }}>
          <button
            onClick={logout}
            className="w-full py-2.5 px-4 rounded-lg text-sm transition-all duration-300 flex items-center gap-3"
            style={{
              color: '#C4A882',
              background: 'rgba(196,168,130,0.06)',
              border: '1px solid rgba(196,168,130,0.1)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
              e.currentTarget.style.color = '#EF4444';
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(196,168,130,0.06)';
              e.currentTarget.style.color = '#C4A882';
              e.currentTarget.style.borderColor = 'rgba(196,168,130,0.1)';
            }}
          >
            <span className="text-base">🚪</span>
            <span>退出登录</span>
          </button>
        </div>
      </div>
    </div>
  );
};