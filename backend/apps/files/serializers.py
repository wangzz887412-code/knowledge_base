from rest_framework import serializers
from .models import Category, File, FileVersion, Bookmark


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'color', 'created_at']


class FileSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)
    
    class Meta:
        model = File
        fields = [
            'id', 'filename', 'file_type', 'file_size', 'categories', 
            'status', 'process_status', 'process_progress', 'process_message',
            'extracted_text', 'ai_summary', 'mindmap_data',
            'notes', 'is_public', 'created_at', 'updated_at'
        ]


class FileUploadSerializer(serializers.ModelSerializer):
    file = serializers.FileField(required=True)
    
    class Meta:
        model = File
        fields = ['file']
    
    def create(self, validated_data):
        file_obj = validated_data['file']
        user = self.context['request'].user
        
        return File.objects.create(
            user=user,
            file=file_obj,
            filename=file_obj.name,
            file_type=file_obj.name.split('.')[-1].upper() if '.' in file_obj.name else 'OTHER',
            file_size=file_obj.size
        )


class FileVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FileVersion
        fields = ['id', 'version_number', 'extracted_text', 'ai_summary', 'notes', 'created_at']


class BookmarkSerializer(serializers.ModelSerializer):
    file = FileSerializer(read_only=True)
    
    class Meta:
        model = Bookmark
        fields = ['id', 'file', 'note', 'created_at']


class BookmarkCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bookmark
        fields = ['file', 'note']
