import React, { useState, useEffect, useRef } from 'react';

const mockStreamResponse = `智谱开放平台（Zhipu AI）作为一家领先的大模型科技公司，其核心价值在于**"智能（智）"**与**"无限可能/篇章（谱）"**。

为了满足不同场景的需求，我为您构思了几个不同维度的口号方案：

### 1. 大气磅礴型（适合品牌宣传片、官网首页）
*   **"智领未来，谱写新篇。"**
    *   *解析：* 巧妙嵌入了品牌名"智"与"谱"，对仗工整，强调引领力和开创性。
*   **"汇聚智脑，开放无界。"**
    *   *解析：* 强调了平台汇聚了强大的AI能力，以及其开放共享的特性。

### 2. 赋能开发者型（适合开发者社区、技术文档、招聘）
*   **"你的创意，智谱生花。"**
    *   *解析：* "生花"既指写文章妙笔生花，也暗指AI模型的生成能力，非常贴切。

### 3. 简洁有力型（适合Logo旁、APP启动页）
*   **"智谱开放平台，无限智能。"**
*   **"智高无界，谱写非凡。"**

**💡 专家建议：**
如果您希望突出**技术领先性**，推荐使用 **"智领未来，谱写新篇"**。`;

const mockThinkingProcess = [
  "用户需要为智谱开放平台创作营销口号",
  "分析品牌核心价值：智能、开放、创新",
  "考虑不同使用场景：品牌宣传、开发者社区、简洁展示",
  "构思多个维度的口号方案",
  "提供专业建议帮助用户选择"
];

interface Message {
  role: 'user' | 'assistant' | 'thinking';
  content: string;
}

export default function StreamTestPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [showThinking, setShowThinking] = useState(false);
  const [currentThinking, setCurrentThinking] = useState('');
  const [progress, setProgress] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentMessage]);

  const startStreaming = () => {
    setIsStreaming(true);
    setCurrentMessage('');
    setShowThinking(true);
    setCurrentThinking('');
    setProgress(0);
    
    setMessages([
      { role: 'user', content: '作为一名营销专家，请为智谱开放平台创作吸引人的口号' }
    ]);

    let thinkingIndex = 0;
    const thinkingInterval = setInterval(() => {
      if (thinkingIndex < mockThinkingProcess.length) {
        setCurrentThinking(mockThinkingProcess[thinkingIndex]);
        thinkingIndex++;
      } else {
        clearInterval(thinkingInterval);
        setShowThinking(false);
        startContentStreaming();
      }
    }, 800);
  };

  const startContentStreaming = () => {
    let charIndex = 0;
    const speed = 30;
    
    const streamInterval = setInterval(() => {
      if (charIndex < mockStreamResponse.length) {
        setCurrentMessage(mockStreamResponse.substring(0, charIndex + 1));
        setProgress(Math.round((charIndex / mockStreamResponse.length) * 100));
        charIndex++;
      } else {
        clearInterval(streamInterval);
        setIsStreaming(false);
        setMessages(prev => [...prev, { role: 'assistant', content: mockStreamResponse }]);
        setCurrentMessage('');
      }
    }, speed);
  };

  const resetTest = () => {
    setMessages([]);
    setCurrentMessage('');
    setCurrentThinking('');
    setIsStreaming(false);
    setProgress(0);
    setShowThinking(false);
  };

  const renderMarkdown = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|### .+|^\* .+|解析：)/gm);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-blue-500">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('### ')) {
        return <h3 key={index} className="text-lg font-bold mt-4 mb-2 text-gray-800">{part.slice(4)}</h3>;
      }
      if (part.startsWith('* ')) {
        return (
          <div key={index} className="flex items-start gap-2">
            <span className="text-purple-500">•</span>
            <span className="text-gray-700">{part.slice(2)}</span>
          </div>
        );
      }
      if (part === '解析：') {
        return <span key={index} className="text-gray-500 italic ml-4">{part}</span>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🚀 流式输出测试</h1>
          <p className="text-gray-600">模拟GLM-4.7-Flash流式响应效果</p>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={startStreaming}
            disabled={isStreaming}
            className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 ${
              isStreaming
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {isStreaming ? '⏳ 正在生成...' : '🎬 开始流式演示'}
          </button>
          <button
            onClick={resetTest}
            disabled={isStreaming}
            className={`px-6 py-3 rounded-lg font-semibold border-2 transition-all duration-300 ${
              isStreaming
                ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                : 'border-blue-500 text-blue-600 hover:bg-blue-50'
            }`}
          >
            🔄 重置
          </button>
        </div>

        {isStreaming && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>生成进度</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="space-y-6">
            {messages.map((msg, index) => (
              <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                    : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                }`}>
                  <span className="text-white text-sm font-bold">
                    {msg.role === 'user' ? 'U' : 'AI'}
                  </span>
                </div>
                <div className={`max-w-[70%] p-4 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-blue-50 text-blue-800 rounded-br-sm'
                    : 'bg-gray-50 text-gray-800 rounded-bl-sm shadow-md'
                }`}>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {renderMarkdown(msg.content)}
                  </div>
                </div>
              </div>
            ))}

            {showThinking && (
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500">
                  <span className="text-white text-sm font-bold">💡</span>
                </div>
                <div className="max-w-[70%] p-4 rounded-2xl bg-amber-50 text-amber-800 rounded-bl-sm border border-amber-200">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
                    <span className="text-sm font-medium">思考中...</span>
                  </div>
                  <p className="mt-2 text-sm italic">{currentThinking}</p>
                </div>
              </div>
            )}

            {isStreaming && currentMessage && (
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600">
                  <span className="text-white text-sm font-bold">AI</span>
                </div>
                <div className="max-w-[70%] p-4 rounded-2xl bg-gray-50 text-gray-800 rounded-bl-sm shadow-md">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {renderMarkdown(currentMessage)}
                    <span className="inline-block w-2 h-4 bg-gray-400 rounded animate-pulse ml-1"></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="mt-8 p-6 bg-white rounded-xl shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📋 测试说明</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="font-semibold text-blue-800 mb-2">🎯 测试目标</div>
              <ul className="space-y-1 list-disc list-inside text-gray-600">
                <li>验证流式输出的实时展示</li>
                <li>测试思考过程的动画效果</li>
                <li>检查Markdown渲染正确性</li>
                <li>验证进度条显示</li>
              </ul>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="font-semibold text-purple-800 mb-2">⚙️ 技术特点</div>
              <ul className="space-y-1 list-disc list-inside text-gray-600">
                <li>字符级流式输出（30ms/字符）</li>
                <li>思考过程模拟（800ms/步骤）</li>
                <li>实时进度条更新</li>
                <li>平滑滚动到最新消息</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}