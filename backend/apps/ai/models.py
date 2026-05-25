from django.db import models
from django.conf import settings


class ChatHistory(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=200, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title or f'对话 {self.id}'
    
    class Meta:
        ordering = ['-updated_at']


class ChatMessage(models.Model):
    chat_history = models.ForeignKey(ChatHistory, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=[('user', '用户'), ('assistant', '助手')])
    content = models.TextField()
    file_ids = models.JSONField(default=list)
    mode_used = models.CharField(max_length=20, default='basic')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f'{self.role}: {self.content[:50]}'
    
    class Meta:
        ordering = ['created_at']
