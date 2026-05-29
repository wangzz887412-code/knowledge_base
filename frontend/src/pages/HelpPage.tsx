import React, { useState } from "react";
import { Sidebar } from "../components/Sidebar";

const helpContent = [
  {
    id: "getting-started",
    title: "🎯 快速开始",
    sections: [
      {
        title: "注册与登录",
        content:
          '点击右上角的"注册"按钮，输入用户名和密码即可创建账户。登录后即可开始使用知识库功能。',
      },
      {
        title: "忘记密码",
        content:
          '在登录页面点击"忘记密码？"链接，输入注册时使用的用户名，系统将生成临时密码。使用临时密码登录后，请在设置页面及时修改密码。',
      },
      {
        title: "上传文件",
        content:
          "在仪表盘页面，点击上传区域或拖拽文件到上传区即可上传。支持TXT、MD、PDF、Word、PPT等多种格式。AI 将自动提取文本内容并生成摘要。",
      },
      {
        title: "查看文件",
        content:
          "点击文件卡片即可查看文件详情，包括文件内容、AI 摘要、Obsidian 风格思维导图和笔记。",
      },
    ],
  },
  {
    id: "ai-features",
    title: "🤖 AI 功能",
    sections: [
      {
        title: "AI 模型配置",
        content:
          "在设置页面可以配置 AI 模型，支持 OpenAI（GPT-4o 等）、智谱 GLM（GLM-4.7⭐、GLM-4.6V⭐ 完全免费）、阿里云通义千问、Ollama 本地模型等。智谱 AI 的 API Key 格式为 {id}.{secret}，系统会自动生成 JWT token 鉴权。",
      },
      {
        title: "AI 助手对话",
        content:
          "进入 AI 助手页面，支持多模态对话（文字+图片）。可在聊天页面顶部直接切换 AI 模型，支持流式响应和思考过程展示（GLM-4.7 等支持思考的模型会显示推理过程）。",
      },
      {
        title: "AI 自动摘要",
        content:
          "上传文件后系统自动调用 AI 生成文档摘要，帮助快速了解文档核心内容。",
      },
      {
        title: "AI 思维导图生成",
        content:
          "上传文件后系统先快速生成基础版思维导图，同时后台异步调用 AI 深度分析文档，生成精准、完整的思维导图。用户也可随时点击「✨ AI 重新生成」按钮手动触发 AI 精炼。",
      },
      {
        title: "AI 知识点关联分析",
        content:
          "点击「🧠 分析关联」按钮，AI 会自动分析导图中各节点的语义关联、因果关系、对比关系等，建立知识点间连接。支持 6 种关联类型：相关、导致、对比、相似、部分、蕴含。",
      },
    ],
  },
  {
    id: "mindmap",
    title: "🧠 思维导图",
    sections: [
      {
        title: "Obsidian 风格设计",
        content:
          "思维导图采用 Obsidian 风格美学：柔和低饱和度配色体系、贝塞尔曲线连线、左侧彩色 Accent Bar、深紫色根节点 + 光晕效果、层次分明的字号字重、浅色背景 + 毛玻璃控制面板。长时间使用不疲劳。",
      },
      {
        title: "AI 精准生成",
        content:
          'AI 会深度分析文档内容，按五大类别（定义概念、核心原理、方法技术、应用场景、关联知识）组织知识框架。遵循"忠实原文"原则，每个节点源自文档真实内容，不遗漏重要信息。',
      },
      {
        title: "节点操作",
        content:
          "点击选中节点后：可编辑标签、添加子节点、删除节点。支持拖拽创建节点间连接。",
      },
      {
        title: "节点搜索",
        content:
          "顶部工具栏提供搜索框，输入关键词即时匹配所有节点，显示匹配数量，快速定位知识点。",
      },
      {
        title: "导出功能",
        content:
          "支持导出为 PNG 高清图片（2x 分辨率）和 PDF 文档，方便分享和打印。",
      },
      {
        title: "自定义关联",
        content: "可手动添加节点间关联，选择关联类型和描述，自由构建知识网络。",
      },
    ],
  },
  {
    id: "file-management",
    title: "📁 文件管理",
    sections: [
      {
        title: "文件分类",
        content: "在设置页面可以创建自定义分类标签，方便组织和管理文件。",
      },
      {
        title: "版本历史",
        content:
          '每次修改笔记时系统会自动保存版本，点击文件详情中的"版本历史"可以查看和恢复历史版本。',
      },
      {
        title: "书签功能",
        content: "在文件详情页点击收藏按钮可以将文件添加到书签，方便快速访问。",
      },
    ],
  },
  {
    id: "search",
    title: "🔍 搜索功能",
    sections: [
      {
        title: "实时搜索",
        content:
          "点击右上角搜索按钮，输入关键词即可实时搜索文件内容，支持高亮显示匹配内容。",
      },
      {
        title: "搜索筛选",
        content:
          "搜索结果支持按上传时间、文件类型进行筛选，帮助快速定位目标文件。",
      },
    ],
  },
  {
    id: "settings",
    title: "⚙️ 设置",
    sections: [
      {
        title: "AI 模型配置",
        content:
          "选择 AI 聊天模型和文档处理模型，配置对应 API 密钥。支持 OpenAI、智谱 GLM、通义千问、Ollama 等多种平台。",
      },
      {
        title: "存储设置",
        content: "支持本地存储和云端存储两种方式。",
      },
      {
        title: "权限设置",
        content: "每个文件可以设置为仅个人访问或共享给他人。",
      },
    ],
  },
  {
    id: "changelog",
    title: "📢 更新日志",
    sections: [
      {
        title: "v2.2.0 - 密码重置 + 皮卡丘桌宠升级",
        content:
          "新增忘记密码功能：登录页点击"忘记密码"链接，输入用户名获取临时密码，登录后可在设置中修改。桌宠升级为皮卡丘 Canvas 精灵动画（DesktopPetV2），支持 idle/sleep/skill 等多种动画状态，根据用户行为自动切换情绪，与文件处理任务联动。新增 TaskContext 任务上下文，桌宠可感知上传和处理进度。",
      },
      {
        title: "v2.0.0 - 思维导图 Obsidian 风格重构 + 桌面宠物",
        content:
          "思维导图全面升级为 Obsidian 风格美学：柔和配色、贝塞尔曲线连线、彩色 Accent Bar、毛玻璃工具栏。新增 AI 精准生成思维导图功能（支持异步 AI 精炼和手动重新生成）。新增节点搜索、节点统计面板。新增 Codex 风格悬浮桌面宠物，支持拖拽、点击互动和多种情绪状态。修复 Vite 代理和 API 请求认证问题。",
      },
      {
        title: "v1.7.0 - AI思考过程与模型切换优化",
        content:
          "新增AI思考过程显示功能：支持可折叠的思考过程展示。优化AI助手页面：聊天页面顶部可直接切换AI模型，设置页面自动同步。新增模型分类：纯文本模型和多模态模型清晰标注。",
      },
      {
        title: "v1.6.0 - 新增GLM免费大模型支持",
        content:
          "新增智谱GLM系列模型支持，包括GLM-4.7-Flash（最新免费版）、GLM-4.6V-Flash（视觉免费版）等多个免费模型。",
      },
      {
        title: "v1.5.0 - 用户体验全面优化",
        content:
          "新增快速操作卡片、最近使用文档区域、上传进度实时显示、空状态引导、更流畅的动画效果。",
      },
      {
        title: "v1.4.0 - 思维导图布局优化",
        content: "思维导图采用全新放射状布局算法，层级深度控制在4层以内。",
      },
      {
        title: "v1.3.0 - AI知识点关联分析",
        content:
          "新增AI分析知识点关联功能，支持6种关联类型和手动添加自定义关联。",
      },
      {
        title: "v1.2.0 - 思维导图功能",
        content: "思维导图采用深色主题设计，支持导出PNG和PDF格式。",
      },
      {
        title: "v1.0.0 - 基础功能上线",
        content:
          "初始版本发布，包含文件上传、搜索、笔记编辑、文件管理等核心功能。",
      },
    ],
  },
  {
    id: "tips",
    title: "💡 使用技巧",
    sections: [
      {
        title: "免费 AI 模型",
        content:
          "智谱 GLM-4.7-Flash 和 GLM-4.6V-Flash 提供完全免费的 API 调用额度，无需付费即可体验 AI 摘要、思维导图生成和智能对话功能。",
      },
      {
        title: "皮卡丘桌宠",
        content:
          "右下角的皮卡丘桌宠采用 Canvas 精灵动画渲染，支持多种行为状态：空闲时循环播放 idle 动画，检测到鼠标/键盘操作会重置计时，10秒内快速操作超过5次进入忙碌模式（加速动画），30秒无操作进入浅睡状态，切换到其他标签页进入深睡状态。单击桌宠弹出对话气泡，双击触发技能动画，支持拖拽移动，右上角可关闭（位置通过 localStorage 记忆）。桌宠还会根据文件上传和处理任务自动切换状态。",
      },
      {
        title: "快捷键",
        content: "按 Ctrl+K 快速打开搜索框，Ctrl+S 保存笔记。",
      },
      {
        title: "批量上传",
        content: "支持同时选择多个文件进行批量上传，提高效率。",
      },
      {
        title: "Markdown 笔记",
        content:
          "笔记支持 Markdown 格式，可以添加标题、列表、代码块、链接等富文本内容。",
      },
    ],
  },
];

const HelpPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState("getting-started");

  const activeContent = helpContent.find((item) => item.id === activeSection);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-ink mb-2 font-serif">
              📚 帮助中心
            </h2>
            <p className="text-ink-light font-serif">
              了解如何使用知识库的各项功能
            </p>
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
                          ? "bg-[#D4A574]/20 text-[#D4A574] font-bold"
                          : "text-[#8B7355] hover:bg-white hover:text-ink"
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
                        <div
                          key={index}
                          className="bg-[#F5EDE0] rounded-xl p-6"
                        >
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
                <h4 className="font-bold text-yellow-800 mb-3 font-serif">
                  💬 常见问题
                </h4>
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-ink">
                      Q: 文件上传失败怎么办？
                    </p>
                    <p className="text-ink-light font-serif">
                      A:
                      请检查文件大小是否超过限制，确保网络连接正常，尝试重新上传。
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-ink">
                      Q: AI 功能无法使用？
                    </p>
                    <p className="text-ink-light font-serif">
                      A: 请先在设置页面配置 AI 模型和 API 密钥。推荐使用智谱
                      GLM-4.7-Flash（完全免费）。
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-ink">
                      Q: 思维导图内容不准确？
                    </p>
                    <p className="text-ink-light font-serif">
                      A: 点击导图顶部工具栏的「✨ AI 重新生成」按钮，AI
                      会深度分析文档重新生成精准导图。
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-ink">
                      Q: 如何切换 AI 模型？
                    </p>
                    <p className="text-ink-light font-serif">
                      A: 可以在 AI
                      助手页面顶部直接切换模型，或者在设置页面配置默认模型。
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-ink">
                      Q: 桌面宠物怎么用？
                    </p>
                    <p className="text-ink-light font-serif">
                      A:
                      右下角的悬浮宠物可以拖拽到任意位置。单击有粒子特效，双击触发兴奋状态。宠物会定时切换情绪和说话。
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-ink">
                      Q: 如何分享文件给他人？
                    </p>
                    <p className="text-ink-light font-serif">
                      A:
                      在文件详情页开启"共享"开关，生成分享链接发送给他人即可。
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
