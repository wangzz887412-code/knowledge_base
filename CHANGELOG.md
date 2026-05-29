# 更新日志 v2.2

## 📅 更新日期
2026-05-29

## ✨ 新增功能

### 1. 忘记密码 / 密码重置
- **新增忘记密码页面**：`frontend/src/pages/ForgotPasswordPage.tsx`
- **新增密码重置 Token 模型**：`backend/apps/users/models.py` - `PasswordResetToken`
  - UUID Token 生成，支持过期验证
  - Token 使用后自动标记为已使用
- **新增密码重置 API**：`POST /api/users/password-reset/`
  - 输入用户名获取临时密码
  - 临时密码登录后可在设置中修改
- **登录页面新增"忘记密码"链接**

### 2. 皮卡丘桌宠升级（DesktopPetV2）
- **Canvas 精灵动画渲染**：替代旧版 CSS 动画，流畅度大幅提升
- **新增模块化架构**：`frontend/src/components/pika-pet/`
  - `index.tsx` - 桌宠主组件（DesktopPetV2）
  - `PetSpriteCanvas.tsx` - Canvas 精灵动画渲染
  - `usePetBehavior.ts` - 用户行为监视 Hook
  - `config.ts` - 桌宠配置（动画帧数、FPS、超时设置）
- **智能行为检测**：
  - idle：空闲动画（6帧循环）
  - idle-busy：忙碌模式（10秒内快速操作>5次，加速动画）
  - sleep：浅睡（30秒无操作）
  - sleep-deep：深睡（切换到其他标签页/失焦，速度减半）
  - skill：技能动画（双击触发）
- **与文件处理任务联动**：通过 TaskContext 感知上传和处理进度
- **位置记忆**：通过 localStorage 持久化桌宠位置
- **关闭按钮**：右上角 ✕ 按钮隐藏桌宠

### 3. 任务上下文（TaskContext）
- **新增 `frontend/src/contexts/TaskContext.tsx`**
- 提供全局任务状态管理：idle / uploading / processing / completed / failed
- 桌宠根据任务状态自动切换行为
- 支持进度和消息传递

## 📦 新增文件

- `frontend/src/pages/ForgotPasswordPage.tsx` - 忘记密码页面
- `frontend/src/components/pika-pet/index.tsx` - 皮卡丘桌宠主组件
- `frontend/src/components/pika-pet/PetSpriteCanvas.tsx` - Canvas 精灵动画渲染
- `frontend/src/components/pika-pet/usePetBehavior.ts` - 用户行为监视 Hook
- `frontend/src/components/pika-pet/config.ts` - 桌宠配置
- `frontend/src/components/pika-pet/README.md` - 桌宠模块说明
- `frontend/src/contexts/TaskContext.tsx` - 任务上下文
- `backend/apps/users/migrations/0003_passwordresettoken.py` - 密码重置 Token 迁移

## 🔧 修改文件

### 后端
- `backend/apps/users/models.py` - 新增 PasswordResetToken 模型
- `backend/apps/users/serializers.py` - 新增密码重置序列化器
- `backend/apps/users/urls.py` - 新增密码重置路由
- `backend/apps/users/views.py` - 新增密码重置视图
- `backend/.env.example` - 新增邮件配置示例

### 前端
- `frontend/src/App.tsx` - 使用 DesktopPetV2 + TaskProvider + ForgotPasswordPage 路由
- `frontend/src/components/DesktopPet.tsx` - 旧版桌宠保留兼容
- `frontend/src/components/MindMapViewer.tsx` - 思维导图优化
- `frontend/src/components/MindMapRenderer.tsx` - 思维导图渲染优化
- `frontend/src/components/FileCard.tsx` - 文件卡片优化
- `frontend/src/components/SearchBar.tsx` - 搜索栏优化
- `frontend/src/components/Sidebar.tsx` - 侧边栏优化
- `frontend/src/components/MarkdownRenderer.tsx` - Markdown 渲染优化
- `frontend/src/pages/Dashboard.tsx` - 仪表盘优化
- `frontend/src/pages/LoginPage.tsx` - 新增忘记密码链接
- `frontend/src/pages/StreamTestPage.tsx` - 流式测试页面
- `frontend/src/index.css` - 样式更新
- `frontend/tailwind.config.js` - Tailwind 配置更新
- `frontend/package.json` - 依赖更新

## 🔒 隐私保护

- 移除 USER_GUIDE.md 中的用户名和密码信息
- 移除 LOG_GUIDE.md 中的本地绝对路径和用户名
- 所有 API 密钥和密码不会上传到仓库
- 数据库文件和上传文件不会被追踪

---

# 更新日志 v2.0

## 📅 更新日期
2026-05-27

## ✨ 新增功能

### 1. AI 文档摘要优化
- **优化摘要生成提示词**：生成结构清晰、视觉美观的 Markdown 格式摘要
- **新增摘要结构**：
  - 📄 一句话概述
  - 🎯 核心要点（列表形式）
  - 💡 关键概念（带解释）
  - 📖 详细内容（分点说明）
  - ✅ 总结
- **增强可读性**：使用 emoji 图标（📌、💡、🎯等）增强视觉效果

### 2. AI 思维导图优化
- **优化导图生成提示词**：生成结构清晰、层次分明的思维导图
- **新增导图分类**：
  - 🔷 定义概念
  - ⚡ 核心原理
  - 🛠️ 方法技术
  - 🌐 应用场景
  - 🔗 关联知识
- **优化节点命名**：使用规范的 ID 命名规范

### 3. AI 文档标签优化
- **优化标签生成提示词**：提取更具代表性和检索价值的标签
- **新增标签维度**：
  - 🏷️ 主题领域
  - 💻 技术栈
  - 🎯 应用场景
  - 📚 方法论
  - 🔑 核心术语

### 4. Markdown 渲染组件
- **新增 `MarkdownRenderer` 组件**：`frontend/src/components/MarkdownRenderer.tsx`
- **特性**：
  - 美观的代码块样式（深色主题、语法高亮）
  - 表格横向滚动支持
  - 加粗、斜体、链接等格式优化
  - 引用块美化
  - 调试日志支持（便于开发调试）
- **组件优势**：
  - 专门优化了代码块和表格的渲染
  - 添加了调试日志，方便追踪数据流
  - 响应式设计，适配各种屏幕

### 5. 页面切换优化
- **启用 React 懒加载**：`App.tsx`
- **优势**：
  - 页面按需加载，减少初始加载时间
  - 优雅的加载动画
  - 提升整体应用性能

### 6. AI 服务修复
- **修复 API 密钥检测问题**：`apps/files/views.py`
  - 正确支持新的密钥存储格式（`api_keys` 字典）
  - 修复了文档分析时的 API 密钥获取逻辑
  
- **修复智谱 API 兼容性问题**：`apps/ai/services.py`
  - 简化智谱 API 的参数传递
  - 移除了不兼容的 `max_tokens`、`temperature` 等参数
  - 仅保留必要的 `model`、`messages`、`stream` 参数

### 7. 知识库到 AI 助手切换优化
- **新增快捷操作**：Dashboard 页面添加"🤖 AI 助手"按钮
- **智能文档传递**：从知识库跳转到 AI 助手时自动携带文档 ID
- **自动文档选择**：AI 聊天页面支持从 URL 参数获取文档 ID 并自动选择

### 8. AI 聊天功能修复
- **修复知识库文档选择 bug**：`AIChatPage.tsx`
  - 修复了 `handleFileToggle` 函数只更新 `selectedFiles` 而非 `selectedKbDocs` 的问题
  - 确保从知识库选择的文档能正确发送给 AI

### 9. 文件上传进度轮询优化
- **修复轮询逻辑 bug**：`Dashboard.tsx`
  - 使用局部变量 `interval` 替代状态变量来清除定时器
  - 避免因状态更新延迟导致的定时器泄漏
  - 使用真实进度数据替代随机数

## 🔧 代码清理

### 移除未使用的导入和变量
- `Dashboard.tsx`：
  - 移除未使用的 `useCallback` 导入
  - 移除未使用的 `pollingFileId` 状态变量
- 移除重复的 `selectedFiles` 相关逻辑

### 类型安全优化
- 添加类型断言修复 `Element` 类型错误
- 优化定时器清理逻辑

## 📦 新增文件

- `frontend/src/components/MarkdownRenderer.tsx` - Markdown 渲染组件
- `frontend/src/components/CanvasNotes.tsx` - 画布笔记组件
- `backend/apps/files/migrations/0005_file_source.py` - 文件来源字段迁移
- `backend/apps/files/migrations/0006_add_keywords_field.py` - 关键词字段迁移

## 🐛 Bug 修复

1. **文档摘要生成失败**
   - 修复原因：智谱 API 参数不兼容
   - 修复方案：简化 API 调用参数

2. **API 密钥检测错误**
   - 修复原因：未正确获取 `api_keys` 字典中的密钥
   - 修复方案：添加 `get_provider_api_key()` 方法支持

3. **知识库文档选择无效**
   - 修复原因：`handleFileToggle` 更新了错误的状态变量
   - 修复方案：统一使用 `selectedKbDocs` 状态

4. **页面切换卡顿**
   - 修复原因：所有页面同步加载
   - 修复方案：启用 React 懒加载

5. **轮询定时器泄漏**
   - 修复原因：使用状态变量清除定时器时存在延迟
   - 修复方案：使用局部变量立即清除

## 🔒 隐私保护

- 所有测试文件已添加到 `.gitignore`
- API 密钥和密码不会上传到仓库
- 数据库文件和上传文件不会被追踪

## 📝 更新文件清单

### 后端修改
- `backend/apps/ai/services.py` - AI 服务优化
- `backend/apps/ai/views.py` - AI 视图优化
- `backend/apps/files/models.py` - 文件模型
- `backend/apps/files/serializers.py` - 文件序列化器
- `backend/apps/files/views.py` - 文件视图修复
- `backend/apps/users/models.py` - 用户模型

### 前端修改
- `frontend/src/App.tsx` - 启用懒加载
- `frontend/src/components/FileCard.tsx` - 文件卡片组件
- `frontend/src/components/FileDetailModal.tsx` - 文件详情弹窗
- `frontend/src/components/MarkdownRenderer.tsx` - 新增 Markdown 渲染组件
- `frontend/src/pages/AIChatPage.tsx` - AI 聊天页面修复
- `frontend/src/pages/Dashboard.tsx` - Dashboard 页面优化
- `frontend/src/pages/HelpPage.tsx` - 帮助页面
- `frontend/src/pages/SettingsPage.tsx` - 设置页面
- `frontend/package.json` - 依赖管理
- `frontend/package-lock.json` - 依赖锁定

## 🎯 测试结果

✅ AI 摘要生成测试通过
✅ Markdown 渲染测试通过
✅ 页面切换性能提升
✅ API 密钥获取正常
✅ 文档标签生成正常

## 🚀 后续计划

- [ ] 添加更多 Markdown 格式支持
- [ ] 优化思维导图交互体验
- [ ] 添加文档搜索功能
- [ ] 实现文档分享功能
- [ ] 添加更多 AI 模型支持

## 📞 反馈与建议

如果您在使用过程中遇到任何问题或有建议，请提交 Issue 或 Pull Request。

---

**感谢您的使用！** 🎉
