from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    STORAGE_MODE_CHOICES = [
        ('local', '本地存储'),
        ('cloud', '云存储'),
    ]
    
    storage_mode = models.CharField(
        max_length=10, choices=STORAGE_MODE_CHOICES, default='local')
    cloud_config = models.JSONField(default=dict, blank=True)
    ai_config = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    def get_chat_model_id(self):
        return self.ai_config.get('chat_model_id', self.ai_config.get('model_id', 'glm-4-flash-250414'))
    
    def get_document_model_id(self):
        return self.ai_config.get('document_model_id', self.ai_config.get('model_id', 'glm-4-flash-250414'))
    
    def get_api_key(self):
        # 兼容旧格式
        if 'api_key' in self.ai_config:
            return self.ai_config.get('api_key', '')
        return ''
    
    def get_provider_api_key(self, provider: str):
        """获取指定提供商的API Key"""
        api_keys = self.ai_config.get('api_keys', {})
        return api_keys.get(provider, '')
    
    def set_provider_api_key(self, provider: str, api_key: str):
        """设置指定提供商的API Key"""
        if 'api_keys' not in self.ai_config:
            self.ai_config['api_keys'] = {}
        self.ai_config['api_keys'][provider] = api_key

    def __str__(self):
        return self.username
