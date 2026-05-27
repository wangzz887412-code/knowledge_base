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
        content: '在设置页面可以配置AI模型，支持OpenAI（GPT-4o、GPT-4o Mini）、智谱GLM（GLM-4.7⭐、GLM-4.6V⭐、GLM-4-Flash、GLM-4）、阿里云通义千问（qwen-vl-plus）、Ollama本地模型等多种选项。其中GLM-4.7、GLM-4.6V提供完全免费的调用额度，不需要付费就能使用！智谱AI的API Key格式为：{id}.{secret}，系统会自动生成JWT token进行鉴权。'
      },
      {
        title: '模型分类',
        content: '系统将模型分为两类：纯文本模型（适合写代码、对话、文本处理，如GLM-4.7-Flash）和多模态模型（带V，适合看图说话、视觉问答，如GLM-4.6V-Flash）。在选择模型时会清晰标注，帮助您选择合适的模型。'
      },
      {
        title: 'AI助手对话',
        content: '进入AI助手页面，选择要参考的文档后即可开始对话。在聊天页面顶部可以直接切换AI模型，切换后设置页面会同步更新。支持流式响应，实时显示AI回复。'
      },
      {
        title: '思考过程显示',
        content: '支持显示AI的思考推理过程！选择支持思考功能的模型（如GLM-4.7、GLM-4.6V、GLM-4.7-Flash等）后，AI会先展示思考过程，然后给出最终答案。思考过程可以展开/折叠，参考DeepSeek等热门AI工具的设计风格。'
      },
      {
        title: 'AI摘要',
        content: '上传文件后，系统会自动生成AI摘要，帮助快速了解文档内容。'
      },
      {
        title: '思维导图',
        content: '系统会根据文件内容自动生成思维导图，可视化展示知识结构。思维导图采用深色主题设计，根节点为蓝色，子节点为灰色，每个分支使用不同颜色的连线。支持AI分析知识点关联、自定义添加/编辑/删除节点、手动添加知识点关联。'
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
    id: 'changelog',
    title: '📢 更新日志',
    sections: [
      {
        title: 'v1.7.0 - AI思考过程与模型切换优化',
        content: '新增AI思考过程显示功能：支持可折叠的思考过程展示，类似DeepSeek等热门AI工具的设计风格。优化AI助手页面：在聊天页面顶部可直接切换AI模型，切换后设置页面自动同步。新增模型分类：清晰标注纯文本模型和多模态模型（带V），帮助用户选择合适的模型。修复多项代码问题，提升系统稳定性。'
      },
      {
        title: 'v1.6.0 - 新增GLM免费大模型支持',
        content: '新增智谱GLM系列模型支持，包括多个免费模型：GLM-4.7-Flash（最新免费版）、GLM-4.6V-Flash（视觉免费版）、GLM-4免费版、GLM-4 Flash（快速推理）、GLM-4（旗舰版）。多个免费模型可供选择，适合个人用户体验AI功能。用户可在设置页面选择GLM模型并配置API密钥。'
      },
      {
        title: 'v1.5.0 - 用户体验全面优化',
        content: '根据热门AI工具的最佳实践进行全面体验升级：新增快速操作卡片（快速上传、智能搜索、思维导图）、最近使用文档区域（最多显示4个最近打开的文件）、上传进度实时显示（带进度条和状态文字）、空状态引导、更流畅的动画效果、搜索结果弹窗优化。所有这些改进都遵循信息架构清晰、减少认知负荷、引导用户操作的设计原则。'
      },
      {
        title: 'v1.4.0 - 思维导图布局优化',
        content: '思维导图采用全新放射状布局算法：一级分支呈环形均匀分布在中心节点周围（最多5条），子分支以父节点为中心向外展开，层级深度控制在4层以内，节点间距保持合理留白（≥50像素）。布局遵循热门AI思维导图工具的设计原则，确保内容不重叠、重点突出。'
      },
      {
        title: 'v1.3.0 - AI知识点关联分析',
        content: '新增AI分析知识点关联功能：点击"AI分析关联"按钮，系统会自动分析思维导图中各节点之间的语义关联、因果关系、对比关系等，并自动建立连接。支持手动添加自定义关联，可选择关联类型（相关、导致、对比、相似、部分、蕴含）。支持节点的添加、编辑和删除操作。'
      },
      {
        title: 'v1.2.0 - 思维导图样式升级',
        content: '思维导图采用全新深色主题设计：蓝色根节点、灰色子节点、彩色分支连线，水平排列布局，视觉效果更加清晰美观。支持导出为PNG和PDF格式。'
      },
      {
        title: 'v1.1.0 - AI增强模式',
        content: '新增AI增强模式，支持配置多种AI模型（OpenAI、Ollama等），自动生成文档摘要和思维导图。'
      },
      {
        title: 'v1.0.0 - 基础功能上线',
        content: '初始版本发布，包含文件上传、搜索、笔记编辑、文件管理等核心功能。'
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
                    <p className="font-semibold text-ink">Q: 如何切换AI模型？</p>
                    <p className="text-ink-light font-serif">
                      A: 可以在AI助手页面顶部直接切换模型，或者在设置页面配置默认模型。切换后设置页面会自动同步。
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-ink">Q: 思考过程是什么？如何开启？</p>
                    <p className="text-ink-light font-serif">
                      A: 思考过程是AI在回答问题时的推理过程展示。选择支持思考功能的模型（如GLM-4.7、GLM-4.6V等）即可自动启用，思考过程可以展开/折叠查看。
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-ink">Q: 纯文本模型和多模态模型有什么区别？</p>
                    <p className="text-ink-light font-serif">
                      A: 纯文本模型（不带V）适合写代码、对话、文本处理；多模态模型（带V）可以处理图片和视频，适合看图说话、视觉问答。
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
