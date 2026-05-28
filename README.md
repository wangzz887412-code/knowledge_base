# 智能知识库系统 (Knowledge Base)

一个现代化的智能文档管理和AI问答系统，支持多种AI模型进行文档分析、摘要生成、思维导图和智能问答。

## 🚀 功能特点

### 📁 文档管理
- **多格式支持**: 支持 PDF、Word、PPT、TXT 等多种文档格式
- **拖拽上传**: 简单易用的文件上传界面，带实时进度显示
- **文档分类**: 自动分类和标签管理
- **书签功能**: 收藏重要文档，快速访问
- **全文搜索**: 支持文档内容搜索和高亮显示

### 🤖 AI 功能
- **智能摘要**: 使用 AI 自动生成文档摘要
- **自动标签/分类**: AI 自动为文档生成标签和分类
- **智能问答**: 基于上传文档的智能问答，支持多模态（文字+图片）
- **多种模型**: 支持 OpenAI、智谱 GLM（免费）、通义千问、Ollama 本地模型
- **模型切换**: 聊天页面顶部一键切换 AI 模型
- **思考过程**: 显示 AI 推理思考过程（支持 GLM-4.7 等模型）

### 🧠 思维导图 (Obsidian 风格)
- **AI 精准生成**: AI 深度分析文档，按五大类别（定义概念/核心原理/方法技术/应用场景/关联知识）组织知识框架
- **Obsidian 风格美学**: 柔和配色、贝塞尔曲线连线、彩色 Accent Bar、毛玻璃工具栏
- **AI 重新生成**: 随时手动触发 AI 精炼，确保内容准确完整
- **节点搜索**: 关键词即时匹配所有节点
- **AI 关联分析**: 自动分析知识点间语义关联，支持 6 种关联类型
- **导出功能**: 支持 PNG（2x 高清）和 PDF 导出

### 🐱 桌面宠物 (Codex 风格)
- 悬浮在屏幕右下角，支持拖拽移动
- 多种情绪状态：空闲、开心、思考、困倦、兴奋
- 点击互动（粒子特效）、双击兴奋
- 定时气泡消息和情绪切换

### 📱 用户体验
- **响应式设计**: 完美适配手机、平板和电脑
- **流畅动画**: Framer Motion 丝滑交互动画
- **书签功能**: 收藏重要文档

## 🛠️ 技术栈

### 后端
- **Python 3.10+**
- **Django 5.x**
- **Django REST Framework**
- **SQLite**（开发）/ PostgreSQL（生产）
- **ChromaDB** - 向量数据库
- **Celery** - 异步任务

### 前端
- **React 18 + TypeScript**
- **Vite** - 构建工具
- **TailwindCSS 3** - CSS 框架
- **React Router** - 路由管理
- **Framer Motion** - 动画库
- **@xyflow/react** - 思维导图渲染

### AI 集成
- **OpenAI API** (GPT-4o 等)
- **智谱 GLM** (GLM-4.7-Flash ⭐免费、GLM-4.6V-Flash ⭐免费)
- **阿里云通义千问**
- **Ollama** (本地模型支持)

## 📦 快速开始

### 环境要求

- Python 3.10+
- Node.js 18+

### 1. 克隆项目

```bash
git clone https://github.com/wangzz887412-code/knowledge_base.git
cd knowledge_base
```

### 2. 后端安装

```bash
cd backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 数据库迁移
python manage.py migrate

# 创建超级用户
python manage.py createsuperuser

# 启动后端
python manage.py runserver
```

后端服务: http://localhost:8000

### 3. 前端安装

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端服务: http://localhost:5174

## 🤖 配置 AI 模型

### 智谱 GLM（推荐，免费额度）
1. 注册 [智谱 AI 开放平台](https://open.bigmodel.cn/)
2. 获取 API Key（格式: `{id}.{secret}`）
3. 在设置页面选择 GLM 模型并填入 API Key
4. GLM-4.7-Flash 和 GLM-4.6V-Flash 提供完全免费额度

### 使用 Ollama 本地模型
```bash
ollama pull qwen2.5:0.5b
ollama pull qwen3.5:4b
```

### 使用 OpenAI / 通义千问 API
在设置页面配置对应 API 密钥即可。

## 🏗️ 项目结构

```
knowledge_base/
├── backend/
│   ├── apps/
│   │   ├── ai/              # AI 服务模块（聊天、音频、思维导图）
│   │   │   ├── services.py  # AI 服务核心逻辑
│   │   │   ├── views.py     # AI API 端点
│   │   │   ├── tasks.py     # 异步任务（文件处理、思维导图生成）
│   │   │   └── models.py    # AI 配置模型
│   │   ├── files/           # 文件管理模块
│   │   └── users/           # 用户管理模块
│   └── config/              # Django 配置
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MindMapViewer.tsx   # 思维导图核心组件（Obsidian 风格）
│   │   │   ├── MindMapRenderer.tsx # 思维导图渲染器
│   │   │   ├── DesktopPet.tsx      # 桌面宠物组件
│   │   │   ├── FileDetailModal.tsx # 文件详情弹窗
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx       # 仪表盘
│   │   │   ├── AIChatPage.tsx      # AI 聊天
│   │   │   ├── SettingsPage.tsx    # 设置
│   │   │   ├── HelpPage.tsx        # 帮助中心
│   │   │   └── LoginPage.tsx
│   │   ├── utils/
│   │   │   └── api.ts             # 统一 API 请求工具
│   │   └── App.tsx
│   └── vite.config.ts             # Vite 配置（含 API 代理）
└── README.md
```

## 📖 使用指南

### 上传文档
1. 登录系统 → 点击上传区域或拖拽文件
2. AI 自动提取文本、生成摘要
3. 后台异步生成 AI 思维导图

### 使用 AI 问答
1. 进入 AI 助手页面
2. 可选：选择参考文档
3. 输入问题，AI 基于文档回答（支持流式响应）

### 思维导图
1. 上传文档后自动生成基础版
2. 点击「✨ AI 重新生成」获得精准 AI 版
3. 点击「🧠 分析关联」建立知识点连接
4. 搜索框快速定位节点

## 📝 版本更新

### v2.1.0 - 思维导图 Obsidian 重构 + 桌面宠物
- 🎨 思维导图全面升级为 Obsidian 风格美学
- 🤖 AI 精准生成思维导图（异步 + 手动重新生成）
- 🔍 节点搜索、节点统计面板
- 🐱 Codex 风格悬浮桌面宠物
- 🔧 修复 Vite 代理和 API 认证问题
- 📚 更新帮助中心和文档

### v2.0.0 - AI 增强
- ✨ AI 思考过程展示
- 🔄 流式响应
- 📊 思维导图渲染器
- 🎯 用户体验全面优化

## 📄 许可证

MIT License

---

**Star ⭐ 这个仓库，如果你觉得有用！**