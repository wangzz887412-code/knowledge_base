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

    def __str__(self):
        return self.username
