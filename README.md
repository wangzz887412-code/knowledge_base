# 智能知识库系统

一个基于 Django + Vue 的智能文档管理和问答系统，支持多种AI模型进行文档摘要和智能问答。

## 功能特点

- 📁 **文档管理**: 支持上传、查看、分类和搜索文档
- 🤖 **AI摘要**: 使用AI模型自动生成文档摘要
- 💬 **智能问答**: 基于文档内容进行智能问答
- 🏷️ **自动标签**: AI自动生成文档标签和分类
- 🗂️ **思维导图**: 根据文档内容生成思维导图
- 🔍 **全文搜索**: 支持文档内容搜索和高亮显示
- 📱 **响应式设计**: 支持多种设备访问

## 技术栈

### 后端
- Python 3.10+
- Django 5.x
- Django REST Framework
- PostgreSQL
- Redis
- ChromaDB (向量数据库)
- Ollama (本地AI模型支持)

### 前端
- Vue 3 + TypeScript
- Vite
- TailwindCSS 3
- Framer Motion (动画)
- Lucide Icons

## 快速开始

### 环境要求
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- Redis (可选，用于任务队列)
- Ollama (可选，用于本地AI模型)

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd knowledge_base2.0
```

2. **后端安装**
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
```

3. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等
```

4. **数据库迁移**
```bash
python manage.py makemigrations
python manage.py migrate
```

5. **创建超级用户**
```bash
python manage.py createsuperuser
```

6. **启动后端服务**
```bash
python manage.py runserver 0.0.0.0:8000
```

7. **前端安装**
```bash
cd ../frontend
npm install
npm run dev
```

### 配置Ollama (可选)

1. 安装Ollama: https://ollama.com/
2. 拉取模型:
```bash
ollama pull qwen3:0.8b
ollama pull gemma2:2b
```

## API文档

后端服务启动后，访问 `http://localhost:8000/api/docs/` 查看API文档。

## 项目结构

```
knowledge_base2.0/
├── backend/                 # 后端代码
│   ├── apps/               # Django应用
│   │   ├── ai/            # AI服务模块
│   │   ├── files/         # 文件管理模块
│   │   └── users/         # 用户管理模块
│   ├── config/            # Django配置
│   └── media/             # 上传文件存储
├── frontend/              # 前端代码
│   └── src/
│       ├── components/    # 组件
│       ├── pages/         # 页面
│       └── contexts/      # 状态管理
├── .gitignore            # Git忽略配置
└── README.md             # 项目说明
```

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！