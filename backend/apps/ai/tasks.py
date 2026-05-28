import os
import json
import logging
import chromadb
from django.conf import settings
from django.apps import apps
from celery import shared_task
from .parsers import parse_file

logger = logging.getLogger(__name__)


@shared_task
def process_file(file_id):
    File = apps.get_model('files', 'File')
    try:
        file_obj = File.objects.get(id=file_id)
        file_obj.status = 'processing'
        file_obj.save()

        text = parse_file(file_obj.file.path)
        file_obj.extracted_text = text
        file_obj.save()

        mindmap_data = generate_mindmap(file_id, text)
        if mindmap_data:
            file_obj.mindmap_data = mindmap_data
            file_obj.save()

        store_in_chroma(file_id, text)

        file_obj.status = 'ready'
        file_obj.save()

        generate_mindmap_with_ai.delay(file_id)
    except Exception as e:
        logger.error(f'处理文件失败 file_id={file_id}: {e}', exc_info=True)
        file_obj = File.objects.get(id=file_id)
        file_obj.status = 'error'
        file_obj.save()
        raise


@shared_task
def generate_mindmap_with_ai(file_id):
    """使用AI生成完整的思维导图（异步任务）"""
    from .services import ai_service

    File = apps.get_model('files', 'File')
    try:
        file_obj = File.objects.get(id=file_id)
    except File.DoesNotExist:
        logger.error(f'文件不存在: {file_id}')
        return

    text = file_obj.extracted_text
    if not text:
        logger.warning(f'文件 {file_id} 没有提取到文本内容')
        return

    text_for_ai = text[:12000]

    user = file_obj.user
    model_id = user.get_document_model_id()
    api_key = ''

    from .services import ai_service as svc
    model_config = svc.get_model_config(model_id)
    if model_config and model_config.requires_api_key:
        api_key = user.get_provider_api_key(model_config.provider)
        if not api_key:
            api_key = user.get_api_key()

    if not api_key and model_config and model_config.requires_api_key:
        logger.warning(f'用户 {user.username} 未配置API密钥，无法生成AI思维导图')
        return

    try:
        logger.info(f'开始AI生成思维导图 file_id={file_id}, model={model_id}')
        result = ai_service.extract_text_with_ai(
            content=f'请为以下文档内容生成思维导图：\n\n{text_for_ai}',
            model_id=model_id,
            api_key=api_key,
            mode='enhanced',
            task_type='mindmap'
        )

        if result.get('success') and result.get('text'):
            ai_text = result['text']

            mindmap_data = parse_mindmap_json(ai_text)
            if mindmap_data:
                file_obj.mindmap_data = mindmap_data
                file_obj.save()
                node_count = count_nodes(mindmap_data)
                logger.info(f'AI思维导图生成成功 file_id={file_id}, 节点数={node_count}')
            else:
                logger.warning(f'AI思维导图JSON解析失败 file_id={file_id}, 原始响应: {ai_text[:300]}')
        else:
            logger.error(f'AI思维导图生成失败 file_id={file_id}: {result.get("error")}')
    except Exception as e:
        logger.error(f'AI思维导图生成异常 file_id={file_id}: {e}', exc_info=True)


def generate_mindmap(file_id, text):
    """生成基础思维导图（快速提取，不含AI）"""
    lines = [line.strip() for line in text.split('\n') if line.strip() and len(line.strip()) > 3]
    if not lines:
        return None

    root_label = lines[0][:60] if lines else '文档内容'

    nodes = []
    for i, line in enumerate(lines[1:21]):
        label = line[:50]
        category = categorize_line(line)
        node = {
            'id': f'node_{i}',
            'label': label,
            'children': []
        }
        if category:
            node['description'] = category
        nodes.append(node)

    categorized = {}
    for node in nodes:
        cat = node.get('description', '其他')
        if cat not in categorized:
            categorized[cat] = []
        del node['description']
        categorized[cat].append(node)

    children = []
    for cat_name, cat_nodes in categorized.items():
        children.append({
            'id': f'cat_{cat_name}',
            'label': cat_name,
            'children': cat_nodes[:8]
        })

    return {
        'id': f'root_{file_id}',
        'label': root_label,
        'children': children[:6]
    }


def categorize_line(line):
    """对行进行简单分类"""
    line_lower = line.lower()
    if any(kw in line_lower for kw in ['定义', '是', '指', '概念', '定义', '术语']):
        return '🔷 定义概念'
    elif any(kw in line_lower for kw in ['原理', '理论', '基础', '机制', '算法', '公式']):
        return '⚡ 核心原理'
    elif any(kw in line_lower for kw in ['方法', '步骤', '流程', '技术', '实现', '操作', '工具']):
        return '🛠️ 方法技术'
    elif any(kw in line_lower for kw in ['应用', '场景', '案例', '实例', '用途', '使用']):
        return '🌐 应用场景'
    elif any(kw in line_lower for kw in ['相关', '联系', '关联', '影响', '对比', '区别']):
        return '🔗 关联知识'
    return None


def parse_mindmap_json(ai_text):
    """从AI响应中解析思维导图JSON"""
    json_text = ai_text

    if '```json' in ai_text:
        start = ai_text.index('```json') + 7
        end = ai_text.index('```', start) if '```' in ai_text[start:] else len(ai_text)
        json_text = ai_text[start:end].strip()
    elif '```' in ai_text:
        start = ai_text.index('```') + 3
        end = ai_text.index('```', start) if '```' in ai_text[start:] else len(ai_text)
        json_text = ai_text[start:end].strip()

    candidates = []
    brace_count = 0
    candidate_start = -1
    for i, ch in enumerate(json_text):
        if ch == '{':
            if brace_count == 0:
                candidate_start = i
            brace_count += 1
        elif ch == '}':
            brace_count -= 1
            if brace_count == 0 and candidate_start >= 0:
                candidates.append(json_text[candidate_start:i + 1])
                candidate_start = -1

    for candidate in candidates:
        try:
            data = json.loads(candidate)
            if validate_mindmap_structure(data):
                return normalize_mindmap(data)
        except json.JSONDecodeError:
            continue

    try:
        data = json.loads(json_text.strip())
        if validate_mindmap_structure(data):
            return normalize_mindmap(data)
    except json.JSONDecodeError:
        pass

    return None


def validate_mindmap_structure(data):
    """验证思维导图JSON结构"""
    if not isinstance(data, dict):
        return False
    if 'name' in data or 'label' in data or 'id' in data:
        return True
    return False


def normalize_mindmap(data, depth=0):
    """标准化思维导图JSON结构"""
    if not isinstance(data, dict):
        return None

    normalized = {
        'id': data.get('id', f'node_{depth}_{hash(str(data))}'[:16]),
        'label': data.get('name', data.get('label', data.get('text', '未命名')))
    }

    children = data.get('children', [])
    if children and isinstance(children, list):
        normalized_children = []
        for child in children:
            norm_child = normalize_mindmap(child, depth + 1)
            if norm_child:
                normalized_children.append(norm_child)
        if normalized_children:
            normalized['children'] = normalized_children[:8]

    relations = data.get('relations', [])
    if relations and isinstance(relations, list):
        normalized['relations'] = relations

    return normalized


def count_nodes(data):
    """统计节点数"""
    if not isinstance(data, dict):
        return 0
    count = 1
    for child in data.get('children', []):
        count += count_nodes(child)
    return count


@shared_task
def store_in_chroma(file_id, text):
    client = chromadb.PersistentClient(path=str(settings.CHROMA_PERSIST_DIR))
    collection = client.get_or_create_collection(name='documents')

    chunks = [text[i:i+1000] for i in range(0, len(text), 1000)]

    for i, chunk in enumerate(chunks):
        collection.add(
            documents=[chunk],
            metadatas=[{'file_id': str(file_id), 'chunk_index': i}],
            ids=[f'{file_id}_{i}']
        )