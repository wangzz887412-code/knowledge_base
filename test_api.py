#!/usr/bin/env python
"""
简单API测试
"""
import requests

BASE_URL = 'http://127.0.0.1:8000/api'

print("测试健康检查...")
try:
    r = requests.get(f'{BASE_URL}/users/login/')
    print(f"状态码: {r.status_code}")
    print(f"响应: {r.text[:200]}")
except Exception as e:
    print(f"错误: {e}")

print("\n测试登录...")
try:
    r = requests.post(
        f'{BASE_URL}/users/login/',
        json={
            'username': 'testuser_all',
            'password': 'MyStr0ngPass!'
        }
    )
    print(f"状态码: {r.status_code}")
    print(f"响应: {r.text}")
except Exception as e:
    print(f"错误: {e}")
