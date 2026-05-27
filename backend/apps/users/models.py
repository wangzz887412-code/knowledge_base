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
        return self.ai_config.get('api_key', '')

    def __str__(self):
        return self.username
