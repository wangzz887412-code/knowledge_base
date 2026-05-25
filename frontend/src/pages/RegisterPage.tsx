import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);

    try {
      await register(username, email, password);
      navigate('/login');
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData?.errors) {
        const errorMessages = [];
        if (errorData.errors.username) {
          errorMessages.push(`用户名: ${errorData.errors.username.join(', ')}`);
        }
        if (errorData.errors.email) {
          errorMessages.push(`邮箱: ${errorData.errors.email.join(', ')}`);
        }
        if (errorData.errors.password) {
          errorMessages.push(`密码: ${errorData.errors.password.join(', ')}`);
        }
        if (errorData.errors.password2) {
          errorMessages.push(`确认密码: ${errorData.errors.password2.join(', ')}`);
        }
        if (errorMessages.length > 0) {
          setError(errorMessages.join('\n'));
        } else {
          setError(errorData.message || '注册失败');
        }
      } else {
        setError(errorData?.message || '注册失败，请检查您的信息');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <div className="w-full max-w-md p-8 bg-paper-dark rounded-2xl shadow-xl border border-paper">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">📖</div>
          <h1 className="text-3xl font-bold text-ink">创建账户</h1>
          <p className="text-ink-light mt-2">开启您的知识之旅</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-ink mb-2" htmlFor="username">
              用户名
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-paper border border-leather-light rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
              placeholder="请输入用户名"
              required
            />
          </div>

          <div>
            <label className="block text-ink mb-2" htmlFor="email">
              邮箱
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-paper border border-leather-light rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
              placeholder="请输入邮箱"
              required
            />
          </div>

          <div>
            <label className="block text-ink mb-2" htmlFor="password">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-paper border border-leather-light rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
              placeholder="请输入密码"
              required
            />
          </div>

          <div>
            <label className="block text-ink mb-2" htmlFor="confirmPassword">
              确认密码
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-paper border border-leather-light rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
              placeholder="请再次输入密码"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-leather text-paper rounded-lg hover:bg-leather-light transition-colors disabled:opacity-50"
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-ink-light">
            已有账户？{' '}
            <Link to="/login" className="text-leather hover:text-leather-light font-semibold">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
