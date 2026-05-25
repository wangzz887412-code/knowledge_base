#!/usr/bin/env python
"""
知识库网站功能全面测试
"""
import requests
import json
import os
from io import BytesIO
import time

BASE_URL = 'http://localhost:8000/api'

print("=" * 60)
print("  知识库网站功能测试")
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

# 2. 上传文件
print("\n2. 上传测试文件...")
try:
    test_content = b"This is a test document about knowledge management system. It contains test content for searching and indexing."
    files = {'file': ('test_knowledge2.txt', BytesIO(test_content), 'text/plain')}
    
    r = requests.post(
        f'{BASE_URL}/files/files/',
        headers=headers,
        files=files,
        timeout=30
    )
    print(f"状态码: {r.status_code}")
    if r.status_code == 201:
        file_data = r.json()
        print(f"✅ 文件上传成功！")
        print(f"   文件ID: {file_data.get('id')}")
        print(f"   文件名: {file_data.get('filename')}")
        print(f"   状态: {file_data.get('status')}")
        file_id = file_data.get('id')
    else:
        print(f"❌ 上传失败: {r.text}")
except Exception as e:
    print(f"❌ 上传失败: {e}")

# 3. 获取文件列表
print("\n3. 获取文件列表...")
try:
    r = requests.get(f'{BASE_URL}/files/files/', headers=headers, timeout=5)
    if r.status_code == 200:
        data = r.json()
        results = data.get('results', data) if isinstance(data, dict) else data
        print(f"✅ 文件列表获取成功，共 {len(results)} 个文件")
        for file in results:
            print(f"   - {file.get('filename')} ({file.get('status')})")
except Exception as e:
    print(f"❌ 获取文件列表失败: {e}")

# 4. 测试搜索
print("\n4. 测试搜索功能...")
try:
    r = requests.get(
        f'{BASE_URL}/ai/search/',
        headers=headers,
        params={'q': 'knowledge'},
        timeout=10
    )
    if r.status_code == 200:
        data = r.json()
        print(f"✅ 搜索成功！")
        print(f"   找到 {data.get('total', 0)} 个结果")
        results = data.get('results', [])
        for result in results[:3]:
            print(f"   - {result.get('filename')}")
except Exception as e:
    print(f"❌ 搜索失败: {e}")

# 5. 测试AI配置
print("\n5. 测试AI配置...")
try:
    r = requests.get(f'{BASE_URL}/ai/config/', headers=headers, timeout=5)
    if r.status_code == 200:
        data = r.json()
        print(f"✅ AI配置获取成功！")
        print(f"   当前模型: {data.get('config', {}).get('model_id')}")
        print(f"   当前模式: {data.get('config', {}).get('ai_mode')}")
except Exception as e:
    print(f"❌ 获取AI配置失败: {e}")

print("\n" + "=" * 60)
print("  测试完成！")
print("=" * 60)
