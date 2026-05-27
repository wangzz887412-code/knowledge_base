import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sidebar } from '../components/Sidebar';

const API_BASE = 'http://localhost:8000/api';

interface AIModel {
  model_id: string;
  name: string;
  provider: string;
  supports_vision: boolean;
  requires_api_key: boolean;
  supports_thinking?: boolean;
}

interface AIConfig {
  chat_model_id: string;
  chat_model_name: string;
  document_model_id: string;
  document_model_name: string;
  api_key: string;
  enable_vision: boolean;
  enable_thinking: boolean;
}

const SettingsPage: React.FC = () => {
  const [config, setConfig] = useState<AIConfig>({
    chat_model_id: 'glm-4-flash-250414',
    chat_model_name: 'GLM-4-Flash-250414',
    document_model_id: 'glm-4-flash-250414',
    document_model_name: 'GLM-4-Flash-250414',
    api_key: '',
    enable_vision: false,
    enable_thinking: false
  });
  
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/ai/config/`, {
        headers: { Authorization: `Token ${token}` }
      });
      
      setConfig(response.data.config);
      setAvailableModels(response.data.available_models);
    } catch (error) {
      console.error('获取配置失败:', error);
      setMessage({ type: 'error', text: '获取AI配置失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE}/ai/config/`, config, {
        headers: { Authorization: `Token ${token}` }
      });
      
      setMessage({ type: 'success', text: '✓ AI配置已保存' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || '保存配置失败';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setConnectionStatus('testing');
    setMessage(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE}/ai/test-connection/`,
        {
          model_id: config.chat_model_id,
          api_key: config.api_key
        },
        { headers: { Authorization: `Token ${token}` } }
      );
      
      if (response.data.success) {
        setConnectionStatus('success');
        setMessage({ type: 'success', text: `✓ ${response.data.message}` });
      }
    } catch (error: any) {
      setConnectionStatus('error');
      const errorMsg = error.response?.data?.error || '连接测试失败';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setTesting(false);
    }
  };

  const selectedChatModel = availableModels.find(m => m.model_id === config.chat_model_id);
  const selectedDocModel = availableModels.find(m => m.model_id === config.document_model_id);
  const selectedModel = selectedChatModel;

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-12 bg-paper-dark rounded-xl w-1/3"></div>
              <div className="h-64 bg-paper-dark rounded-xl"></div>
              <div className="h-48 bg-paper-dark rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-ink mb-2 font-serif">⚙️ 设置</h2>
            <p className="text-ink-light font-serif">管理您的AI助手配置</p>
          </div>

          {message && (
            <div
              className={`mb-6 p-4 rounded-xl border-l-4 font-serif ${
                message.type === 'success'
                  ? 'bg-green-50 border-green-500 text-green-700'
                  : 'bg-red-50 border-red-500 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="space-y-6">
            {/* AI助手模型选择 */}
            <div className="bg-white rounded-2xl shadow-md p-6 border border-paper-dark">
              <h3 className="text-xl font-bold text-ink mb-4 font-serif flex items-center">
                <span className="mr-2">💬</span> AI助手模型
              </h3>
              <p className="text-sm text-ink-light font-serif mb-4">
                用于AI助手对话功能，可以随时在聊天界面切换
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-light mb-2 font-serif">
                    选择聊天模型
                  </label>
                  <select
                    value={config.chat_model_id}
                    onChange={(e) => {
                      const model = availableModels.find(m => m.model_id === e.target.value);
                      setConfig({ ...config, chat_model_id: e.target.value, chat_model_name: model?.name || e.target.value });
                    }}
                    className="w-full px-4 py-3 bg-paper border border-paper-dark rounded-xl 
                             text-ink font-serif focus:outline-none focus:border-leather 
                             focus:ring-2 focus:ring-leather/20 transition-all"
                  >
                    {availableModels.map((model) => (
                      <option key={model.model_id} value={model.model_id}>
                        {model.name} ({model.provider})
                        {model.supports_vision ? ' 🧿' : ''}
                        {model.supports_thinking ? ' 💭' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedChatModel && (
                  <div className="p-4 bg-paper rounded-xl">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-semibold text-ink-light">提供商：</span>
                        <span className="text-ink font-serif">{selectedChatModel.provider}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-ink-light">视觉能力：</span>
                        <span className={`font-serif ${selectedChatModel.supports_vision ? 'text-green-600' : 'text-gray-500'}`}>
                          {selectedChatModel.supports_vision ? '✓ 支持' : '✗ 不支持'}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-ink-light">思考能力：</span>
                        <span className={`font-serif ${selectedChatModel.supports_thinking ? 'text-green-600' : 'text-gray-500'}`}>
                          {selectedChatModel.supports_thinking ? '✓ 支持' : '✗ 不支持'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 文档处理模型选择 */}
            <div className="bg-white rounded-2xl shadow-md p-6 border border-paper-dark">
              <h3 className="text-xl font-bold text-ink mb-4 font-serif flex items-center">
                <span className="mr-2">📄</span> 文档处理模型
              </h3>
              <p className="text-sm text-ink-light font-serif mb-4">
                用于文档摘要、思维导图、标签生成等功能
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-light mb-2 font-serif">
                    选择文档模型
                  </label>
                  <select
                    value={config.document_model_id}
                    onChange={(e) => {
                      const model = availableModels.find(m => m.model_id === e.target.value);
                      setConfig({ ...config, document_model_id: e.target.value, document_model_name: model?.name || e.target.value });
                    }}
                    className="w-full px-4 py-3 bg-paper border border-paper-dark rounded-xl 
                             text-ink font-serif focus:outline-none focus:border-leather 
                             focus:ring-2 focus:ring-leather/20 transition-all"
                  >
                    {availableModels.map((model) => (
                      <option key={model.model_id} value={model.model_id}>
                        {model.name} ({model.provider})
                        {model.supports_vision ? ' 🧿' : ''}
                        {model.supports_thinking ? ' 💭' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedDocModel && (
                  <div className="p-4 bg-paper rounded-xl">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-semibold text-ink-light">提供商：</span>
                        <span className="text-ink font-serif">{selectedDocModel.provider}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-ink-light">视觉能力：</span>
                        <span className={`font-serif ${selectedDocModel.supports_vision ? 'text-green-600' : 'text-gray-500'}`}>
                          {selectedDocModel.supports_vision ? '✓ 支持' : '✗ 不支持'}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-ink-light">思考能力：</span>
                        <span className={`font-serif ${selectedDocModel.supports_thinking ? 'text-green-600' : 'text-gray-500'}`}>
                          {selectedDocModel.supports_thinking ? '✓ 支持' : '✗ 不支持'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* API密钥配置 */}
            <div className="bg-white rounded-2xl shadow-md p-6 border border-paper-dark">
              <h3 className="text-xl font-bold text-ink mb-4 font-serif flex items-center">
                <span className="mr-2">🔑</span> API密钥配置
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-light mb-2 font-serif">
                    API密钥
                    {selectedChatModel?.requires_api_key && (
                      <span className="ml-2 text-xs bg-gold/20 text-gold px-2 py-1 rounded-full">
                        必需
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={config.api_key}
                      onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                      placeholder={selectedChatModel?.requires_api_key ? '请输入API密钥...' : '该模型不需要API密钥'}
                      disabled={!selectedChatModel?.requires_api_key}
                      className="w-full px-4 py-3 pr-20 bg-paper border border-paper-dark rounded-xl 
                               text-ink font-serif focus:outline-none focus:border-leather 
                               focus:ring-2 focus:ring-leather/20 transition-all
                               disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink 
                               transition-colors text-sm font-serif"
                    >
                      {showApiKey ? '隐藏' : '显示'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={handleTestConnection}
                    disabled={testing}
                    className={`px-6 py-3 rounded-xl font-serif transition-all duration-300 ${
                      testing
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : connectionStatus === 'success'
                        ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
                        : connectionStatus === 'error'
                        ? 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200'
                        : 'bg-leather text-white hover:bg-leather-light shadow-md hover:shadow-lg'
                    }`}
                  >
                    {testing ? '⏳ 测试中...' : '🔗 测试连接'}
                  </button>
                  
                  <div className={`flex items-center gap-2 font-serif text-sm ${
                    connectionStatus === 'success' ? 'text-green-600' :
                    connectionStatus === 'error' ? 'text-red-600' :
                    'text-gray-400'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      connectionStatus === 'success' ? 'bg-green-500 animate-pulse' :
                      connectionStatus === 'error' ? 'bg-red-500' :
                      'bg-gray-300'
                    }`}></span>
                    {connectionStatus === 'success' ? '连接正常' :
                     connectionStatus === 'error' ? '连接失败' :
                     '未测试'}
                  </div>
                </div>
              </div>
            </div>

            {/* AI模式设置 */}
            <div className="bg-white rounded-2xl shadow-md p-6 border border-paper-dark">
              <h3 className="text-xl font-bold text-ink mb-4 font-serif flex items-center">
                <span className="mr-2">🎛️</span> AI功能设置
              </h3>
              
              <div className="space-y-6">
                {/* 思考能力开关 */}
                <div className="flex items-center justify-between p-4 bg-paper rounded-xl">
                  <div className="flex-1">
                    <div className="font-semibold text-ink font-serif mb-1">💭 思考过程</div>
                    <div className="text-sm text-ink-light font-serif">
                      启用后AI将显示思考推理过程（仅支持qwen3.5、gemma4、deepseek-r1等模型）
                      {!selectedModel?.supports_thinking && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                          当前模型不支持
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setConfig({ ...config, enable_thinking: !config.enable_thinking })}
                    disabled={!selectedModel?.supports_thinking}
                    className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                      config.enable_thinking ? 'bg-leather' : 'bg-gray-300'
                    } ${!selectedModel?.supports_thinking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                        config.enable_thinking ? 'left-8' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* AI识图开关 */}
                <div className="flex items-center justify-between p-4 bg-paper rounded-xl">
                  <div className="flex-1">
                    <div className="font-semibold text-ink font-serif mb-1">🧿 AI识图功能</div>
                    <div className="text-sm text-ink-light font-serif">
                      启用后可从图片中提取文字内容
                      {!selectedModel?.supports_vision && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                          当前模型不支持
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setConfig({ ...config, enable_vision: !config.enable_vision })}
                    disabled={!selectedModel?.supports_vision}
                    className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                      config.enable_vision ? 'bg-leather' : 'bg-gray-300'
                    } ${!selectedModel?.supports_vision ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                        config.enable_vision ? 'left-8' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* 当前状态提示 */}
                <div className={`p-4 rounded-xl border-l-4 ${
                  !selectedModel?.requires_api_key || config.api_key
                    ? 'bg-green-50 border-green-500'
                    : 'bg-amber-50 border-amber-500'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className="text-xl">
                      {!selectedModel?.requires_api_key || config.api_key ? '🟢' : '🟡'}
                    </span>
                    <div>
                      <div className="font-semibold text-ink font-serif mb-1">
                        当前运行状态
                      </div>
                      <div className="text-sm text-ink-light font-serif">
                        {selectedModel?.requires_api_key && !config.api_key ? (
                          <>
                            <span className="text-amber-600 font-semibold">请配置API密钥</span>
                            {' '} - 使用 {selectedModel?.name} 进行智能处理
                          </>
                        ) : (
                          <>
                            <span className="text-green-600 font-semibold">AI增强模式已启用</span>
                            {' '} - 使用 {selectedModel?.name} 进行智能处理
                            {config.enable_thinking && selectedModel?.supports_thinking && (
                              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                💭 思考已启用
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 保存按钮 */}
            <div className="flex justify-end gap-4 pt-4">
              <button
                onClick={() => fetchConfig()}
                className="px-6 py-3 rounded-xl font-serif border border-paper-dark 
                         text-ink hover:bg-paper-dark transition-all"
              >
                重置
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className={`px-8 py-3 rounded-xl font-serif transition-all duration-300 ${
                  saving
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-leather text-white hover:bg-leather-light shadow-lg hover:shadow-xl'
                }`}
              >
                {saving ? '💾 保存中...' : '💾 保存配置'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;