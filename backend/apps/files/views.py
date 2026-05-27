from rest_framework import viewsets, permissions, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import FileResponse
from .models import Category, File, FileVersion, Bookmark
from .serializers import CategorySerializer, FileSerializer, FileUploadSerializer, FileVersionSerializer, BookmarkSerializer, BookmarkCreateSerializer
import logging
import traceback
import os
import re
from collections import Counter

logger = logging.getLogger(__name__)

def simple_text_summarization(text, max_sentences=3, min_word_count=5):
    """
    不依赖AI模型的简单文本摘要
    使用词频统计和句子重要性评分算法
    
    参数:
        text: 输入文本
        max_sentences: 摘要包含的最大句子数
        min_word_count: 句子的最小词数要求
    
    返回:
        摘要文本
    """
    if not text or len(text.strip()) < 20:
        return text or "暂无内容"
    
    # 1. 分句（支持中文和英文标点）
    sentences = re.split(r'[。！？!?\n]+', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    
    if len(sentences) <= max_sentences:
        return '。'.join(sentences) + '。'
    
    # 2. 分词（简单的基于字符的分词，支持中英文）
    def tokenize(t):
        # 简单分词：保留中文字符、英文单词、数字
        tokens = []
        # 匹配中文
        chinese_chars = re.findall(r'[\u4e00-\u9fa5]', t)
        # 匹配英文单词和数字
        english_tokens = re.findall(r'[a-zA-Z0-9]+', t.lower())
        tokens.extend(chinese_chars)
        tokens.extend(english_tokens)
        return tokens
    
    # 3. 统计词频
    all_words = []
    for sentence in sentences:
        words = tokenize(sentence)
        all_words.extend([w for w in words if w not in CHINESE_STOPWORDS and len(w) >= 1])
    
    word_freq = Counter(all_words)
    
    # 4. 给每个句子评分
    sentence_scores = []
    for i, sentence in enumerate(sentences):
        words = tokenize(sentence)
        # 过滤掉太短的句子
        if len([w for w in words if w not in CHINESE_STOPWORDS]) < min_word_count:
            continue
            
        score = 0
        for word in words:
            if word in word_freq:
                score += word_freq[word]
        
        # 位置权重：开头和结尾的句子更重要
        position_weight = 1.0
        if i < len(sentences) * 0.3:
            position_weight = 1.3
        elif i > len(sentences) * 0.7:
            position_weight = 1.2
            
        # 句子长度权重：不要太短或太长
        length_weight = 1.0
        if len(words) < 8:
            length_weight = 0.7
        elif len(words) > 50:
            length_weight = 0.8
            
        total_score = score * position_weight * length_weight
        sentence_scores.append((i, sentence, total_score))
    
    # 5. 按分数排序，选择前N个句子
    sentence_scores.sort(key=lambda x: x[2], reverse=True)
    selected_indices = [s[0] for s in sentence_scores[:max_sentences]]
    selected_indices.sort()  # 按原文顺序排列
    
    # 6. 生成摘要
    summary = '。'.join([sentences[i] for i in selected_indices]) + '。'
    return summary

# 中文停用词列表
CHINESE_STOPWORDS = {
    '的', '了', '和', '是', '在', '这', '那', '有', '我', '你', '他',
    '她', '们', '这', '那', '是', '了', '在', '有', '和', '的',
    '和', '是', '在', '这', '那', '了', '有', '的', '和', '是',
    '就', '都', '而', '及', '与', '或', '但', '也', '还', '已', '被',
    '很', '也', '就', '都', '而', '及', '与', '或', '但', '还',
    '它', '它们', '这个', '那个', '这些', '那些', '什么', '怎么',
    '如果', '因为', '所以', '因此', '虽然', '但是', '然而',
    '可以', '能够', '需要', '可能', '应该', '必须',
    '已经', '正在', '将要', '刚刚', '现在',
    '一个', '一些', '许多', '多少', '每个',
    '为', '为了', '对于', '关于', '根据',
    '啊', '吧', '呢', '吗', '呀',
    '是', '说', '道', '讲', '道', '问',
    '看', '想', '要', '去', '来',
    '个', '只', '条', '根', '件', '份',
    '上', '下', '左', '右', '前', '后',
    '大', '小', '多', '少', '好', '坏',
    '不', '没', '无', '非', '别',
    '再', '又', '再', '还', '也',
    '就', '便', '即', '就', '才',
    '从', '向', '往', '朝', '到',
    '在', '于', '向', '往',
    '了', '过', '着', '的',
    '是', '得', '地', '得',
    '着', '了', '过', '到',
    '来', '去', '回',
    '上', '下',
}


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class FileViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return File.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return FileUploadSerializer
        return FileSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        if self.action == 'create':
            serializer_class = self.get_serializer_class()
            context['serializer_class'] = serializer_class
        return context

    def perform_create(self, serializer):
        file_instance = serializer.save()
        file_instance.status = 'processing'
        file_instance.save()
        
        try:
            self.process_file_sync(file_instance)
        except Exception as e:
            logger.error(f'Error processing file: {e}')
            traceback.print_exc()
            file_instance.status = 'error'
            file_instance.save()
        
        return file_instance
    
    def process_file_sync(self, file_obj):
        """同步处理文件，提取内容并生成摘要"""
        logger.info(f"=" * 60)
        logger.info(f"[FILE_PROCESSING] 开始处理文件: {file_obj.filename} (ID: {file_obj.id})")
        logger.info(f"[FILE_PROCESSING] 用户: {file_obj.user.username}")
        logger.info(f"[FILE_PROCESSING] 用户AI配置: {file_obj.user.ai_config}")
        logger.info(f"=" * 60)
        
        try:
            extracted_text = ""
            
            # ===== 阶段1: 文本提取 =====
            logger.info(f"[FILE_PROCESSING] 阶段1: 开始提取文本...")
            try:
                if file_obj.file:
                    file_path = file_obj.file.path
                    logger.info(f"[FILE_PROCESSING] 文件路径: {file_path}")
                    
                    # 根据文件类型选择不同的解析方式
                    if file_path.endswith('.txt') or file_path.endswith('.md'):
                        with open(file_path, 'r', encoding='utf-8') as f:
                            extracted_text = f.read()
                        logger.info(f"[FILE_PROCESSING] ✓ TXT/MD文本提取成功，长度: {len(extracted_text)} 字符")
                    
                    elif file_path.endswith('.pdf'):
                        try:
                            import pdfplumber
                            with pdfplumber.open(file_path) as pdf:
                                for page in pdf.pages:
                                    text = page.extract_text()
                                    if text:
                                        extracted_text += text + '\n'
                            logger.info(f"[FILE_PROCESSING] ✓ PDF文本提取成功，长度: {len(extracted_text)} 字符")
                        except Exception as pdf_error:
                            logger.error(f"[FILE_PROCESSING] ✗ PDF解析失败: {pdf_error}")
                            extracted_text = f"PDF文件内容（解析失败，文件名：{file_obj.filename}）"
                    
                    elif file_path.endswith('.docx'):
                        try:
                            from docx import Document
                            doc = Document(file_path)
                            extracted_text = '\n'.join([paragraph.text for paragraph in doc.paragraphs])
                            logger.info(f"[FILE_PROCESSING] ✓ DOCX文本提取成功，长度: {len(extracted_text)} 字符")
                        except Exception as docx_error:
                            logger.error(f"[FILE_PROCESSING] ✗ DOCX解析失败: {docx_error}")
                            extracted_text = f"DOCX文件内容（解析失败，文件名：{file_obj.filename}）"
                    
                    else:
                        extracted_text = f"文件 {file_obj.filename} 的内容"
                        logger.warning(f"[FILE_PROCESSING] ⚠ 不支持的文件类型")
                    
                    logger.info(f"[FILE_PROCESSING] ✓ 文本提取完成，总长度: {len(extracted_text)} 字符")
                else:
                    logger.warning(f"[FILE_PROCESSING] ⚠ 文件对象没有file属性")
                
                file_obj.extracted_text = extracted_text
                
            except Exception as e:
                logger.error(f"[FILE_PROCESSING] ✗ 文本提取异常: {e}", exc_info=True)
                file_obj.extracted_text = f"文件内容解析失败: {file_obj.filename}"
            
            # ===== 阶段2: AI摘要生成 =====
            logger.info(f"[FILE_PROCESSING] 阶段2: 开始生成AI摘要...")
            logger.info(f"[FILE_PROCESSING] - 模型ID: {file_obj.user.ai_config.get('model_id', '未设置')}")
            logger.info(f"[FILE_PROCESSING] - API密钥: {'已设置' if file_obj.user.ai_config.get('api_key') else '未设置'}")
            
            # 更新进度：开始生成AI摘要
            file_obj.process_status = 'processing'
            file_obj.process_progress = 30
            file_obj.process_message = '正在生成AI摘要...'
            file_obj.save()
            logger.info(f"[FILE_PROCESSING] 进度更新: 30% - 正在生成AI摘要")
            
            # 生成AI摘要和思维导图
            if file_obj.extracted_text:
                # 使用用户配置的AI模型生成摘要
                logger.info(f"[FILE_PROCESSING] 调用AI摘要生成方法...")
                file_obj.ai_summary = self._generate_ai_summary(file_obj)
                logger.info(f"[FILE_PROCESSING] AI摘要生成完成，长度: {len(file_obj.ai_summary)} 字符")
                logger.info(f"[FILE_PROCESSING] 摘要预览: {file_obj.ai_summary[:100]}...")
                
                # 更新进度：AI摘要完成
                file_obj.process_progress = 60
                file_obj.process_message = 'AI摘要生成完成，正在生成思维导图...'
                file_obj.save()
                logger.info(f"[FILE_PROCESSING] 进度更新: 60% - AI摘要完成，生成思维导图")
                
                # 根据内容生成思维导图
                file_obj.mindmap_data = self._generate_mindmap(file_obj)
            else:
                file_obj.ai_summary = "暂无摘要"
                file_obj.mindmap_data = {
                    'id': 'root',
                    'label': file_obj.filename,
                    'children': []
                }
            
            # 生成文档分析
            logger.info(f"[FILE_PROCESSING] 开始生成文档分析...")
            file_obj.ai_analysis = self._generate_ai_analysis(file_obj)
            logger.info(f"[FILE_PROCESSING] 文档分析生成完成，长度: {len(file_obj.ai_analysis)} 字符")
            
            # 更新进度：文档分析完成
            file_obj.process_progress = 75
            file_obj.process_message = '文档分析生成完成'
            file_obj.save()
            logger.info(f"[FILE_PROCESSING] 进度更新: 75% - 文档分析完成")
            
            # 更新进度：完成
            file_obj.status = 'ready'
            file_obj.process_progress = 100
            file_obj.process_status = 'completed'
            file_obj.process_message = '处理完成'
            file_obj.save()
            logger.info(f"[FILE_PROCESSING] 进度更新: 100% - 处理完成")
            
            # 自动生成标签和分类
            logger.info(f"[FILE_PROCESSING] 阶段3: 开始生成标签和分类...")
            self._auto_generate_tags_and_category(file_obj)
            
            logger.info(f"[FILE_PROCESSING] ✅ 文件处理全部完成: {file_obj.filename} (ID: {file_obj.id})")
            logger.info(f"=" * 60)
            
        except Exception as e:
            logger.error(f"[FILE_PROCESSING] ❌ 文件处理异常: {e}", exc_info=True)
            traceback.print_exc()
            file_obj.status = 'error'
            file_obj.process_status = 'failed'
            file_obj.process_message = f'处理失败: {str(e)[:50]}'
            file_obj.save()
            raise
    
    def _auto_generate_tags_and_category(self, file_obj):
        """使用AI为文件生成标签和分类"""
        logger.info(f"[TAGS_AUTO] 开始自动生成标签...")
        
        text = file_obj.extracted_text
        
        # 获取用户的AI配置
        ai_config = file_obj.user.ai_config or {}
        model_id = ai_config.get('model_id', 'gpt-4o-mini')
        api_key = ai_config.get('api_key', '')
        
        # 使用AI生成标签
        ai_tags = []
        if api_key:
            logger.info(f"[TAGS_AUTO] API密钥已配置，使用AI生成标签")
            ai_tags = self._generate_ai_tags(file_obj)
        else:
            logger.info(f"[TAGS_AUTO] API密钥未配置，跳过AI标签生成")
        
        # 如果AI生成了标签，使用AI标签
        if ai_tags:
            from django.apps import apps
            Category = apps.get_model('files', 'Category')
            
            try:
                # 创建或获取标签对应的分类
                for tag_name in ai_tags:
                    category, _ = Category.objects.get_or_create(
                        user=file_obj.user,
                        name=tag_name
                    )
                    file_obj.categories.add(category)
                    logger.info(f"[TAGS_AUTO] 添加标签: {tag_name}")
                file_obj.save()
                logger.info(f'[TAGS_AUTO] ✓ 为文件 {file_obj.filename} 生成了标签: {ai_tags}')
            except Exception as e:
                logger.warning(f'[TAGS_AUTO] ✗ 创建AI标签分类失败: {e}')
        else:
            logger.info(f"[TAGS_AUTO] 使用关键词匹配作为备用方案")
            # 如果没有API密钥或AI生成失败，使用关键词匹配
            self._generate_category_by_keywords(file_obj)

    def _generate_category_by_keywords(self, file_obj):
        """使用关键词匹配生成分类（备用方法）"""
        logger.info(f"[KEYWORDS] 使用关键词匹配生成分类...")
        
        text = file_obj.extracted_text or file_obj.filename
        
        category_keywords = [
            ('技术文档', ['tech', '技术', '编程', '代码', '开发', 'software', 'api', '系统', '程序']),
            ('学习资料', ['学习', 'study', '课程', '教程', '培训', '教材', '知识']),
            ('工作笔记', ['笔记', 'note', '备忘录', '总结', '记录', '心得']),
            ('项目文档', ['project', '项目', '工程', '需求', '方案', '设计']),
            ('会议记录', ['meeting', '会议', '讨论', '会议记录', '纪要']),
            ('研究报告', ['research', '研究', '调研', '分析', '报告']),
            ('设计文档', ['design', '设计', 'ui', '界面', '原型']),
            ('数据报表', ['data', '数据', '统计', '报表', '分析']),
            ('财务文档', ['finance', '财务', '预算', '报表', '费用']),
        ]
        
        text_lower = text.lower()
        matched_category = None
        
        for category, keywords_list in category_keywords:
            for keyword in keywords_list:
                if keyword.lower() in text_lower:
                    matched_category = category
                    break
            if matched_category:
                break
        
        if not matched_category:
            matched_category = '其他'
            logger.info(f"[KEYWORDS] 未匹配到关键词，使用默认分类: 其他")
        
        logger.info(f"[KEYWORDS] 匹配到的分类: {matched_category}")
        
        from django.apps import apps
        Category = apps.get_model('files', 'Category')
        
        try:
            category, _ = Category.objects.get_or_create(
                user=file_obj.user,
                name=matched_category
            )
            file_obj.categories.add(category)
            file_obj.save()
            logger.info(f'[KEYWORDS] ✓ 使用关键词匹配为文件 {file_obj.filename} 生成分类: {matched_category}')
        except Exception as e:
            logger.warning(f'[KEYWORDS] ✗ 关键词匹配生成分类失败: {e}')

    def _generate_mindmap(self, file_obj):
        """使用AI根据文档摘要生成思维导图，包含关键词和关系"""
        text = file_obj.ai_summary if file_obj.ai_summary else file_obj.extracted_text
        filename = file_obj.filename
        
        root_label = filename.rsplit('.', 1)[0] if '.' in filename else filename
        
        try:
            from apps.ai.services import ai_service
            
            model_id = file_obj.user.get_document_model_id()
            api_key = file_obj.user.get_api_key()
            
            model_config = ai_service.get_model_config(model_id)
            if model_config and model_config.requires_api_key and not api_key:
                logger.warning(f"[MINDMAP] ⚠ 用户 {file_obj.user.username} 未配置API密钥，使用默认思维导图")
                return self._generate_default_mindmap(root_label, text)
            
            if not api_key:
                api_key = ''
            
            mindmap_prompt = f"""{text[:3000]}"""
            
            logger.info(f"[MINDMAP] 调用AI服务生成思维导图")
            result = ai_service.extract_text_with_ai(
                content=mindmap_prompt,
                model_id=model_id,
                api_key=api_key,
                mode='enhanced',
                task_type='mindmap'
            )
            
            if result.get('success') and result.get('text'):
                mindmap_text = result['text'].strip()
                
                import re
                mindmap_text = re.sub(r'^```json\s*|\s*```$', '', mindmap_text)
                
                try:
                    import json
                    mindmap = json.loads(mindmap_text)
                    
                    if 'name' in mindmap:
                        mindmap = self._convert_mindmap_format(mindmap)
                    
                    if 'id' not in mindmap:
                        mindmap['id'] = 'root'
                    if 'label' not in mindmap:
                        mindmap['label'] = root_label
                    
                    logger.info(f"[MINDMAP] ✓ AI生成思维导图成功，节点数: {self._count_nodes(mindmap)}")
                    return mindmap
                except json.JSONDecodeError as e:
                    logger.error(f"[MINDMAP] ✗ 解析AI返回的JSON失败: {e}")
                    logger.error(f"[MINDMAP] 返回内容: {mindmap_text[:500]}")
            else:
                logger.error(f"[MINDMAP] ✗ AI生成思维导图失败: {result.get('error')}")
        
        except Exception as e:
            logger.error(f"[MINDMAP] ✗ 调用AI服务异常: {e}", exc_info=True)
        
        logger.info(f"[MINDMAP] 使用默认思维导图")
        return self._generate_default_mindmap(root_label, text)
    
    def _generate_default_mindmap(self, root_label, text):
        """生成默认的思维导图作为后备"""
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        mindmap = {
            'id': 'root',
            'label': root_label,
            'children': []
        }
        
        if lines:
            main_branches = [
                {
                    'id': 'content',
                    'label': '核心内容',
                    'children': []
                },
                {
                    'id': 'keywords',
                    'label': '关键知识点',
                    'children': []
                },
                {
                    'id': 'related',
                    'label': '关联概念',
                    'children': []
                }
            ]
            
            for i, line in enumerate(lines[:10]):
                if len(line) > 5:
                    node_label = line[:30] if len(line) > 30 else line
                    if i < 4:
                        main_branches[0]['children'].append({
                            'id': f'content_{i}',
                            'label': node_label
                        })
                    elif i < 7:
                        main_branches[1]['children'].append({
                            'id': f'keyword_{i-4}',
                            'label': node_label
                        })
                    else:
                        main_branches[2]['children'].append({
                            'id': f'related_{i-7}',
                            'label': node_label
                        })
            
            mindmap['children'] = main_branches
        else:
            mindmap['children'] = [
                {'id': 'empty', 'label': '暂无内容'}
            ]
        
        return mindmap
    
    def _count_nodes(self, node):
        """递归计算节点数量"""
        count = 1
        if 'children' in node and node['children']:
            for child in node['children']:
                count += self._count_nodes(child)
        return count
    
    def _convert_mindmap_format(self, node, parent_id='root', index=0):
        """将AI返回的name格式转换为id/label格式"""
        node_id = f"{parent_id}_{index}" if parent_id else f"node_{index}"
        converted = {
            'id': node_id,
            'label': node.get('name', '')
        }
        
        if 'children' in node and node['children']:
            converted['children'] = [
                self._convert_mindmap_format(child, node_id, i)
                for i, child in enumerate(node['children'])
            ]
        
        return converted

    def _generate_ai_summary(self, file_obj):
        """使用用户配置的AI模型生成摘要"""
        logger.info(f"[AI_SUMMARY] 开始生成AI摘要...")
        
        text = file_obj.extracted_text
        logger.info(f"[AI_SUMMARY] 提取文本长度: {len(text)} 字符")
        
        # 获取用户的AI配置
        model_id = file_obj.user.get_document_model_id()
        api_key = file_obj.user.get_api_key()
        
        logger.info(f"[AI_SUMMARY] 使用模型: {model_id}")
        logger.info(f"[AI_SUMMARY] API密钥: {'已设置' if api_key else '未设置'}")
        
        # 获取模型配置，检查是否需要API密钥
        try:
            from apps.ai.services import ai_service
            model_config = ai_service.get_model_config(model_id)
            
            if model_config:
                logger.info(f"[AI_SUMMARY] 模型配置: {model_config.name}")
                logger.info(f"[AI_SUMMARY] 提供商: {model_config.provider}")
                logger.info(f"[AI_SUMMARY] 需要API密钥: {model_config.requires_api_key}")
            
            # 如果模型需要API密钥但没有提供
            if model_config and model_config.requires_api_key and not api_key:
                logger.warning(f"[AI_SUMMARY] ⚠ 模型需要API密钥但未提供")
                logger.warning(f'[AI_SUMMARY] 用户 {file_obj.user.username} 未配置API密钥，无法生成AI摘要')
                return "请在AI设置中配置API密钥以生成摘要"
            
            # Ollama模型不需要API密钥，使用空字符串即可
            if not api_key:
                api_key = ''
                logger.info(f"[AI_SUMMARY] Ollama模型，无需API密钥")
                
        except Exception as e:
            logger.error(f"[AI_SUMMARY] ✗ 获取模型配置失败: {e}", exc_info=True)
            # 如果无法获取模型配置，默认需要API密钥
            if not api_key:
                logger.warning(f'[AI_SUMMARY] 用户 {file_obj.user.username} 未配置API密钥，无法生成AI摘要')
                return "请在AI设置中配置API密钥以生成摘要"
        
        # 使用AI模型生成摘要
        try:
            from apps.ai.services import ai_service
            
            logger.info(f"[AI_SUMMARY] 正在调用AI服务生成摘要...")
            logger.info(f"[AI_SUMMARY] 发送文本长度: {len(text[:3000])} 字符")
            
            summary_prompt = f"""请对以下文档内容进行总结，生成一个简明扼要的摘要：

文档内容：
{text[:3000]}

要求：
1. 摘要应包含文档的主要观点和关键信息
2. 保持语言简洁明了
3. 长度控制在3-5句话以内
4. 使用中文输出"""
            
            logger.info(f"[AI_SUMMARY] 调用AI服务，task_type=summarize")
            result = ai_service.extract_text_with_ai(
                content=summary_prompt,
                model_id=model_id,
                api_key=api_key,
                mode='enhanced',
                task_type='summarize'
            )
            
            logger.info(f"[AI_SUMMARY] AI服务返回: success={result.get('success')}")
            if result.get('error'):
                logger.error(f"[AI_SUMMARY] AI服务错误: {result.get('error')}")
            
            if result.get('success') and result.get('text'):
                summary = result['text']
                # 清理可能的格式问题
                summary = summary.strip()
                if summary.startswith('总结：') or summary.startswith('摘要：'):
                    summary = summary[3:].strip()
                logger.info(f"[AI_SUMMARY] ✓ 摘要生成成功，长度: {len(summary)} 字符")
                logger.info(f"[AI_SUMMARY] 摘要内容: {summary[:200]}...")
                return summary
            else:
                logger.error(f'[AI_SUMMARY] ✗ AI摘要生成失败: {result.get("error")}')
                return "摘要生成失败，请稍后重试"
                
        except Exception as e:
            logger.error(f'[AI_SUMMARY] ✗ AI摘要生成异常: {e}', exc_info=True)
            return "摘要生成失败，请稍后重试"

    def _generate_ai_tags(self, file_obj):
        """使用用户配置的AI模型生成标签"""
        logger.info(f"[AI_TAGS] 开始生成AI标签...")
        
        text = file_obj.extracted_text
        
        # 获取用户的AI配置
        model_id = file_obj.user.get_document_model_id()
        api_key = file_obj.user.get_api_key()
        
        # 检查是否有API密钥
        if not api_key:
            logger.warning(f'用户 {file_obj.user.username} 未配置API密钥，无法生成AI标签')
            return []
        
        # 使用AI模型生成标签
        try:
            from apps.ai.services import ai_service
            
            logger.info(f"[AI_TAGS] 调用AI服务生成标签...")
            tag_prompt = f"""请分析以下文档内容，提取3-5个最相关的标签/关键词：

文档内容：
{text[:3000]}

要求：
1. 标签应该简洁明了，每个标签2-4个字
2. 标签应该反映文档的主要主题或领域
3. 只输出标签，用顿号分隔，不要添加任何解释
4. 使用中文输出
5. 不要使用"其他"、"通用"等泛化标签"""
            
            result = ai_service.extract_text_with_ai(
                content=tag_prompt,
                model_id=model_id,
                api_key=api_key,
                mode='enhanced'
            )
            
            logger.info(f"[AI_TAGS] AI服务返回: success={result.get('success')}")
            
            if result.get('success') and result.get('text'):
                tags_text = result['text']
                # 清理可能的格式问题
                tags_text = tags_text.strip()
                # 移除可能的"标签："前缀
                if tags_text.startswith('标签：') or tags_text.startswith('标签:'):
                    tags_text = tags_text[3:].strip()
                
                # 分割标签（支持顿号、逗号、分号等分隔符）
                tags = []
                for separator in ['、', '，', ',', '；', ';', '|', '/']:
                    if separator in tags_text:
                        tags = [t.strip() for t in tags_text.split(separator) if t.strip()]
                        break
                
                # 如果没有分隔符，尝试按字符分割（每2-4个字为一个标签）
                if not tags and len(tags_text) > 0:
                    # 按字符逐个分割，但保持词语完整性
                    import re
                    # 匹配2-4个字的词语
                    words = re.findall(r'[\u4e00-\u9fa5]{2,4}|[a-zA-Z0-9]{2,10}', tags_text)
                    tags = words[:5]  # 最多5个标签
                
                # 过滤掉太短或无效的标签
                tags = [t for t in tags if len(t) >= 2 and t not in ['标签', '暂无', '无标签']]
                
                logger.info(f"[AI_TAGS] ✓ 标签生成成功: {tags}")
                return tags[:5]  # 最多返回5个标签
            else:
                logger.error(f'[AI_TAGS] ✗ AI标签生成失败: {result.get("error")}')
                return []
                
        except Exception as e:
            logger.error(f'[AI_TAGS] ✗ AI标签生成异常: {e}', exc_info=True)
            return []

    def _generate_ai_analysis(self, file_obj):
        """使用用户配置的AI模型生成文档分析"""
        logger.info(f"[AI_ANALYSIS] 开始生成AI文档分析...")
        
        text = file_obj.extracted_text
        logger.info(f"[AI_ANALYSIS] 提取文本长度: {len(text)} 字符")
        
        # 获取用户的AI配置
        model_id = file_obj.user.get_document_model_id()
        api_key = file_obj.user.get_api_key()
        
        # 如果没有配置API密钥，返回默认分析
        if not api_key:
            logger.warning(f"[AI_ANALYSIS] ⚠ 用户 {file_obj.user.username} 未配置API密钥，跳过AI分析")
            return "文档分析需要配置AI模型API密钥，请在设置页面配置。"
        
        try:
            from apps.ai.services import ai_service
            
            model_config = ai_service.get_model_config(model_id)
            if model_config and model_config.requires_api_key and not api_key:
                logger.warning(f"[AI_ANALYSIS] ⚠ 用户 {file_obj.user.username} 未配置API密钥")
                return "文档分析需要配置AI模型API密钥，请在设置页面配置。"
            
            result = ai_service.extract_text_with_ai(
                content=text,
                model_id=model_id,
                api_key=api_key,
                mode='enhanced',
                task_type='analyze'
            )
            
            logger.info(f"[AI_ANALYSIS] AI服务返回: success={result.get('success')}")
            
            if result.get('success') and result.get('text'):
                analysis = result['text'].strip()
                logger.info(f"[AI_ANALYSIS] ✓ 文档分析生成成功")
                return analysis
            else:
                logger.error(f'[AI_ANALYSIS] ✗ AI文档分析生成失败: {result.get("error")}')
                return "文档分析生成失败，请重试。"
                
        except Exception as e:
            logger.error(f'[AI_ANALYSIS] ✗ AI文档分析生成异常: {e}', exc_info=True)
            return f"文档分析生成异常: {str(e)}"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        file_instance = self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            FileSerializer(file_instance, context=self.get_serializer_context()).data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    @action(detail=True, methods=['get'])
    def mindmap(self, request, pk=None):
        file_obj = self.get_object()
        return Response({
            'id': file_obj.id,
            'filename': file_obj.filename,
            'mindmap_data': file_obj.mindmap_data,
            'created_at': file_obj.created_at,
        })

    @action(detail=True, methods=['patch'])
    def notes(self, request, pk=None):
        file_obj = self.get_object()
        notes_data = request.data.get('notes', '')
        
        FileVersion.objects.create(
            file=file_obj,
            version_number=file_obj.versions.count() + 1,
            extracted_text=file_obj.extracted_text,
            ai_summary=file_obj.ai_summary,
            notes=file_obj.notes
        )
        
        file_obj.notes = notes_data
        file_obj.save(update_fields=['notes', 'updated_at'])
        return Response({
            'id': file_obj.id,
            'notes': file_obj.notes,
            'updated_at': file_obj.updated_at,
        })

    @action(detail=True, methods=['get'])
    def versions(self, request, pk=None):
        file_obj = self.get_object()
        versions = FileVersion.objects.filter(file=file_obj).order_by('-created_at')
        serializer = FileVersionSerializer(versions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def restore_version(self, request, pk=None):
        file_obj = self.get_object()
        version_id = request.data.get('version_id')
        
        try:
            version = FileVersion.objects.get(id=version_id, file=file_obj)
            file_obj.extracted_text = version.extracted_text
            file_obj.ai_summary = version.ai_summary
            file_obj.notes = version.notes
            file_obj.save()
            
            return Response({
                'success': True,
                'message': f'已恢复到版本 {version.version_number}',
                'version': FileVersionSerializer(version).data
            })
        except FileVersion.DoesNotExist:
            return Response({
                'success': False,
                'error': '版本不存在'
            }, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        file_obj = self.get_object()
        
        if not file_obj.file:
            return Response({
                'success': False,
                'error': '文件不存在'
            }, status=status.HTTP_404_NOT_FOUND)
        
        try:
            file_path = file_obj.file.path
            if os.path.exists(file_path):
                response = FileResponse(open(file_path, 'rb'))
                response['Content-Disposition'] = f'attachment; filename="{file_obj.filename}"'
                return response
            else:
                return Response({
                    'success': False,
                    'error': '文件已被删除'
                }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f'Download error: {e}')
            return Response({
                'success': False,
                'error': '下载失败'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, pk=None):
        file_obj = self.get_object()
        
        try:
            file_obj.delete()
            return Response({
                'success': True,
                'message': '文件已删除'
            })
        except Exception as e:
            logger.error(f'Delete error: {e}')
            return Response({
                'success': False,
                'error': '删除失败'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BookmarkViewSet(viewsets.GenericViewSet, mixins.ListModelMixin, mixins.DestroyModelMixin):
    queryset = Bookmark.objects.none()
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Bookmark.objects.filter(user=self.request.user).order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return BookmarkCreateSerializer
        return BookmarkSerializer

    def list(self, request, *args, **kwargs):
        try:
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f'获取书签列表失败: {e}')
            return Response({
                'error': '获取书签列表失败'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def create(self, request, *args, **kwargs):
        try:
            file_id = request.data.get('file')
            note = request.data.get('note', '')

            logger.info(f'书签创建请求 - 用户: {request.user.id}, 文件ID: {file_id}, 备注: {note}')

            if not file_id:
                logger.error('书签创建失败 - 文件ID为空')
                return Response({
                    'success': False,
                    'error': '文件ID不能为空'
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                file_id = int(file_id)
            except ValueError:
                logger.error(f'书签创建失败 - 文件ID格式错误: {file_id}')
                return Response({
                    'success': False,
                    'error': '文件ID格式错误'
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                file = File.objects.get(id=file_id, user=request.user)
            except File.DoesNotExist:
                logger.error(f'书签创建失败 - 文件不存在: {file_id}')
                return Response({
                    'success': False,
                    'error': '文件不存在'
                }, status=status.HTTP_404_NOT_FOUND)

            bookmark, created = Bookmark.objects.get_or_create(
                user=request.user,
                file=file,
                defaults={'note': note}
            )

            if created:
                return Response({
                    'success': True,
                    'message': '收藏成功',
                    'id': bookmark.id,
                    'note': bookmark.note,
                    'created_at': bookmark.created_at.isoformat()
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'success': False,
                    'error': '该文件已被收藏'
                }, status=status.HTTP_400_BAD_REQUEST)

        except File.DoesNotExist:
            return Response({
                'success': False,
                'error': '文件不存在'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f'创建书签失败: {e}')
            traceback.print_exc()
            return Response({
                'success': False,
                'error': '创建书签失败'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, *args, **kwargs):
        try:
            pk = kwargs.get('pk')
            bookmark = Bookmark.objects.get(id=pk, user=request.user)
            bookmark.delete()
            return Response({
                'success': True,
                'message': '书签已移除'
            })
        except Bookmark.DoesNotExist:
            return Response({
                'success': False,
                'error': '书签不存在'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f'删除书签失败: {e}')
            return Response({
                'success': False,
                'error': '删除书签失败'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['delete'])
    def remove(self, request, pk=None):
        try:
            bookmark = Bookmark.objects.get(id=pk, user=request.user)
            bookmark.delete()
            return Response({
                'success': True,
                'message': '书签已移除'
            })
        except Bookmark.DoesNotExist:
            return Response({
                'success': False,
                'error': '书签不存在'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f'移除书签失败: {e}')
            return Response({
                'success': False,
                'error': '移除书签失败'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
