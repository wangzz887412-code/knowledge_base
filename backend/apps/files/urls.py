from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, FileViewSet, BookmarkViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'files', FileViewSet, basename='file')
router.register(r'bookmarks', BookmarkViewSet, basename='bookmark')

urlpatterns = [
    path('', include(router.urls)),
]
