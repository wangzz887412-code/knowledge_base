# 智能知识库系统 (Knowledge Base)

一个现代化的智能文档管理和AI问答系统，支持多种AI模型进行文档分析、摘要生成和智能问答。

## 🚀 功能特点

### 📁 文档管理
- **多格式支持**: 支持 PDF、Word、PPT、TXT 等多种文档格式
- **拖拽上传**: 简单易用的文件上传界面
- **文档分类**: 自动分类和标签管理
- **版本控制**: 支持文档版本管理
- **全文搜索**: 支持文档内容搜索和高亮显示

### 🤖 AI 功能
- **智能摘要**: 使用AI模型自动生成文档摘要
- **自动标签**: AI自动为文档生成标签
- **智能问答**: 基于上传的文档进行智能问答
- **多种模型**: 支持OpenAI、通义千问、Ollama本地模型等
- **模型切换**: 从界面直接切换不同的AI模型

### 🧠 智能分析
- **思维导图**: 自动根据文档内容生成思维导图
- **知识图谱**: 可视化展示文档关系
- **语义搜索**: 基于向量数据库的语义搜索

### 📱 用户体验
- **响应式设计**: 完美适配手机、平板和电脑
- **流畅动画**: 使用Framer Motion实现丝滑的交互动画
- **深色/浅色模式**: 支持多种主题切换
- **书签功能**: 收藏重要文档

## 🛠️ 技术栈

### 后端
- **Python 3.10+**
- **Django 5.x** - Web框架
- **Django REST Framework** - API框架
- **PostgreSQL** - 关系型数据库
- **Redis** - 缓存和消息队列
- **ChromaDB** - 向量数据库
- **Celery** - 异步任务
- **Ollama** - 本地AI模型支持

### 前端
- **React 18 + TypeScript**
- **Vite** - 构建工具
- **TailwindCSS 3** - CSS框架
- **React Router** - 路由管理
- **Framer Motion** - 动画库
- **Axios** - HTTP客户端
- **@xyflow/react** - 思维导图渲染

### AI集成
- **OpenAI API** (GPT-4o, GPT-4o-mini)
- **通义千问** (阿里云)
- **Ollama** (本地模型，支持 qwen、gemma、deepseek等)

## 📦 快速开始

### 环境要求

确保你已经安装了以下软件：

- Python 3.10 或更高版本
- Node.js 18 或更高版本
- PostgreSQL 14 或更高版本
- Redis (可选，用于任务队列)
- Ollama (可选，用于本地AI模型)

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
```

### 3. 配置环境变量

复制示例配置文件并编辑：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接等信息：

```env
SECRET_KEY=your-secret-key-here-change-in-production
DEBUG=True
DB_NAME=knowledge_base
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432
REDIS_URL=redis://localhost:6379/0
```

### 4. 数据库设置

```bash
# 创建数据库迁移
python manage.py makemigrations

# 执行迁移
python manage.py migrate

# 创建超级用户
python manage.py createsuperuser
```

### 5. 启动后端服务

```bash
python manage.py runserver 0.0.0.0:8000
```

后端服务将在 [http://localhost:8000](http://localhost:8000) 启动。

### 6. 前端安装

```bash
cd ../frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端服务将在 [http://localhost:5173](http://localhost:5173) 启动。

## 🤖 配置AI模型

### 使用Ollama本地模型

1. 安装Ollama: [https://ollama.com/](https://ollama.com/)

2. 拉取模型：

```bash
# 下载小模型（推荐）
ollama pull qwen2.5:0.5b
ollama pull qwen3.5:0.8b
ollama pull qwen3.5:2b
ollama pull qwen3.5:4b

# 或者下载更大的模型
ollama pull qwen3.5:9b
ollama pull deepseek-r1:7b
```

3. 在系统设置中选择Ollama模型即可使用。

### 使用OpenAI/通义千问API

1. 在系统设置中配置API密钥
2. 选择相应的模型即可

## 📚 API文档

后端服务启动后，访问以下地址查看API文档：

- **Swagger UI**: [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)
- **Admin后台**: [http://localhost:8000/admin/](http://localhost:8000/admin/)

## 🏗️ 项目结构

```
knowledge_base/
├── backend/                      # 后端代码
│   ├── apps/                     # Django应用
│   │   ├── ai/                  # AI服务模块
│   │   │   ├── models.py        # AI模型配置
│   │   │   ├── views.py         # AI视图
│   │   │   ├── services.py      # AI服务
│   │   │   └── urls.py          # AI路由
│   │   ├── files/               # 文件管理模块
│   │   │   ├── models.py        # 文件模型
│   │   │   ├── views.py         # 文件视图
│   │   │   └── serializers.py   # 文件序列化
│   │   └── users/               # 用户管理模块
│   ├── config/                   # Django配置
│   │   ├── settings.py          # 主配置文件
│   │   └── urls.py              # 主路由
│   ├── media/                    # 上传文件存储
│   ├── chroma_db/                # 向量数据库
│   ├── .env.example             # 环境变量示例
│   └── requirements.txt         # Python依赖
├── frontend/                     # 前端代码
│   ├── src/
│   │   ├── components/          # React组件
│   │   │   ├── FileCard.tsx
│   │   │   ├── FileDetailModal.tsx
│   │   │   ├── MindMapViewer.tsx
│   │   │   └── UploadZone.tsx
│   │   ├── pages/               # 页面
│   │   │   ├── Dashboard.tsx    # 仪表盘
│   │   │   ├── AIChatPage.tsx   # AI聊天
│   │   │   ├── SettingsPage.tsx # 设置
│   │   │   └── LoginPage.tsx
│   │   ├── contexts/            # React Context
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── .gitignore                   # Git忽略配置
└── README.md                    # 这个文件
```

## 🎨 界面预览

### 主要页面
- **仪表盘**: 显示文档列表和统计信息
- **上传页面**: 拖拽上传文档
- **AI聊天**: 基于文档的智能问答
- **设置页面**: 配置AI模型

### 核心组件
- **文件卡片**: 显示文档信息、摘要和标签
- **思维导图**: 可视化文档结构
- **模型选择器**: 切换不同的AI模型

## 🔧 开发说明

### 添加新的AI模型

在 `backend/apps/ai/services.py` 中添加新的模型配置：

```python
# SUPPORTED_MODELS 列表中添加
{
    'model_id': 'your-model-id',
    'name': 'Model Name',
    'provider': 'Provider Name',
    'api_base': 'https://api.example.com/v1',
    'requires_api_key': True,
    'supports_vision': False,
    'max_tokens': 4096
}
```

### 前端开发

```bash
cd frontend
npm run dev          # 开发模式
npm run build        # 生产构建
npm run lint         # 代码检查
```

### 后端开发

```bash
cd backend
python manage.py runserver
python manage.py createsuperuser
python manage.py makemigrations
python manage.py migrate
```

## 📖 使用指南

### 上传文档

1. 登录系统
2. 点击上传区域或拖拽文件
3. 等待AI处理完成（生成摘要和标签）

### 使用AI问答

1. 在文档管理页面选择参考文档
2. 进入AI助手页面
3. 输入问题，AI会基于选中的文档回答

### 切换模型

1. 在AI助手页面或设置页面
2. 点击模型选择器
3. 选择已配置的模型

## 🤝 贡献

欢迎贡献！请提交 Issue 和 Pull Request。

### 开发规范

- Python: 遵循 PEP 8
- TypeScript: 遵循项目的 ESLint 配置
- 提交信息: 使用清晰的描述

## 📄 许可证

MIT License

## 📞 支持

如有问题，请提交 Issue 或联系作者。

## 🎉 致谢

- Django 社区
- React 社区
- Ollama 团队
- 所有开源贡献者

---

**Star ⭐ 这个仓库，如果你觉得有用！**
