import os
import logging
import base64
from typing import Optional, Dict, Any, List
from dataclasses import dataclass

import requests
from PIL import Image
import io

logger = logging.getLogger(__name__)


@dataclass
class AIModelConfig:
    model_id: str
    name: str
    provider: str
    api_base: str
    requires_api_key: bool
    supports_vision: bool
    max_tokens: int


SUPPORTED_MODELS: List[AIModelConfig] = [
    AIModelConfig(
        model_id='gpt-4o',
        name='GPT-4o',
        provider='OpenAI',
        api_base='https://api.openai.com/v1',
        requires_api_key=True,
        supports_vision=True,
        max_tokens=4096
    ),
    AIModelConfig(
        model_id='gpt-4o-mini',
        name='GPT-4o Mini',
        provider='OpenAI',
        api_base='https://api.openai.com/v1',
        requires_api_key=True,
        supports_vision=True,
        max_tokens=4096
    ),
    AIModelConfig(
        model_id='qwen-vl-plus',
        name='通义千问VL Plus',
        provider='Aliyun',
        api_base='https://dashscope.aliyuncs.com/compatible-mode/v1',
        requires_api_key=True,
        supports_vision=True,
        max_tokens=4096
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
                'supports_thinking': m.model_id in ['qwen-vl-plus']  # 支持思考的模型
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
                    'supports_thinking': supports_thinking
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
    
    def extract_text_with_ai(
        self,
        content: str,
        image_data: Optional[str] = None,
        model_id: str = 'gpt-4o-mini',
        api_key: str = '',
        mode: str = 'basic',
        enable_vision: bool = False,
        task_type: str = 'extract',
        enable_thinking: bool = False
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
                enable_thinking=enable_thinking
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
        enable_thinking: bool = False
    ) -> Dict[str, Any]:
        messages = self._build_messages(content, image_data, enable_vision, task_type)
        
        headers = {
            'Content-Type': 'application/json'
        }
        
        if config.requires_api_key and api_key:
            headers['Authorization'] = f'Bearer {api_key}'
        
        # Ollama需要特殊处理
        is_ollama = config.provider == 'Ollama'
        final_model_id = model_id.replace('ollama:', '') if is_ollama else config.model_id
        
        payload = {
            'model': final_model_id,
            'messages': messages,
            'max_tokens': config.max_tokens,
            'temperature': 0.3
        }
        
        # 如果是支持思考的模型（如qwen3.5系列、gemma4），添加思考参数
        if enable_thinking and (is_ollama or 'qwen' in model_id.lower() or 'gemma' in model_id.lower()):
            payload['think'] = True  # Ollama支持的思考参数
        
        response = requests.post(
            f'{config.api_base}/chat/completions',
            headers=headers,
            json=payload,
            timeout=180 if config.provider == 'Ollama' else 60  # Ollama本地模型需要更长时间
        )
        
        if response.status_code != 200:
            error_msg = f'API请求失败 (HTTP {response.status_code})'
            try:
                error_detail = response.json().get('error', {}).get('message', '')
                if error_detail:
                    error_msg = error_detail
            except:
                pass
            return {'success': False, 'error': error_msg}
        
        result = response.json()
        extracted_text = result['choices'][0]['message']['content']
        
        return {
            'success': True,
            'text': extracted_text.strip(),
            'mode_used': 'enhanced',
            'confidence': 0.95,
            'usage': result.get('usage', {})
        }
    
    def _build_messages(
        self,
        content: str,
        image_data: Optional[str],
        enable_vision: bool,
        task_type: str = 'extract'
    ) -> List[Dict[str, Any]]:
        if task_type == 'summarize':
            system_prompt = """你是一个专业的文档摘要助手。请根据用户的要求对文档内容进行总结、分析或回答问题。
要求：
1. 严格按照用户的指令执行
2. 保持回答简洁明了
3. 使用中文输出
4. 不要添加额外的解释或说明"""
        else:
            system_prompt = """你是一个专业的文档内容提取助手。请从给定的文本/图像中准确提取所有文字内容。
要求：
1. 保持原文的段落结构和格式
2. 保留所有的数字、日期、专有名词
3. 清理多余的空白字符，但保持可读性
4. 如果是表格数据，尽量保持表格结构
5. 只输出提取的文本内容，不要添加任何解释或说明"""

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
        else:
            user_message = {
                'role': 'user',
                'content': content
            }
        
        return [
            {'role': 'system', 'content': system_prompt},
            user_message
        ]


ai_service = AIModelService()
