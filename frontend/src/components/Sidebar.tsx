import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-64 bg-leather-light min-h-screen p-6 shadow-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-paper mb-1">知识宝库</h1>
        <p className="text-paper-dark text-sm">您的私人书房</p>
      </div>

      <div className="border-t border-leather pt-6 mb-6">
        <div className="text-paper-dark text-sm mb-2">欢迎回来</div>
        <div className="text-paper font-semibold">{user?.username}</div>
      </div>

      <nav className="space-y-2">
        <Link
          to="/"
          className={`block py-3 px-4 rounded-xl transition-all font-serif ${
            isActive('/')
              ? 'bg-leather text-white shadow-md'
              : 'text-paper hover:bg-leather/20'
          }`}
        >
          📚 我的藏书
        </Link>
        <Link
          to="/ai-chat"
          className={`block py-3 px-4 rounded-xl transition-all font-serif ${
            isActive('/ai-chat')
              ? 'bg-leather text-white shadow-md'
              : 'text-paper hover:bg-leather/20'
          }`}
        >
          🤖 AI 助手
        </Link>
        <Link
          to="/bookmarks"
          className={`block py-3 px-4 rounded-xl transition-all font-serif ${
            isActive('/bookmarks')
              ? 'bg-leather text-white shadow-md'
              : 'text-paper hover:bg-leather/20'
          }`}
        >
          📑 我的书签
        </Link>
        <Link
          to="/settings"
          className={`block py-3 px-4 rounded-xl transition-all font-serif ${
            isActive('/settings')
              ? 'bg-leather text-white shadow-md'
              : 'text-paper hover:bg-leather/20'
          }`}
        >
          ⚙️ 设置
        </Link>
        <Link
          to="/help"
          className={`block py-3 px-4 rounded-xl transition-all font-serif ${
            isActive('/help')
              ? 'bg-leather text-white shadow-md'
              : 'text-paper hover:bg-leather/20'
          }`}
        >
          📖 帮助中心
        </Link>
      </nav>

      <div className="mt-auto pt-8">
        <button
          onClick={logout}
          className="w-full py-3 px-4 bg-leather text-paper rounded-xl hover:bg-leather/80 transition-all font-serif"
        >
          退出登录
        </button>
      </div>
    </div>
  );
};
