from django.db import models
from django.conf import settings
from django.utils import timezone
import os


def get_file_upload_path(instance, filename):
    return f'files/{instance.user.id}/{filename}'


class Category(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=7, default='#D4A574')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name


class File(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    file = models.FileField(upload_to=get_file_upload_path, null=True, blank=True)
    filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50)
    file_size = models.IntegerField(default=0)
    categories = models.ManyToManyField(Category, blank=True)
    status = models.CharField(max_length=20, default='uploading')
    process_status = models.CharField(max_length=20, default='pending')  # pending, processing, completed, failed
    process_progress = models.IntegerField(default=0)  # 0-100
    process_message = models.CharField(max_length=255, blank=True, null=True)
    extracted_text = models.TextField(blank=True, null=True)
    ai_summary = models.TextField(blank=True, null=True)
    ai_analysis = models.TextField(blank=True, null=True)
    mindmap_data = models.JSONField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    is_public = models.BooleanField(default=False)
    share_token = models.CharField(max_length=64, blank=True, null=True, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.filename


class FileVersion(models.Model):
    file = models.ForeignKey(File, on_delete=models.CASCADE, related_name='versions')
    version_number = models.IntegerField(default=1)
    extracted_text = models.TextField(blank=True, null=True)
    ai_summary = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f'{self.file.filename} v{self.version_number}'


class Bookmark(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    file = models.ForeignKey(File, on_delete=models.CASCADE)
    note = models.CharField(max_length=200, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'file')
    
    def __str__(self):
        return f'{self.user.username} - {self.file.filename}'


class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    ai_config = models.JSONField(default=dict)
    storage_used = models.BigIntegerField(default=0)
    storage_limit = models.BigIntegerField(default=1024 * 1024 * 1024 * 5)  # 5GB
    
    def __str__(self):
        return self.user.username
