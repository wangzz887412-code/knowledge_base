#!/usr/bin/env python
"""
调试文件上传
"""
import requests
import json
from io import BytesIO

BASE_URL = 'http://localhost:8000/api'

# 登录
print("登录...")
r = requests.post(
    f'{BASE_URL}/users/login/',
    json={
        'username': 'testuser_all',
        'password': 'MyStr0ngPass!'
    }
)
token = r.json()['token']
headers = {'Authorization': f'Token {token}'}
print(f"Token: {token}")

# 测试1: 直接用file字段
print("\n=== 测试1: 基本文件上传 ===")
test_content = b"Test content"
files = {'file': ('test1.txt', BytesIO(test_content), 'text/plain')}
r = requests.post(f'{BASE_URL}/files/files/', headers=headers, files=files)
print(f"状态码: {r.status_code}")
print(f"响应: {r.text}")

# 测试2: 加上filename
print("\n=== 测试2: 带filename ===")
files = {'file': ('test2.txt', BytesIO(test_content), 'text/plain')}
data = {'filename': '测试文件名.txt'}
r = requests.post(f'{BASE_URL}/files/files/', headers=headers, files=files, data=data)
print(f"状态码: {r.status_code}")
print(f"响应: {r.text}")

# 测试3: 检查文件列表
print("\n=== 测试3: 文件列表 ===")
r = requests.get(f'{BASE_URL}/files/files/', headers=headers)
print(f"状态码: {r.status_code}")
print(f"响应: {r.text}")
