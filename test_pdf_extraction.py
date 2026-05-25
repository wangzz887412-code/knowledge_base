#!/usr/bin/env python
"""
测试PDF文件解析功能
"""
import requests
import os

BASE_URL = 'http://localhost:8000/api'

print("=" * 60)
print("  PDF文件解析测试")
print("=" * 60)

# 1. 登录获取token
print("\n1. 登录获取Token...")
try:
    r = requests.post(
        f'{BASE_URL}/users/login/',
        json={
            'username': 'testuser_all',
            'password': 'MyStr0ngPass!'
        },
        timeout=5
    )
    if r.status_code == 200:
        token = r.json()['token']
        print(f"✅ 登录成功，Token: {token[:20]}...")
        headers = {'Authorization': f'Token {token}'}
    else:
        print(f"❌ 登录失败: {r.text}")
        exit(1)
except Exception as e:
    print(f"❌ 登录失败: {e}")
    exit(1)

# 2. 测试上传TXT文件
print("\n2. 测试上传TXT文件...")
try:
    test_content = """Knowledge Management System Test Document

This document tests the file parsing functionality of the knowledge management system.

Main Features:
1. Document Upload
2. Text Extraction
3. AI Summary Generation
4. Mind Map Creation

File Formats:
- TXT, MD, PDF, DOCX support
- Batch upload support
- Original file preview

Search Features:
- Natural language semantic search
- Keyword highlighting
- Filter by type and date

AI Features:
- Auto-generate document summary
- Create knowledge relationship mind map
- Support multiple AI model configurations
"""
    files = {'file': ('test_content.txt', test_content, 'text/plain')}
    
    r = requests.post(
        f'{BASE_URL}/files/files/',
        headers=headers,
        files=files,
        timeout=30
    )
    print(f"Status: {r.status_code}")
    if r.status_code == 201:
        file_data = r.json()
        print(f"✅ File uploaded successfully!")
        print(f"   File ID: {file_data.get('id')}")
        print(f"   Filename: {file_data.get('filename')}")
        print(f"   Status: {file_data.get('status')}")
        text_len = len(file_data.get('extracted_text', ''))
        print(f"   Extracted text length: {text_len} characters")
        ai_summary = file_data.get('ai_summary', '')
        print(f"   AI Summary: {ai_summary[:50]}...")
    else:
        print(f"❌ Upload failed: {r.text}")
except Exception as e:
    print(f"❌ Upload failed: {e}")

print("\n" + "=" * 60)
print("  Test completed!")
print("=" * 60)
