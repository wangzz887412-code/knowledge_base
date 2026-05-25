# 文档处理日志说明

## 📋 日志查看方法

### 1. 查看后端日志
在运行后端的终端窗口中查看实时日志输出：

```bash
cd D:\trae\knowledge_base2.0\backend
python manage.py runserver
```

### 2. 日志格式说明

所有关键节点都添加了 `[TAG]` 前缀的日志，方便筛选：

| 日志前缀 | 说明 | 示例 |
|---------|------|------|
| `[FILE_PROCESSING]` | 文件处理流程 | 上传、文本提取、进度更新 |
| `[AI_SUMMARY]` | AI摘要生成 | 模型调用、结果处理 |
| `[AI_TAGS]` | AI标签生成 | 标签提取、处理 |
| `[TAGS_AUTO]` | 自动标签生成 | AI/关键词切换 |
| `[KEYWORDS]` | 关键词匹配 | 备用方案日志 |

### 3. 日志级别

| 符号 | 级别 | 说明 |
|------|------|------|
| `✅` | 成功 | 操作成功完成 |
| `❌` | 错误 | 操作失败 |
| `⚠️` | 警告 | 需要注意但不致命 |
| `📝` | 信息 | 一般信息 |
| `====` | 分隔 | 重要阶段开始/结束 |

## 📊 日志流程示例

### 成功流程
```
[FILE_PROCESSING] ============================================================
[FILE_PROCESSING] 开始处理文件: test.txt (ID: 25)
[FILE_PROCESSING] 用户: wzz
[FILE_PROCESSING] 用户AI配置: {'model_id': 'ollama:qwen3.5:0.8b', ...}
[FILE_PROCESSING] ============================================================
[FILE_PROCESSING] 阶段1: 开始提取文本...
[FILE_PROCESSING] 文件路径: D:\...\files\25\test.txt
[FILE_PROCESSING] ✓ TXT/MD文本提取成功，长度: 1234 字符
[FILE_PROCESSING] ✓ 文本提取完成，总长度: 1234 字符
[FILE_PROCESSING] 阶段2: 开始生成AI摘要...
[FILE_PROCESSING] - 模型ID: ollama:qwen3.5:0.8b
[FILE_PROCESSING] - API密钥: 未设置
[FILE_PROCESSING] 进度更新: 30% - 正在生成AI摘要
[AI_SUMMARY] 开始生成AI摘要...
[AI_SUMMARY] 提取文本长度: 1234 字符
[AI_SUMMARY] 使用模型: ollama:qwen3.5:0.8b
[AI_SUMMARY] API密钥: 未设置
[AI_SUMMARY] 模型配置: qwen3.5:0.8b
[AI_SUMMARY] 提供商: Ollama
[AI_SUMMARY] 需要API密钥: False
[AI_SUMMARY] Ollama模型，无需API密钥
[AI_SUMMARY] 正在调用AI服务生成摘要...
[AI_SUMMARY] 发送文本长度: 1234 字符
[AI_SUMMARY] 调用AI服务，task_type=summarize
[AI_SUMMARY] AI服务返回: success=True
[AI_SUMMARY] ✓ 摘要生成成功，长度: 156 字符
[AI_SUMMARY] 摘要内容: 智能计算是一门融合了人工智能、计算机科学...
[FILE_PROCESSING] AI摘要生成完成，长度: 156 字符
[FILE_PROCESSING] 摘要预览: 智能计算是一门融合了人工智能...
[FILE_PROCESSING] 进度更新: 60% - AI摘要完成，生成思维导图
[FILE_PROCESSING] 开始生成思维导图...
[FILE_PROCESSING] 思维导图生成完成
[FILE_PROCESSING] 进度更新: 100% - 处理完成
[FILE_PROCESSING] 阶段3: 开始生成标签和分类...
[AI_TAGS] 开始生成AI标签...
[AI_TAGS] API密钥已配置，使用AI生成标签
[AI_TAGS] 调用AI服务生成标签...
[AI_TAGS] AI服务返回: success=True
[AI_TAGS] ✓ 标签生成成功: ['技术文档', '学习资料', '人工智能']
[FILE_PROCESSING] ✅ 文件处理全部完成: test.txt (ID: 25)
[FILE_PROCESSING] ============================================================
```

### 失败流程示例

#### 情况1: API密钥未配置
```
[AI_SUMMARY] 开始生成AI摘要...
[AI_SUMMARY] 使用模型: gpt-4o-mini
[AI_SUMMARY] API密钥: 未设置
[AI_SUMMARY] 模型配置: GPT-4o Mini
[AI_SUMMARY] 提供商: OpenAI
[AI_SUMMARY] 需要API密钥: True
[AI_SUMMARY] ⚠ 模型需要API密钥但未提供
[AI_SUMMARY] 用户 wzz 未配置API密钥，无法生成AI摘要
```

#### 情况2: AI服务调用失败
```
[AI_SUMMARY] 正在调用AI服务生成摘要...
[AI_SUMMARY] AI服务返回: success=False
[AI_SUMMARY] AI服务错误: Connection timeout
[AI_SUMMARY] ✗ AI摘要生成失败: Connection timeout
```

#### 情况3: Ollama连接失败
```
[AI_SUMMARY] Ollama模型，无需API密钥
[AI_SUMMARY] 正在调用AI服务生成摘要...
[AI_SUMMARY] AI服务返回: success=False
[AI_SUMMARY] AI服务错误: HTTPConnectionPool(host='localhost', port=11434): Connection refused
[AI_SUMMARY] ✗ AI摘要生成失败: HTTPConnectionPool...
```

## 🔍 常见问题排查

### 1. 摘要未生成
**检查项**:
```
[AI_SUMMARY] ⚠ 模型需要API密钥但未提供
```
→ **解决**: 在设置页面配置API密钥或切换到Ollama模型

### 2. Ollama连接失败
**检查项**:
```
requests.exceptions.ConnectionError: HTTPConnectionPool(host='localhost', port=11434)
```
→ **解决**: 
1. 确认Ollama已安装: `ollama --version`
2. 启动Ollama服务: `ollama serve`
3. 验证服务: `curl http://localhost:11434/api/tags`

### 3. AI服务超时
**检查项**:
```
requests.exceptions.ReadTimeout: HTTPConnectionPool(...): Read timed out
```
→ **解决**:
1. Ollama模型需要较长时间处理
2. 检查模型是否正在运行
3. 尝试使用更小的模型 (qwen3.5:0.8b)

### 4. 模型不匹配
**检查项**:
```
[AI_SUMMARY] 使用模型: ollama:qwen3.5:0.8b
[AI_SUMMARY] AI服务返回: success=False
[AI_SUMMARY] AI服务错误: model not found
```
→ **解决**: 
1. 确认模型已安装: `ollama list`
2. 拉取模型: `ollama pull qwen3.5:0.8b`

## 📝 日志过滤技巧

### Windows PowerShell
```powershell
# 只看文件处理日志
python manage.py runserver 2>&1 | Select-String "FILE_PROCESSING"

# 只看AI摘要日志
python manage.py runserver 2>&1 | Select-String "AI_SUMMARY"

# 只看错误日志
python manage.py runserver 2>&1 | Select-String "✗|ERROR"
```

### 保存日志到文件
```powershell
python manage.py runserver 2>&1 | Out-File -FilePath "processing.log"
```

## 🎯 快速诊断清单

上传文档后，查看日志确认：

1. ✅ `[FILE_PROCESSING]` 开始处理文件
2. ✅ `[FILE_PROCESSING]` ✓ 文本提取成功
3. ✅ `[AI_SUMMARY]` ✓ 摘要生成成功
4. ✅ `[AI_SUMMARY]` ✓ 摘要内容: ...（显示摘要内容）
5. ✅ `[FILE_PROCESSING]` ✅ 文件处理全部完成

如果第3或4步出现问题，日志会显示具体原因！
