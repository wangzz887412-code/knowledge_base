from django.contrib import admin
from .models import Category, File, FileVersion


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'color', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'user__username']
    date_hierarchy = 'created_at'


@admin.register(File)
class FileAdmin(admin.ModelAdmin):
    list_display = ['user', 'filename', 'file_type', 'file_size', 'status', 'is_public', 'created_at', 'updated_at']
    list_filter = ['status', 'is_public', 'created_at', 'updated_at']
    search_fields = ['filename', 'user__username', 'extracted_text']
    filter_horizontal = ['categories']
    date_hierarchy = 'created_at'
    readonly_fields = ['file_size', 'created_at', 'updated_at']


@admin.register(FileVersion)
class FileVersionAdmin(admin.ModelAdmin):
    list_display = ['file', 'version_number', 'created_at']
    list_filter = ['created_at']
    search_fields = ['file__filename']
    date_hierarchy = 'created_at'
