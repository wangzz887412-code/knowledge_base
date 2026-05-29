import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const ForgotPasswordPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTempPassword('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/users/password-reset/`, {
        username,
      });
      setTempPassword(response.data.temp_password);
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.username) {
        setError(Array.isArray(data.username) ? data.username[0] : data.username);
      } else {
        setError(data?.message || '请求失败，请稍后再试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <div className="w-full max-w-md p-8 bg-paper-dark rounded-2xl shadow-xl border border-paper">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🔑</div>
          <h1 className="text-3xl font-bold text-ink">忘记密码</h1>
          <p className="text-ink-light mt-2">输入您的用户名，获取临时密码</p>
        </div>

        {tempPassword ? (
          <div className="space-y-6">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
              <p className="mb-2">密码已重置！您的临时密码为：</p>
              <p className="text-2xl font-mono font-bold text-center py-2 bg-white rounded border select-all">
                {tempPassword}
              </p>
              <p className="mt-2 text-sm">请使用此临时密码登录后，在设置中修改密码</p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-leather text-paper rounded-lg hover:bg-leather-light transition-colors"
            >
              前往登录
            </button>
          </div>
        ) : (
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
                placeholder="请输入您的用户名"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-leather text-paper rounded-lg hover:bg-leather-light transition-colors disabled:opacity-50"
            >
              {loading ? '处理中...' : '获取临时密码'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-ink-light">
            <Link to="/login" className="text-leather hover:text-leather-light font-semibold">
              返回登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
