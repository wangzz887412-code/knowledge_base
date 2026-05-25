#!/usr/bin/env python
"""
简化的功能测试
"""
import requests
import json
import os
from io import BytesIO

BASE_URL = 'http://localhost:8000/api'

def print_separator(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print('='*60)

def main():
    print("\n" + "="*60)
    print("  知识库网站功能测试")
    print("="*60)
    
    # 使用已存在的用户登录
    print_separator("用户登录")
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
            print(f"✅ 登录成功! Token: {token[:20]}...")
        else:
            print(f"❌ 登录失败: {r.text}")
            return
    except Exception as e:
        print(f"❌ 登录异常: {e}")
        return
    
    headers = {'Authorization': f'Token {token}'}
    
    # 文件上传测试
    print_separator("文件上传测试")
    try:
        test_content = b"This is a test file for knowledge base system."
        files = {'file': ('test_document.txt', BytesIO(test_content), 'text/plain')}
        data = {'filename': '测试文档.txt'}
        
        r = requests.post(
            f'{BASE_URL}/files/files/',
            headers=headers,
            files=files,
            data=data,
            timeout=10
        )
        print(f"状态码: {r.status_code}")
        if r.status_code == 201:
            print(f"✅ 文件上传成功!")
            file_data = r.json()
            print(f"   文件名: {file_data.get('filename')}")
            print(f"   文件ID: {file_data.get('id')}")
        else:
            print(f"❌ 上传失败: {r.text}")
    except Exception as e:
        print(f"❌ 上传异常: {e}")
    
    # 文件列表测试
    print_separator("文件列表测试")
    try:
        r = requests.get(f'{BASE_URL}/files/files/', headers=headers, timeout=5)
        if r.status_code == 200:
            data = r.json()
            results = data.get('results', data) if isinstance(data, dict) else data
            print(f"✅ 文件列表: {len(results)} 个文件")
            if results:
                for i, file in enumerate(results[:3], 1):
                    print(f"  {i}. {file.get('filename', 'N/A')}")
    except Exception as e:
        print(f"❌ 获取文件列表失败: {e}")
    
    # AI配置测试
    print_separator("AI配置测试")
    try:
        r = requests.get(f'{BASE_URL}/ai/config/', headers=headers, timeout=5)
        if r.status_code == 200:
            print(f"✅ AI配置获取成功!")
            data = r.json()
            print(f"   模型: {data['config']['model_id']}")
            print(f"   模式: {data['config']['ai_mode']}")
    except Exception as e:
        print(f"❌ 获取AI配置失败: {e}")
    
    # 搜索功能测试
    print_separator("搜索功能测试")
    try:
        r = requests.post(
            f'{BASE_URL}/ai/search/',
            headers=headers,
            json={'query': 'test'},
            timeout=10
        )
        if r.status_code == 200:
            data = r.json()
            print(f"✅ 搜索功能正常!")
            print(f"   结果数: {len(data.get('results', []))}")
    except Exception as e:
        print(f"❌ 搜索失败: {e}")
    
    print_separator("测试完成")
    print("\n✅ 核心功能测试完成!")
    print("\n访问地址:")
    print("  前端: http://localhost:3000")
    print("  后端: http://localhost:8000")

if __name__ == '__main__':
    main()
