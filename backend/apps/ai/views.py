import chromadb
from django.conf import settings
from django.apps import apps
from django.core.paginator import Paginator
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
import re
import logging

from .models import ChatHistory, ChatMessage

logger = logging.getLogger(__name__)


class SearchView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            query = request.query_params.get('q', '').strip()
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 10))
            
            File = apps.get_model('files', 'File')
            
            if not query:
                queryset = File.objects.filter(
                    user=request.user,
                    status='ready'
                ).order_by('-created_at')
            else:
                queryset = File.objects.filter(
                    user=request.user,
                    status='ready'
                ).filter(
                    Q(filename__icontains=query) | 
                    Q(extracted_text__icontains=query) |
                    Q(ai_summary__icontains=query)
                ).order_by('-created_at')
            
            paginator = Paginator(queryset, page_size)
            paginated_files = paginator.get_page(page)
            
            from apps.files.serializers import FileSerializer
            serializer = FileSerializer(paginated_files, many=True)
            
            results = serializer.data
            for i, file_data in enumerate(results):
                file_obj = queryset[i] if i < len(queryset) else None
                if file_obj:
                    results[i]['highlight'] = self._generate_highlight(file_obj, query)
            
            return Response({
                'results': results,
                'total': paginator.count,
                'page': page,
                'total_pages': paginator.num_pages,
                'has_next': paginated_files.has_next(),
                'has_previous': paginated_files.has_previous(),
                'query': query
            })
            
        except Exception as e:
            logger.error(f'Search error: {str(e)}', exc_info=True)
            return Response({
                'error': '搜索时发生错误',
                'code': 'INTERNAL_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _generate_highlight(self, file_obj, query):
        if not query:
            return ''
        
        text_to_search = ''
        if file_obj.filename:
            text_to_search += file_obj.filename + ' '
        if file_obj.extracted_text:
            text_to_search += file_obj.extracted_text
        
        text_to_search = text_to_search[:300].replace('\n', ' ')
        
        if query.lower() in text_to_search.lower():
            pattern = re.compile(re.escape(query), re.IGNORECASE)
            return pattern.sub(f'<mark>{query}</mark>', text_to_search)
        
        return text_to_search if len(text_to_search) > 0 else ''


class AIChatView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            chat_id = request.query_params.get('chat_id')
            
            if chat_id:
                try:
                    chat_history = ChatHistory.objects.get(id=chat_id, user=request.user)
                    messages = ChatMessage.objects.filter(chat_history=chat_history).order_by('created_at')
                    
                    return Response({
                        'chat_id': chat_history.id,
                        'title': chat_history.title,
                        'messages': [
                            {
                                'id': m.id,
                                'role': m.role,
                                'content': m.content,
                                'file_ids': m.file_ids,
                                'created_at': m.created_at.isoformat()
                            }
                            for m in messages
                        ],
                        'created_at': chat_history.created_at.isoformat(),
                        'updated_at': chat_history.updated_at.isoformat()
                    })
                except ChatHistory.DoesNotExist:
                    return Response({
                        'error': '对话不存在',
                        'code': 'CHAT_NOT_FOUND'
                    }, status=status.HTTP_404_NOT_FOUND)
            else:
                chat_histories = ChatHistory.objects.filter(user=request.user).order_by('-updated_at')[:20]
                return Response({
                    'chat_histories': [
                        {
                            'id': ch.id,
                            'title': ch.title or '未命名对话',
                            'created_at': ch.created_at.isoformat(),
                            'updated_at': ch.updated_at.isoformat(),
                            'message_count': ch.messages.count()
                        }
                        for ch in chat_histories
                    ]
                })
                
        except Exception as e:
            logger.error(f'Get chat error: {str(e)}', exc_info=True)
            return Response({
                'error': '获取对话失败',
                'code': 'GET_CHAT_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        try:
            message = request.data.get('message', '')
            file_ids = request.data.get('file_ids', [])
            chat_id = request.data.get('chat_id')
            
            if not message:
                return Response({
                    'error': '消息不能为空',
                    'code': 'EMPTY_MESSAGE'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if chat_id:
                try:
                    chat_history = ChatHistory.objects.get(id=chat_id, user=request.user)
                except ChatHistory.DoesNotExist:
                    return Response({
                        'error': '对话不存在',
                        'code': 'CHAT_NOT_FOUND'
                    }, status=status.HTTP_404_NOT_FOUND)
            else:
                chat_history = ChatHistory.objects.create(
                    user=request.user,
                    title=message[:50] if len(message) > 50 else message
                )
            
            ChatMessage.objects.create(
                chat_history=chat_history,
                role='user',
                content=message,
                file_ids=file_ids
            )
            
            File = apps.get_model('files', 'File')
            relevant_files = []
            
            if file_ids:
                relevant_files = File.objects.filter(
                    id__in=file_ids,
                    user=request.user
                )
            
            # 构建完整的文档上下文
            context = ''
            if relevant_files:
                context = "【参考文档内容】\n\n"
                for idx, file_obj in enumerate(relevant_files, 1):
                    context += f"文档 {idx}: {file_obj.filename}\n"
                    if file_obj.ai_summary:
                        context += f"摘要: {file_obj.ai_summary}\n"
                    if file_obj.extracted_text:
                        # 限制每个文档的文本长度，避免超出模型上下文限制
                        text = file_obj.extracted_text[:4000]
                        context += f"正文:\n{text}\n"
                    context += "\n" + "="*50 + "\n\n"
                
                context += "【用户问题】\n" + message + "\n\n"
                context += "【回答要求】\n"
                context += "1. 请基于上述参考文档内容回答用户问题\n"
                context += "2. 如果文档中有明确答案，请引用相关原文\n"
                context += "3. 如果文档中没有相关信息，请明确说明\n"
                context += "4. 回答要准确、简洁、有条理\n"
            
            model_id = request.user.get_chat_model_id()
            api_key = request.user.get_api_key()
            
            response_data = self._generate_response(message, context, model_id, api_key)
            
            # 处理返回结果（可能是字符串错误消息或字典）
            if isinstance(response_data, dict):
                response_text = response_data['text']
                thinking_text = response_data.get('thinking', '')
                thinking_enabled = response_data.get('thinking_enabled', False)
            else:
                response_text = response_data
                thinking_text = ''
                thinking_enabled = False
            
            assistant_message = ChatMessage.objects.create(
                chat_history=chat_history,
                role='assistant',
                content=response_text,
                file_ids=file_ids,
                mode_used='ai'
            )
            
            return Response({
                'success': True,
                'chat_id': chat_history.id,
                'response': response_text,
                'thinking': thinking_text,
                'thinking_enabled': thinking_enabled,
                'mode_used': 'ai',
                'message_id': assistant_message.id,
                'updated_at': chat_history.updated_at.isoformat()
            })
            
        except Exception as e:
            logger.error(f'AI chat error: {str(e)}', exc_info=True)
            return Response({
                'error': 'AI聊天出错',
                'code': 'CHAT_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request):
        try:
            chat_id = request.query_params.get('chat_id')
            
            if not chat_id:
                return Response({
                    'error': '对话ID不能为空',
                    'code': 'EMPTY_CHAT_ID'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                chat_history = ChatHistory.objects.get(id=chat_id, user=request.user)
                chat_history.delete()
                
                return Response({
                    'success': True,
                    'message': '对话已删除'
                })
            except ChatHistory.DoesNotExist:
                return Response({
                    'error': '对话不存在',
                    'code': 'CHAT_NOT_FOUND'
                }, status=status.HTTP_404_NOT_FOUND)
                
        except Exception as e:
            logger.error(f'Delete chat error: {str(e)}', exc_info=True)
            return Response({
                'error': '删除对话失败',
                'code': 'DELETE_CHAT_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _generate_response(self, message, context, model_id, api_key):
        """使用AI模型生成回复"""
        from .services import ai_service
        
        model_config = ai_service.get_model_config(model_id)
        
        if model_config and model_config.requires_api_key and not api_key:
            return self._no_api_key_response(message, context)
        
        try:
            # 获取用户的思考模式设置
            ai_config = self.request.user.ai_config or {}
            enable_thinking = ai_config.get('enable_thinking', False)
            
            # 如果有文档上下文，直接使用；否则只发送用户消息
            if context:
                prompt = context
            else:
                prompt = message  # 直接发送用户消息，让chat模式的系统提示处理
            
            result = ai_service.extract_text_with_ai(
                content=prompt,
                model_id=model_id,
                api_key=api_key,
                mode='enhanced',
                enable_thinking=enable_thinking,
                task_type='chat'  # 使用聊天模式的系统提示
            )
            
            if result.get('success') and result.get('text'):
                # 检查返回的是否是原样内容（可能是降级模式，说明没有 API Key）
                if result.get('mode_used') == 'basic' and result.get('text') == prompt and model_config and model_config.requires_api_key:
                    # 如果是降级模式且是原样内容，说明没有 API key
                    return self._no_api_key_response(message, context)
                
                return {
                    'text': result['text'],
                    'thinking': result.get('thinking', ''),
                    'thinking_enabled': enable_thinking and model_config.supports_thinking if model_config else False
                }
            else:
                logger.error(f'AI回复生成失败: {result.get("error")}')
                return self._error_response(message)
        except Exception as e:
            logger.error(f'AI回复生成异常: {e}', exc_info=True)
            return self._error_response(message)
    
    def _no_api_key_response(self, message, context):
        """没有API密钥时的回复"""
        if context:
            return f"您还没有配置AI模型。请先在设置中配置API密钥。\n\n问题：{message}\n\n配置完成后，我将能够基于您的文档内容智能回答问题。"
        return f"您还没有配置AI模型。请先在设置中配置API密钥以启用AI智能问答功能。"
    
    def _error_response(self, message):
        """错误时的回复"""
        return f"抱歉，AI模型暂时无法使用。请稍后重试。\n\n问题：{message}"


class AutoTagView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            file_id = request.data.get('file_id')
            
            if not file_id:
                return Response({
                    'error': '文件ID不能为空',
                    'code': 'EMPTY_FILE_ID'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            File = apps.get_model('files', 'File')
            try:
                file_obj = File.objects.get(id=file_id, user=request.user)
            except File.DoesNotExist:
                return Response({
                    'error': '文件不存在',
                    'code': 'FILE_NOT_FOUND'
                }, status=status.HTTP_404_NOT_FOUND)
            
            tags = self._generate_tags(file_obj)
            
            return Response({
                'success': True,
                'file_id': file_id,
                'tags': tags
            })
            
        except Exception as e:
            logger.error(f'Auto tag error: {str(e)}', exc_info=True)
            return Response({
                'error': '生成标签失败',
                'code': 'TAG_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _generate_tags(self, file_obj):
        tags = []
        
        text = file_obj.extracted_text or file_obj.filename
        
        keywords = [
            ('文档', ['document', '文档', '文件', '报告', '报告']),
            ('技术', ['tech', '技术', '编程', '代码', '开发', 'software']),
            ('学习', ['学习', 'study', '课程', '教程', '培训']),
            ('笔记', ['笔记', 'note', '笔记', '备忘录']),
            ('项目', ['project', '项目', '工程', 'project']),
            ('会议', ['meeting', '会议', '讨论', '会议记录']),
            ('研究', ['research', '研究', '调研', '分析']),
            ('设计', ['design', '设计', '设计文档', 'ui']),
            ('数据', ['data', '数据', '统计', '报表']),
            ('财务', ['finance', '财务', '预算', '报表']),
        ]
        
        text_lower = text.lower()
        for tag, keywords_list in keywords:
            for keyword in keywords_list:
                if keyword.lower() in text_lower:
                    tags.append(tag)
                    break
        
        if not tags:
            tags = ['其他']
        
        return list(set(tags))


class AutoCategoryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            file_id = request.data.get('file_id')
            category_name = request.data.get('category_name')
            
            if not file_id:
                return Response({
                    'error': '文件ID不能为空',
                    'code': 'EMPTY_FILE_ID'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            File = apps.get_model('files', 'File')
            Category = apps.get_model('files', 'Category')
            
            try:
                file_obj = File.objects.get(id=file_id, user=request.user)
            except File.DoesNotExist:
                return Response({
                    'error': '文件不存在',
                    'code': 'FILE_NOT_FOUND'
                }, status=status.HTTP_404_NOT_FOUND)
            
            if category_name:
                category, created = Category.objects.get_or_create(
                    user=request.user,
                    name=category_name
                )
                file_obj.categories.add(category)
                file_obj.save()
                
                return Response({
                    'success': True,
                    'file_id': file_id,
                    'category_id': category.id,
                    'category_name': category.name,
                    'created': created
                })
            else:
                tags = self._generate_tags(file_obj)
                if tags:
                    category_name = tags[0]
                    category, created = Category.objects.get_or_create(
                        user=request.user,
                        name=category_name
                    )
                    file_obj.categories.add(category)
                    file_obj.save()
                    
                    return Response({
                        'success': True,
                        'file_id': file_id,
                        'category_id': category.id,
                        'category_name': category.name,
                        'created': created,
                        'suggested_tags': tags
                    })
                else:
                    return Response({
                        'success': True,
                        'message': '未生成分类建议',
                        'file_id': file_id
                    })
            
        except Exception as e:
            logger.error(f'Auto category error: {str(e)}', exc_info=True)
            return Response({
                'error': '生成分类失败',
                'code': 'CATEGORY_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _generate_tags(self, file_obj):
        tags = []
        
        text = file_obj.extracted_text or file_obj.filename
        
        category_keywords = [
            ('技术文档', ['tech', '技术', '编程', '代码', '开发', 'software', 'api', '系统']),
            ('学习资料', ['学习', 'study', '课程', '教程', '培训', '教材']),
            ('工作笔记', ['笔记', 'note', '备忘录', '总结', '记录']),
            ('项目文档', ['project', '项目', '工程', '需求', '方案']),
            ('会议记录', ['meeting', '会议', '讨论', '会议记录']),
            ('研究报告', ['research', '研究', '调研', '分析', '报告']),
            ('设计文档', ['design', '设计', 'ui', '界面', '原型']),
            ('数据报表', ['data', '数据', '统计', '报表', '分析']),
            ('财务文档', ['finance', '财务', '预算', '报表', '费用']),
            ('其他', []),
        ]
        
        text_lower = text.lower()
        for category, keywords_list in category_keywords:
            for keyword in keywords_list:
                if keyword.lower() in text_lower:
                    tags.append(category)
                    break
        
        if not tags:
            tags = ['其他']
        
        return list(set(tags))


class MindMapRelationView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            file_id = request.data.get('file_id')
            mindmap_data = request.data.get('mindmap_data')
            
            if not mindmap_data and not file_id:
                return Response({
                    'error': '文件ID或思维导图数据不能为空',
                    'code': 'EMPTY_DATA'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if file_id:
                File = apps.get_model('files', 'File')
                try:
                    file_obj = File.objects.get(id=file_id, user=request.user)
                    if file_obj.mindmap_data:
                        mindmap_data = file_obj.mindmap_data
                    elif file_obj.extracted_text:
                        mindmap_data = self._generate_mindmap_from_text(file_obj.extracted_text, file_obj.id)
                    else:
                        return Response({
                            'error': '文件没有思维导图数据或文本内容',
                            'code': 'NO_DATA'
                        }, status=status.HTTP_400_BAD_REQUEST)
                except File.DoesNotExist:
                    return Response({
                        'error': '文件不存在',
                        'code': 'FILE_NOT_FOUND'
                    }, status=status.HTTP_404_NOT_FOUND)
            
            relations = self._analyze_relations(mindmap_data, request.user)
            
            return Response({
                'success': True,
                'relations': relations,
                'node_count': self._count_nodes(mindmap_data)
            })
            
        except Exception as e:
            logger.error(f'Analyze relations error: {str(e)}', exc_info=True)
            return Response({
                'error': '分析知识点关联失败',
                'code': 'RELATION_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _generate_mindmap_from_text(self, text, file_id):
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        nodes = []
        for i, line in enumerate(lines[:20]):
            nodes.append({
                'id': f'node_{i}',
                'label': line[:50],
                'children': []
            })
        return {
            'id': f'root_{file_id}',
            'label': f'思维导图_{file_id}',
            'children': nodes
        }
    
    def _analyze_relations(self, mindmap_data, user):
        from .services import ai_service
        
        nodes = self._extract_all_nodes(mindmap_data)
        
        if len(nodes) < 2:
            return []
        
        nodes_text = "\n".join([f"- {node['id']}: {node['label']}" for node in nodes])
        
        prompt = f"""分析以下思维导图节点之间的关联关系：

{nodes_text}

请识别节点之间的语义关联、因果关系、对比关系、相似关系等，并输出JSON格式。"""
        
        model_id = user.get_document_model_id()
        api_key = user.get_api_key()
        
        result = ai_service.extract_text_with_ai(
            content=prompt,
            model_id=model_id,
            api_key=api_key,
            mode='enhanced',
            task_type='analyze_relations'
        )
        
        if result.get('success') and result.get('text'):
            try:
                import json
                data = json.loads(result['text'])
                return data.get('relations', [])
            except:
                return self._generate_default_relations(nodes)
        
        return self._generate_default_relations(nodes)
    
    def _extract_all_nodes(self, data, parent_id=None):
        nodes = []
        if isinstance(data, dict):
            node = {
                'id': data.get('id', data.get('text', 'unknown')),
                'label': data.get('label', data.get('text', '')),
                'parent_id': parent_id
            }
            nodes.append(node)
            if data.get('children'):
                for child in data['children']:
                    nodes.extend(self._extract_all_nodes(child, node['id']))
        elif isinstance(data, list):
            for item in data:
                nodes.extend(self._extract_all_nodes(item, parent_id))
        return nodes
    
    def _generate_default_relations(self, nodes):
        relations = []
        relation_types = ['related_to', 'similar_to', 'related_to']
        
        for i, node1 in enumerate(nodes):
            for j, node2 in enumerate(nodes):
                if i < j and node1['parent_id'] == node2['parent_id']:
                    relations.append({
                        'source': node1['id'],
                        'target': node2['id'],
                        'type': relation_types[i % len(relation_types)],
                        'description': '相关主题'
                    })
        
        return relations[:10]
    
    def _count_nodes(self, mindmap_data):
        return len(self._extract_all_nodes(mindmap_data))


class MindMapEditView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            file_id = request.data.get('file_id')
            updates = request.data.get('updates', {})
            
            if not file_id:
                return Response({
                    'error': '文件ID不能为空',
                    'code': 'EMPTY_FILE_ID'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            File = apps.get_model('files', 'File')
            try:
                file_obj = File.objects.get(id=file_id, user=request.user)
            except File.DoesNotExist:
                return Response({
                    'error': '文件不存在',
                    'code': 'FILE_NOT_FOUND'
                }, status=status.HTTP_404_NOT_FOUND)
            
            if not file_obj.mindmap_data:
                return Response({
                    'error': '文件没有思维导图数据',
                    'code': 'NO_MINDMAP'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            mindmap_data = file_obj.mindmap_data
            
            if updates.get('add_node'):
                mindmap_data = self._add_node(mindmap_data, updates['add_node'])
            
            if updates.get('update_node'):
                mindmap_data = self._update_node(mindmap_data, updates['update_node'])
            
            if updates.get('delete_node'):
                mindmap_data = self._delete_node(mindmap_data, updates['delete_node'])
            
            if updates.get('add_relation'):
                mindmap_data = self._add_relation(mindmap_data, updates['add_relation'])
            
            if updates.get('delete_relation'):
                mindmap_data = self._delete_relation(mindmap_data, updates['delete_relation'])
            
            file_obj.mindmap_data = mindmap_data
            file_obj.save()
            
            return Response({
                'success': True,
                'mindmap_data': mindmap_data
            })
            
        except Exception as e:
            logger.error(f'Edit mindmap error: {str(e)}', exc_info=True)
            return Response({
                'error': '编辑思维导图失败',
                'code': 'EDIT_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _add_node(self, data, node_info):
        parent_id = node_info.get('parent_id')
        new_node = {
            'id': node_info.get('id', f"node_{int(time.time())}"),
            'label': node_info.get('label', '新节点'),
            'children': []
        }
        
        if parent_id == 'root':
            if 'children' not in data:
                data['children'] = []
            data['children'].append(new_node)
        else:
            data = self._find_and_add_child(data, parent_id, new_node)
        
        return data
    
    def _find_and_add_child(self, data, parent_id, new_node):
        if data.get('id') == parent_id:
            if 'children' not in data:
                data['children'] = []
            data['children'].append(new_node)
            return data
        
        if data.get('children'):
            for i, child in enumerate(data['children']):
                data['children'][i] = self._find_and_add_child(child, parent_id, new_node)
        
        return data
    
    def _update_node(self, data, node_info):
        node_id = node_info.get('id')
        new_label = node_info.get('label')
        
        if data.get('id') == node_id and new_label:
            data['label'] = new_label
        
        if data.get('children'):
            for i, child in enumerate(data['children']):
                data['children'][i] = self._update_node(child, node_info)
        
        return data
    
    def _delete_node(self, data, node_id):
        if data.get('children'):
            data['children'] = [child for child in data['children'] if child.get('id') != node_id]
            for i, child in enumerate(data['children']):
                data['children'][i] = self._delete_node(child, node_id)
        
        return data
    
    def _add_relation(self, data, relation):
        if 'relations' not in data:
            data['relations'] = []
        data['relations'].append(relation)
        return data
    
    def _delete_relation(self, data, relation_id):
        if data.get('relations'):
            data['relations'] = [r for r in data['relations'] if r.get('id') != relation_id]
        return data


from .services import ai_service


class AIConfigView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            ai_config = request.user.ai_config or {}
            available_models = ai_service.get_available_models()
            
            chat_model_id = ai_config.get('chat_model_id', ai_config.get('model_id', 'glm-4-flash-250414'))
            document_model_id = ai_config.get('document_model_id', ai_config.get('model_id', 'glm-4-flash-250414'))
            
            chat_model = next((m for m in available_models if m['model_id'] == chat_model_id), None)
            document_model = next((m for m in available_models if m['model_id'] == document_model_id), None)
            
            config = {
                'chat_model_id': chat_model_id,
                'chat_model_name': chat_model['name'] if chat_model else chat_model_id,
                'document_model_id': document_model_id,
                'document_model_name': document_model['name'] if document_model else document_model_id,
                'api_key': ai_config.get('api_key', ''),
                'enable_vision': ai_config.get('enable_vision', False),
                'enable_thinking': ai_config.get('enable_thinking', False)
            }
            
            current_model = chat_model or (available_models[0] if available_models else None)
            
            return Response({
                'config': config,
                'available_models': available_models,
                'current_model': current_model,
                'message': '使用配置的AI模型生成摘要和标签'
            })
            
        except Exception as e:
            logger.error(f'获取AI配置失败: {str(e)}', exc_info=True)
            return Response({
                'error': '获取AI配置失败',
                'code': 'GET_CONFIG_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def put(self, request):
        try:
            chat_model_id = request.data.get('chat_model_id')
            document_model_id = request.data.get('document_model_id')
            api_key = request.data.get('api_key', request.user.ai_config.get('api_key', ''))
            enable_vision = request.data.get('enable_vision', False)
            enable_thinking = request.data.get('enable_thinking', False)
            
            available_models = ai_service.get_available_models()
            
            if chat_model_id:
                chat_model = next((m for m in available_models if m['model_id'] == chat_model_id), None)
                if not chat_model:
                    return Response({
                        'error': f'不支持的聊天模型: {chat_model_id}',
                        'code': 'INVALID_CHAT_MODEL'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            if document_model_id:
                document_model = next((m for m in available_models if m['model_id'] == document_model_id), None)
                if not document_model:
                    return Response({
                        'error': f'不支持的文档模型: {document_model_id}',
                        'code': 'INVALID_DOCUMENT_MODEL'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            current_config = request.user.ai_config or {}
            
            updated_config = {
                'chat_model_id': chat_model_id or current_config.get('chat_model_id', current_config.get('model_id', 'glm-4-flash-250414')),
                'document_model_id': document_model_id or current_config.get('document_model_id', current_config.get('model_id', 'glm-4-flash-250414')),
                'api_key': api_key,
                'enable_vision': enable_vision,
                'enable_thinking': enable_thinking
            }
            
            request.user.ai_config = updated_config
            request.user.save()
            
            logger.info(f'用户 {request.user.username} 更新了AI配置: chat={updated_config["chat_model_id"]}, document={updated_config["document_model_id"]}')
            
            return Response({
                'success': True,
                'message': 'AI配置已更新',
                'config': {
                    'chat_model_id': updated_config['chat_model_id'],
                    'chat_model_name': next((m['name'] for m in available_models if m['model_id'] == updated_config['chat_model_id']), updated_config['chat_model_id']),
                    'document_model_id': updated_config['document_model_id'],
                    'document_model_name': next((m['name'] for m in available_models if m['model_id'] == updated_config['document_model_id']), updated_config['document_model_id']),
                    'api_key': '',
                    'enable_vision': enable_vision,
                    'enable_thinking': enable_thinking
                }
            })
            
        except Exception as e:
            logger.error(f'更新AI配置失败: {str(e)}', exc_info=True)
            return Response({
                'error': '更新AI配置失败',
                'code': 'UPDATE_CONFIG_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIConnectionTestView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            model_id = request.data.get('model_id', 'gpt-4o-mini')
            api_key = request.data.get('api_key', '')
            
            result = ai_service.validate_api_key(model_id, api_key)
            
            if result['valid']:
                logger.info(f'API连接测试成功: model={model_id}, user={request.user.username}')
                return Response({
                    'success': True,
                    'message': result.get('message', '连接成功'),
                    'model_id': model_id
                })
            else:
                return Response({
                    'success': False,
                    'error': result.get('error', '连接失败'),
                    'model_id': model_id
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f'连接测试异常: {str(e)}', exc_info=True)
            return Response({
                'success': False,
                'error': f'测试失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
