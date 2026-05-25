from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model

User = get_user_model()


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'storage_mode', 'is_staff', 'created_at']
    list_filter = ['is_staff', 'is_superuser', 'is_active', 'storage_mode', 'created_at']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('存储配置', {'fields': ('storage_mode', 'cloud_config', 'ai_config')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('存储配置', {'fields': ('storage_mode',)}),
    )
