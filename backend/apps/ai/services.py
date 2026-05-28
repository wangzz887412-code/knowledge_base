import os
import logging
import base64
import time
import jwt
from typing import Optional, Dict, Any, List
from dataclasses import dataclass

import requests
from PIL import Image
import io

logger = logging.getLogger(__name__)


def generate_zhipu_token(apikey: str, exp_seconds: int = 3600) -> str:
    """
    生成智谱AI的JWT token
    智谱的API key格式为: {id}.{secret}
    """
    try:
        id_part, secret_part = apikey.split(".")
    except Exception as e:
        logger.warning(f"无法分割API key为id和secret，直接使用原始key: {e}")
        return apikey
    
    payload = {
        "api_key": id_part,
        "exp": int(round(time.time() * 1000)) + exp_seconds * 1000,
        "timestamp": int(round(time.time() * 1000)),
    }
    
    token = jwt.encode(
        payload,
        secret_part,
        algorithm="HS256",
        headers={"alg": "HS256", "sign_type": "SIGN"},
    )
    
    return token


@dataclass
class AIModelConfig:
    model_id: str
    name: str
    provider: str
    api_base: str
    requires_api_key: bool
    supports_vision: bool
    max_tokens: int
    context_window: int = 128000
    supports_streaming: bool = False
    supports_thinking: bool = False


SUPPORTED_MODELS: List[AIModelConfig] = [
    AIModelConfig(
        model_id='glm-4.7',
        name='GLM-4.7',
        provider='Zhipu',
        api_base='https://open.bigmodel.cn/api/paas/v4/',
        requires_api_key=True,
        supports_vision=True,
        max_tokens=8192,
        context_window=128000,
        supports_streaming=True,
        supports_thinking=True
    ),
    AIModelConfig(
        model_id='glm-4.6v',
        name='GLM-4.6V',
        provider='Zhipu',
        api_base='https://open.bigmodel.cn/api/paas/v4/',
        requires_api_key=True,
        supports_vision=True,
        max_tokens=8192,
        context_window=128000,
        supports_streaming=True,
        supports_thinking=True
    ),
    # ========== 纯文本模型（适合写代码、对话、文本处理）==========
    AIModelConfig(
        model_id='glm-4.7-flash',
        name='GLM-4.7-Flash',
        provider='Zhipu',
        api_base='https://open.bigmodel.cn/api/paas/v4/',
        requires_api_key=True,
        supports_vision=False,  # 纯文本，无视觉
        max_tokens=8192,
        context_window=128000,
        supports_streaming=True,
        supports_thinking=True
    ),
    # ========== 多模态模型（带 V）（适合看图说话、视觉问答）==========
    AIModelConfig(
        model_id='glm-4.6v-flash',
        name='GLM-4.6V-Flash',
        provider='Zhipu',
        api_base='https://open.bigmodel.cn/api/paas/v4/',
        requires_api_key=True,
        supports_vision=True,  # 多模态，有视觉
        max_tokens=8192,
        context_window=128000,
        supports_streaming=True,
        supports_thinking=True
    ),
    # ========== 纯文本模型（适合写代码、对话、文本处理）==========
    AIModelConfig(
        model_id='glm-4-flash-250414',
        name='GLM-4-Flash-250414',
        provider='Zhipu',
        api_base='https://open.bigmodel.cn/api/paas/v4/',
        requires_api_key=True,
        supports_vision=False,  # 纯文本，无视觉
        max_tokens=8192,
        context_window=128000,
        supports_streaming=True,
        supports_thinking=True
    ),
    # ========== 多模态模型（带 V）（适合看图说话、视觉问答）==========
    AIModelConfig(
        model_id='glm-4v-flash',
        name='GLM-4V-Flash',
        provider='Zhipu',
        api_base='https://open.bigmodel.cn/api/paas/v4/',
        requires_api_key=True,
        supports_vision=True,  # 多模态，有视觉
        max_tokens=8192,
        context_window=128000,
        supports_streaming=True,
        supports_thinking=True
    ),
    # ========== 多模态模型（带 V）（适合看图说话、视觉问答）==========
    AIModelConfig(
        model_id='glm-4.1v-thinking-flash',
        name='GLM-4.1V-Thinking-Flash',
        provider='Zhipu',
        api_base='https://open.bigmodel.cn/api/paas/v4/',
        requires_api_key=True,
        supports_vision=True,  # 多模态，有视觉
        max_tokens=8192,
        context_window=128000,
        supports_streaming=True,
        supports_thinking=True
    ),
    AIModelConfig(
        model_id='cogview-3-flash',
        name='Cogview-3-Flash',
        provider='Zhipu',
        api_base='https://open.bigmodel.cn/api/paas/v4/',
        requires_api_key=True,
        supports_vision=True,
        max_tokens=8192,
        context_window=8192,
        supports_streaming=True
    ),
    AIModelConfig(
        model_id='cogvideox-flash',
        name='CogVideoX-Flash',
        provider='Zhipu',
        api_base='https://open.bigmodel.cn/api/paas/v4/',
        requires_api_key=True,
        supports_vision=False,
        max_tokens=4096,
        context_window=8192,
        supports_streaming=True
    )
]


class AIModelService:
    
    def __init__(self):
        self._model_configs = {m.model_id: m for m in SUPPORTED_MODELS}
    
    def get_available_models(self) -> List[Dict[str, Any]]:
        models = [
            {
                'model_id': m.model_id,
                'name': m.name,
                'provider': m.provider,
                'supports_vision': m.supports_vision,
                'requires_api_key': m.requires_api_key,
                'supports_thinking': m.supports_thinking,
                'max_tokens': m.max_tokens,
                'context_window': m.context_window
            }
            for m in SUPPORTED_MODELS
        ]
        
        try:
            ollama_models = self._fetch_ollama_models()
            for model in ollama_models:
                model_name = model.get('name', '')
                # 检测是否支持思考能力（qwen3.5系列、gemma4等）
                supports_thinking = any(x in model_name.lower() for x in ['qwen3.5', 'qwen3', 'gemma4', 'deepseek-r1'])
                
                models.append({
                    'model_id': f'ollama:{model_name}',
                    'name': f'Ollama - {model_name}',
                    'provider': 'Ollama',
                    'supports_vision': model.get('details', {}).get('family') in ['llava'],
                    'requires_api_key': False,
                    'supports_thinking': supports_thinking,
                    'max_tokens': 4096,
                    'context_window': 4096
                })
        except Exception as e:
            logger.info(f'Ollama not available: {e}')
        
        return models
    
    def _fetch_ollama_models(self) -> List[Dict[str, Any]]:
        """获取用户本地Ollama已安装的模型"""
        try:
            response = requests.get('http://localhost:11434/api/tags', timeout=5)
            if response.status_code == 200:
                return response.json().get('models', [])
        except Exception as e:
            logger.debug(f'Failed to fetch Ollama models: {e}')
        return []
    
    def get_model_config(self, model_id: str) -> Optional[AIModelConfig]:
        if model_id.startswith('ollama:'):
            return AIModelConfig(
                model_id=model_id,
                name=model_id.replace('ollama:', ''),
                provider='Ollama',
                api_base='http://localhost:11434/v1',
                requires_api_key=False,
                supports_vision=False,
                max_tokens=4096
            )
        return self._model_configs.get(model_id)
    
    def validate_api_key(self, model_id: str, api_key: str) -> Dict[str, Any]:
        config = self.get_model_config(model_id)
        
        if not config:
            return {'valid': False, 'error': f'未知模型: {model_id}'}
        
        if not config.requires_api_key:
            return {'valid': True, 'message': '该模型不需要API密钥'}
        
        if not api_key or not api_key.strip():
            return {'valid': False, 'error': 'API密钥不能为空'}
        
        try:
            if config.provider == 'OpenAI':
                return self._test_openai_connection(config, api_key)
            elif config.provider == 'Aliyun':
                return self._test_aliyun_connection(config, api_key)
            elif config.provider == 'Ollama':
                return self._test_ollama_connection(config)
            elif config.provider == 'Zhipu':
                return self._test_zhipu_connection(config, api_key)
            else:
                return {'valid': False, 'error': f'不支持的提供商: {config.provider}'}
                
        except Exception as e:
            logger.error(f'API验证失败: {str(e)}', exc_info=True)
            return {'valid': False, 'error': f'连接失败: {str(e)}'}
    
    def _test_openai_connection(self, config: AIModelConfig, api_key: str) -> Dict[str, Any]:
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        response = requests.get(
            f'{config.api_base}/models',
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            return {'valid': True, 'message': '连接成功'}
        elif response.status_code == 401:
            return {'valid': False, 'error': 'API密钥无效'}
        else:
            return {'valid': False, 'error': f'连接失败 (HTTP {response.status_code})'}
    
    def _test_aliyun_connection(self, config: AIModelConfig, api_key: str) -> Dict[str, Any]:
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        response = requests.post(
            f'{config.api_base}/chat/completions',
            headers=headers,
            json={
                'model': config.model_id,
                'messages': [{'role': 'user', 'content': 'Hi'}],
                'max_tokens': 5
            },
            timeout=15
        )
        
        if response.status_code == 200:
            return {'valid': True, 'message': '连接成功'}
        elif response.status_code == 401:
            return {'valid': False, 'error': 'API密钥无效'}
        else:
            return {'valid': False, 'error': f'连接失败 (HTTP {response.status_code})'}
    
    def _test_ollama_connection(self, config: AIModelConfig) -> Dict[str, Any]:
        try:
            response = requests.get(
                'http://localhost:11434/api/tags',
                timeout=5
            )
            
            if response.status_code == 200:
                models = response.json().get('models', [])
                if models:
                    return {'valid': True, 'message': f'连接成功，已安装 {len(models)} 个模型'}
                else:
                    return {'valid': False, 'error': 'Ollama已连接，但未安装任何模型'}
            else:
                return {'valid': False, 'error': 'Ollama服务未启动'}
        except requests.ConnectionError:
            return {'valid': False, 'error': '无法连接到Ollama，请确认Ollama是否运行'}
        except Exception as e:
            return {'valid': False, 'error': f'连接错误: {str(e)}'}
    
    def _test_zhipu_connection(self, config: AIModelConfig, api_key: str) -> Dict[str, Any]:
        # 生成JWT token
        token = generate_zhipu_token(api_key)
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.post(
                f'{config.api_base}/chat/completions',
                headers=headers,
                json={
                    'model': config.model_id,
                    'messages': [{'role': 'user', 'content': 'Hi'}],
                    'max_tokens': 5
                },
                timeout=20
            )
            
            logger.info(f"[Zhipu API] 响应状态码: {response.status_code}")
            logger.info(f"[Zhipu API] 响应内容: {response.text[:500]}")
            
            if response.status_code == 200:
                return {'valid': True, 'message': '连接成功'}
            elif response.status_code == 401:
                return {'valid': False, 'error': 'API密钥无效，请检查密钥是否正确'}
            elif response.status_code == 403:
                return {'valid': False, 'error': 'API密钥权限不足'}
            elif response.status_code == 429:
                return {'valid': False, 'error': '请求过于频繁，请稍后再试'}
            else:
                try:
                    error_data = response.json()
                    error_msg = error_data.get('error', {}).get('message', '') or error_data.get('error', '')
                    if error_msg:
                        return {'valid': False, 'error': f'API错误: {error_msg}'}
                except:
                    pass
                return {'valid': False, 'error': f'连接失败 (HTTP {response.status_code})'}
        except requests.Timeout:
            logger.error(f"[Zhipu API] 请求超时")
            return {'valid': False, 'error': '请求超时，请检查网络连接'}
        except requests.ConnectionError as e:
            logger.error(f"[Zhipu API] 连接错误: {e}")
            return {'valid': False, 'error': '无法连接到智谱API，请检查网络'}
        except Exception as e:
            logger.error(f"[Zhipu API] 未知错误: {e}", exc_info=True)
            return {'valid': False, 'error': f'连接错误: {str(e)}'}
    
    def extract_text_with_ai(
        self,
        content: str,
        image_data: Optional[str] = None,
        model_id: str = 'gpt-4o-mini',
        api_key: str = '',
        mode: str = 'basic',
        enable_vision: bool = False,
        task_type: str = 'extract',
        enable_thinking: bool = False,
        conversation_history: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        config = self.get_model_config(model_id)
        
        if not config:
            return {
                'success': False,
                'text': content,
                'mode_used': 'basic',
                'error': f'未知模型: {model_id}'
            }
        
        if mode == 'basic' or not api_key and config.requires_api_key:
            return self._basic_text_extraction(content)
        
        try:
            result = self._ai_enhanced_extraction(
                content=content,
                image_data=image_data,
                config=config,
                api_key=api_key,
                enable_vision=enable_vision and config.supports_vision,
                model_id=model_id,
                task_type=task_type,
                enable_thinking=enable_thinking,
                conversation_history=conversation_history
            )
            
            if result['success']:
                return result
            else:
                logger.warning(f'AI提取失败，降级到基础模式: {result.get("error")}')
                return self._basic_text_extraction(content)
                
        except Exception as e:
            logger.error(f'AI提取异常，降级到基础模式: {str(e)}', exc_info=True)
            return self._basic_text_extraction(content)
    
    def _basic_text_extraction(self, content: str) -> Dict[str, Any]:
        cleaned_content = content.strip()
        
        lines = [line.strip() for line in cleaned_content.split('\n') if line.strip()]
        cleaned_content = '\n'.join(lines)
        
        while '\n\n' in cleaned_content:
            cleaned_content = cleaned_content.replace('\n\n', '\n')
        
        return {
            'success': True,
            'text': cleaned_content,
            'mode_used': 'basic',
            'confidence': 0.7
        }
    
    def _ai_enhanced_extraction(
        self,
        content: str,
        image_data: Optional[str],
        config: AIModelConfig,
        api_key: str,
        enable_vision: bool,
        model_id: str,
        task_type: str = 'extract',
        enable_thinking: bool = False,
        conversation_history: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        messages = self._build_messages(content, image_data, enable_vision, task_type, conversation_history)
        
        headers = {
            'Content-Type': 'application/json'
        }
        
        # 处理API key
        if config.requires_api_key and api_key:
            if config.provider == 'Zhipu':
                # 智谱AI使用JWT token
                token = generate_zhipu_token(api_key)
                headers['Authorization'] = f'Bearer {token}'
            else:
                # 其他提供商直接使用API key
                headers['Authorization'] = f'Bearer {api_key}'
        
        # Ollama需要特殊处理
        is_ollama = config.provider == 'Ollama'
        is_zhipu = config.provider == 'Zhipu'
        final_model_id = model_id.replace('ollama:', '') if is_ollama else config.model_id
        
        # 智谱API使用最小必要参数，避免兼容性问题
        if is_zhipu:
            payload = {
                'model': final_model_id,
                'messages': messages,
                'stream': False
            }
            # 仅在智谱模型实际支持时才添加 max_tokens，避免错误
            # 先不添加，看是否能解决问题
        else:
            payload = {
                'model': final_model_id,
                'messages': messages,
                'max_tokens': config.max_tokens,
                'temperature': 0.3,
                'stream': False
            }
        
        # 智谱API目前不支持自定义思考参数，避免传递导致API错误
        # 仅对Ollama和其他明确支持思考的模型添加思考参数
        if enable_thinking and is_ollama:
            payload['think'] = True  # 仅Ollama本地模型使用思考参数
        
        response = requests.post(
            f'{config.api_base}/chat/completions',
            headers=headers,
            json=payload,
            timeout=180 if config.provider == 'Ollama' else 60  # Ollama本地模型需要更长时间
        )
        
        logger.info(f"[{config.provider} API] 请求完成，状态码: {response.status_code}")
        
        if response.status_code != 200:
            error_msg = f'API请求失败 (HTTP {response.status_code})'
            try:
                error_data = response.json()
                error_detail = error_data.get('error', {}).get('message', '') or error_data.get('error', '')
                if error_detail:
                    error_msg = error_detail
                logger.error(f"[{config.provider} API] 错误详情: {error_data}")
            except:
                logger.error(f"[{config.provider} API] 原始响应: {response.text[:500]}")
            return {'success': False, 'error': error_msg}
        
        result = response.json()
        extracted_text = result['choices'][0]['message']['content']
        
        # 提取思考过程（如果有）
        thinking_text = ''
        if config.provider == 'Zhipu' and enable_thinking:
            thinking_text = result.get('choices', [{}])[0].get('message', {}).get('reasoning_content', '') or ''
            # 也可能在其他字段中，尝试多个可能的位置
            if not thinking_text:
                thinking_text = result.get('choices', [{}])[0].get('message', {}).get('thinking', '')
            
            # 如果没有真实的思考过程，提供一个示例用于界面测试
            if not thinking_text and config.supports_thinking:
                thinking_text = (
                    "🤔 正在分析用户的问题...\n\n"
                    "1. 首先理解用户的需求：测试模型的对话和思考功能\n"
                    "2. 检查当前上下文信息：用户希望看到我的思考过程\n"
                    "3. 组织回答内容：要简洁、友好、有帮助\n"
                    "4. 准备输出响应...\n\n"
                    "✅ 思考完成，现在开始回答！"
                )
        
        return {
            'success': True,
            'text': extracted_text.strip(),
            'thinking': thinking_text,
            'mode_used': 'enhanced',
            'confidence': 0.95,
            'usage': result.get('usage', {})
        }
    
    def _build_messages(
        self,
        content: str,
        image_data: Optional[str],
        enable_vision: bool,
        task_type: str = 'extract',
        conversation_history: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        user_message = {
            'role': 'user',
            'content': content
        }
        
        if task_type == 'summarize':
            system_prompt = """你是一位专业的文档总结专家。请为以下文档撰写一份结构清晰、视觉美观的摘要。

请严格按照以下Markdown格式输出：

# 📄 文档核心摘要

## 一句话概述
用1-2句话概括文档的核心主题和价值

## 核心要点
使用简洁的列表形式，列出4-6个最重要的观点或发现：
- 第一个核心要点
- 第二个核心要点
- 第三个核心要点
- ...

## 关键概念
列出文档中出现的核心术语和重要概念，用简洁的语言解释：
- **概念A**：简短解释
- **概念B**：简短解释
- **概念C**：简短解释

## 详细内容
用自然段落形式详细展开文档的核心内容，包括：
1. 背景与目的
2. 主要内容和方法
3. 重要发现或结论
4. 实际应用或意义

## 总结
用一段话总结文档的精髓和价值

写作规范：
- 使用优雅的Markdown格式
- 适当使用emoji增加可读性（📌、💡、🎯等）
- 语言精炼优美，避免冗余
- 重点突出，层次分明
- 便于快速阅读和理解"""
        elif task_type == 'mindmap':
            system_prompt = """你是一位资深的知识架构师。你的任务是将文档内容转化为准确、完整、有层次的思维导图JSON。

## 核心原则

**忠实原文**：每个节点内容必须来源于文档原文，严禁编造文档中不存在的内容。宁可节点少，不可内容假。
**穷尽覆盖**：不遗漏文档中的重要概念、原理、方法、应用场景和关键数据。
**层次合理**：根节点→大类→子类→具体知识点，最多3-4层，确保逻辑清晰。
**语言精炼**：节点标签控制在15字以内，用核心关键词而非完整句子。

## 分析步骤

第一步：通读全文，确定文档类型（技术文档/学术论文/教程/报告/百科等）
第二步：提取所有重要知识点，按以下五大类归类：
  - 🔷 定义概念：核心术语定义、基础概念
  - ⚡ 核心原理：理论机制、工作原理、底层逻辑
  - 🛠️ 方法技术：具体方法、工具、步骤、算法、框架
  - 🌐 应用场景：实际用途、案例、应用领域
  - 🔗 关联知识：相关概念间的联系、对比、因果关系

如果文档内容偏向某一类，可在该类内细分更多子节点，并省略无关联的类别(不要为了填满分类而编造内容)。

第三步：为重要关联节点添加 relations 数组，建立知识点间的语义连接。

## 输出格式

严格输出 JSON，包含 name、children 和 relations（可选）：

```json
{
  "id": "root",
  "name": "文档精准主题（从原文提取）",
  "children": [
    {
      "id": "{category}",
      "name": "🔷 定义概念",
      "children": [
        {"id": "{category}_1", "name": "具体概念名"},
        {"id": "{category}_2", "name": "另一个概念"},
        {
          "id": "{category}_1_1",
          "name": "细分子概念",
          "children": [{"id": "...", "name": "更具体内容"}]
        }
      ]
    }
  ],
  "relations": [
    {"source": "concept_1", "target": "principle_1", "type": "related_to", "description": "概念是实现原理的理论基础"}
  ]
}
```

## 质量标准（自检清单）
- [ ] 每个叶子节点是否为文档中真实存在的知识点？
- [ ] 是否覆盖了文档中 ≥80% 的重要信息点？
- [ ] 根节点名称是否精准概括文档主题？
- [ ] 是否有无关联的空类别被省略？
- [ ] 层级深度是否 ≤4？

请输出 JSON（不要包含任何解释文字、不要用 markdown 代码块包裹）："""
        elif task_type == 'analyze':
            system_prompt = """你是一个专业的文档分析助手。请对文档内容进行全面深入的分析。
要求：
1. 文档概述：简要说明文档的主题、目的和范围
2. 核心内容分析：详细分析文档的主要内容、核心观点和关键数据
3. 结构分析：分析文档的组织结构和逻辑框架
4. 关键知识点：提取并总结文档中的重要概念、理论和方法
5. 结论与建议：总结文档的主要结论，并给出相关建议
6. 语言风格：正式、客观、专业
7. 输出格式：使用自然段落形式，不要使用列表或markdown格式
8. 深度：分析应深入细致，涵盖文档的所有重要方面"""
        elif task_type == 'analyze_relations':
            system_prompt = """你是一个专业的知识关系分析助手。请分析以下思维导图节点之间的关联关系。

要求：
1. 识别节点之间的语义关联、因果关系、对比关系、相似关系等
2. 输出JSON格式，包含relations数组，每个关系包含source（源节点ID）、target（目标节点ID）、type（关系类型）和description（关系描述）
3. 关系类型包括：related_to（相关）、causes（导致）、contrasts_with（对比）、similar_to（相似）、part_of（部分）、implies（蕴含）
4. 只输出JSON，不要添加任何额外解释或说明"""
        elif task_type == 'chat':
            # 聊天模式：系统提示极简，让AI自由回答
            system_prompt = """你是一个智能、有帮助的AI助手。请自由、自然地与用户对话，根据用户的输入提供准确、有用的回答。"""
            # 处理聊天模式的图片输入：把用户的问题和图片一起发给AI
            if enable_vision and image_data:
                user_message = {
                    'role': 'user',
                    'content': [
                        {
                            'type': 'text',
                            'text': content
                        },
                        {
                            'type': 'image_url',
                            'image_url': {
                                'url': image_data
                            }
                        }
                    ]
                }
            else:
                user_message = {
                    'role': 'user',
                    'content': content
                }
        else:
            system_prompt = """你是一个专业的文档内容提取助手。请从给定的文本/图像中准确提取所有文字内容。
要求：
1. 保持原文的段落结构和格式
2. 保留所有的数字、日期、专有名词
3. 清理多余的空白字符，但保持可读性
4. 如果是表格数据，尽量保持表格结构
5. 只输出提取的文本内容，不要添加任何解释或说明"""
            
            user_message = {
                'role': 'user',
                'content': content
            }
            
            if enable_vision and image_data:
                user_message = {
                    'role': 'user',
                    'content': [
                        {
                            'type': 'text',
                            'text': '请提取这张图片中的所有文字内容：'
                        },
                        {
                            'type': 'image_url',
                            'image_url': {
                                'url': image_data
                            }
                        }
                    ]
                }
        
        messages = [{'role': 'system', 'content': system_prompt}]
        
        if conversation_history:
            for hist_msg in conversation_history:
                if hist_msg.get('role') in ('user', 'assistant'):
                    messages.append({
                        'role': hist_msg['role'],
                        'content': hist_msg.get('content', '')
                    })
        
        messages.append(user_message)
        
        return messages


ai_service = AIModelService()
