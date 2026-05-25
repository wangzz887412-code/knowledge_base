import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';

const helpContent = [
  {
    id: 'getting-started',
    title: '🎯 快速开始',
    sections: [
      {
        title: '注册与登录',
        content: '点击右上角的"注册"按钮，输入用户名、邮箱和密码即可创建账户。登录后即可开始使用知识库功能。'
      },
      {
        title: '上传文件',
        content: '在仪表盘页面，点击上传区域或拖拽文件到上传区即可上传。支持TXT、MD、PDF等多种格式。'
      },
      {
        title: '查看文件',
        content: '点击文件卡片即可查看文件详情，包括文件内容、思维导图和笔记。'
      }
    ]
  },
  {
    id: 'file-management',
    title: '📁 文件管理',
    sections: [
      {
        title: '文件分类',
        content: '在设置页面可以创建自定义分类标签，方便组织和管理文件。'
      },
      {
        title: '版本历史',
        content: '每次修改笔记时系统会自动保存版本，点击文件详情中的"版本历史"可以查看和恢复历史版本。'
      },
      {
        title: '书签功能',
        content: '在文件详情页点击收藏按钮可以将文件添加到书签，方便快速访问。'
      }
    ]
  },
  {
    id: 'search',
    title: '🔍 搜索功能',
    sections: [
      {
        title: '实时搜索',
        content: '点击右上角搜索按钮，输入关键词即可实时搜索文件内容，支持高亮显示匹配内容。'
      },
      {
        title: '搜索筛选',
        content: '搜索结果支持按上传时间、文件类型进行筛选，帮助快速定位目标文件。'
      }
    ]
  },
  {
    id: 'ai-features',
    title: '🤖 AI功能',
    sections: [
      {
        title: 'AI模型配置',
        content: '在设置页面可以配置AI模型，支持OpenAI、Ollama本地模型等多种选项。'
      },
      {
        title: 'AI摘要',
        content: '上传文件后，系统会自动生成AI摘要，帮助快速了解文档内容。'
      },
      {
        title: '思维导图',
        content: '系统会根据文件内容自动生成思维导图，可视化展示知识结构。'
      },
      {
        title: '模式切换',
        content: '支持基础模式和AI增强模式切换，AI模式需要配置API密钥。'
      }
    ]
  },
  {
    id: 'settings',
    title: '⚙️ 设置',
    sections: [
      {
        title: '存储设置',
        content: '支持本地存储和云端存储两种方式，云端存储需要配置云服务参数。'
      },
      {
        title: '权限设置',
        content: '每个文件可以设置为仅个人访问或共享给他人，共享文件支持在线预览。'
      },
      {
        title: '数据备份',
        content: '定期备份重要数据，防止数据丢失。'
      }
    ]
  },
  {
    id: 'tips',
    title: '💡 使用技巧',
    sections: [
      {
        title: '快捷键',
        content: '按Ctrl+K快速打开搜索框，按Ctrl+S保存笔记。'
      },
      {
        title: '批量上传',
        content: '支持同时选择多个文件进行批量上传，提高效率。'
      },
      {
        title: '笔记编辑',
        content: '笔记支持Markdown格式，可以添加标题、列表、链接等富文本内容。'
      }
    ]
  }
];

const HelpPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('getting-started');

  const activeContent = helpContent.find(item => item.id === activeSection);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-ink mb-2 font-serif">📚 帮助中心</h2>
            <p className="text-ink-light font-serif">了解如何使用知识库的各项功能</p>
          </div>

          <div className="flex gap-8">
            <div className="w-64 flex-shrink-0">
              <div className="bg-[#F5EDE0] rounded-xl p-4 border border-[#E5DDD0] sticky top-8">
                <h3 className="font-bold text-ink mb-4 font-serif">目录</h3>
                <nav className="space-y-2">
                  {helpContent.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg font-serif transition-all ${
                        activeSection === item.id
                          ? 'bg-[#D4A574]/20 text-[#D4A574] font-bold'
                          : 'text-[#8B7355] hover:bg-white hover:text-ink'
                      }`}
                    >
                      {item.title}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            <div className="flex-1">
              <div className="bg-[#FFFEF9] rounded-xl p-8 border border-[#E5DDD0] shadow-sm">
                {activeContent && (
                  <div>
                    <h3 className="text-2xl font-bold text-ink mb-6 font-serif">
                      {activeContent.title}
                    </h3>
                    <div className="space-y-6">
                      {activeContent.sections.map((section, index) => (
                        <div key={index} className="bg-[#F5EDE0] rounded-xl p-6">
                          <h4 className="font-bold text-ink mb-3 font-serif">
                            {section.title}
                          </h4>
                          <p className="text-ink-light leading-relaxed font-serif">
                            {section.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-6 border border-yellow-200">
                <h4 className="font-bold text-yellow-800 mb-3 font-serif">💬 常见问题</h4>
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-ink">Q: 文件上传失败怎么办？</p>
                    <p className="text-ink-light font-serif">
                      A: 请检查文件大小是否超过限制，确保网络连接正常，尝试重新上传。
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-ink">Q: AI功能无法使用？</p>
                    <p className="text-ink-light font-serif">
                      A: 请在设置页面正确配置API密钥，并确保网络可以访问对应的API服务。
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-ink">Q: 如何分享文件给他人？</p>
                    <p className="text-ink-light font-serif">
                      A: 在文件详情页开启"共享"开关，生成分享链接发送给他人即可。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
