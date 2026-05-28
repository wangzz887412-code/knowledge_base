from django.urls import path
from .views import (
    SearchView,
    AIChatView,
    AutoTagView,
    AutoCategoryView,
    AIConfigView,
    AIConnectionTestView,
    MindMapRelationView,
    MindMapEditView,
    MindMapRegenerateView
)

urlpatterns = [
    path('search/', SearchView.as_view(), name='ai_search'),
    path('chat/', AIChatView.as_view(), name='ai_chat'),
    path('auto-tag/', AutoTagView.as_view(), name='auto_tag'),
    path('auto-category/', AutoCategoryView.as_view(), name='auto_category'),
    path('config/', AIConfigView.as_view(), name='ai_config'),
    path('test-connection/', AIConnectionTestView.as_view(), name='test_connection'),
    path('mindmap/analyze-relations/', MindMapRelationView.as_view(), name='analyze_relations'),
    path('mindmap/edit/', MindMapEditView.as_view(), name='edit_mindmap'),
    path('mindmap/regenerate/', MindMapRegenerateView.as_view(), name='regenerate_mindmap'),
]