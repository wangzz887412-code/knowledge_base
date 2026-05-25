#!/usr/bin/env python
"""
知识库网站功能综合测试脚本
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

def test_health():
    """测试API健康状态"""
    print_separator("测试API健康状态")
    try:
        # 测试数据库连接
        r = requests.get(f'{BASE_URL}/users/register/', timeout=2)
        print(f"✅ API响应: {r.status_code}")
        return True
    except Exception as e:
        print(f"❌ API无法访问: {e}")
        return False

def test_register(username, email, password):
    """测试用户注册"""
    print_separator(f"测试用户注册: {username}")
    try:
        r = requests.post(
            f'{BASE_URL}/users/register/',
            json={
                'username': username,
                'email': email,
                'password': password,
                'password2': password
            },
            timeout=5
        )
        print(f"状态码: {r.status_code}")
        print(f"响应: {r.text}")
        return r.status_code == 201
    except Exception as e:
        print(f"❌ 注册失败: {e}")
        return False

def test_login(username, password):
    """测试用户登录"""
    print_separator(f"测试用户登录: {username}")
    try:
        r = requests.post(
            f'{BASE_URL}/users/login/',
            json={
                'username': username,
                'password': password
            },
            timeout=5
        )
        print(f"状态码: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            print(f"✅ 登录成功! Token: {data.get('token', '')[:20]}...")
            return data.get('token')
        else:
            print(f"响应: {r.text}")
            return None
    except Exception as e:
        print(f"❌ 登录失败: {e}")
        return None

def test_get_profile(token):
    """测试获取用户信息"""
    print_separator("测试获取用户信息")
    try:
        headers = {'Authorization': f'Token {token}'}
        r = requests.get(f'{BASE_URL}/users/profile/', headers=headers, timeout=5)
        print(f"状态码: {r.status_code}")
        if r.status_code == 200:
            print(f"✅ 用户信息: {r.json()}")
            return True
        else:
            print(f"响应: {r.text}")
            return False
    except Exception as e:
        print(f"❌ 获取用户信息失败: {e}")
        return False

def test_upload_file(token):
    """测试文件上传"""
    print_separator("测试文件上传")
    try:
        headers = {'Authorization': f'Token {token}'}
        
        # 创建测试文件
        test_content = b"This is a test file for knowledge base system."
        files = {'file': ('test.txt', BytesIO(test_content), 'text/plain')}
        data = {'title': '测试文件', 'description': '这是一个测试文件'}
        
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
            return r.json()
        else:
            print(f"响应: {r.text}")
            return None
    except Exception as e:
        print(f"❌ 文件上传失败: {e}")
        return None

def test_list_files(token):
    """测试文件列表"""
    print_separator("测试文件列表")
    try:
        headers = {'Authorization': f'Token {token}'}
        r = requests.get(f'{BASE_URL}/files/files/', headers=headers, timeout=5)
        print(f"状态码: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            # 处理分页和非分页响应
            results = data.get('results', data) if isinstance(data, dict) else data
            print(f"✅ 文件列表: {len(results)} 个文件")
            if results:
                for i, file in enumerate(results[:3], 1):
                    print(f"  {i}. {file.get('filename', 'N/A')} - {file.get('file_type', 'N/A')}")
            return True
        else:
            print(f"响应: {r.text}")
            return False
    except Exception as e:
        print(f"❌ 获取文件列表失败: {e}")
        return False


def test_search(token, query):
    """测试搜索功能"""
    print_separator(f"测试搜索: {query}")
    try:
        headers = {'Authorization': f'Token {token}'}
        r = requests.post(
            f'{BASE_URL}/ai/search/',
            headers=headers,
            json={'query': query},
            timeout=10
        )
        print(f"状态码: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            print(f"✅ 搜索结果: {len(data.get('results', []))} 个结果")
            return True
        else:
            print(f"响应: {r.text}")
            return False
    except Exception as e:
        print(f"❌ 搜索失败: {e}")
        return False


def test_categories(token):
    """测试分类功能"""
    print_separator("测试分类功能")
    try:
        headers = {'Authorization': f'Token {token}'}
        r = requests.get(f'{BASE_URL}/files/categories/', headers=headers, timeout=5)
        print(f"状态码: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            # 处理分页和非分页响应
            results = data.get('results', data) if isinstance(data, dict) else data
            print(f"✅ 分类列表: {len(results)} 个分类")
            return True
        else:
            print(f"响应: {r.text}")
            return False
    except Exception as e:
        print(f"❌ 获取分类失败: {e}")
        return False

def test_ai_config(token):
    """测试AI配置"""
    print_separator("测试AI配置")
    try:
        headers = {'Authorization': f'Token {token}'}
        r = requests.get(f'{BASE_URL}/ai/config/', headers=headers, timeout=5)
        print(f"状态码: {r.status_code}")
        if r.status_code == 200:
            print(f"✅ AI配置: {r.json()}")
            return True
        else:
            print(f"响应: {r.text}")
            return False
    except Exception as e:
        print(f"❌ 获取AI配置失败: {e}")
        return False

def main():
    print("\n" + "="*60)
    print("  知识库网站功能综合测试")
    print("="*60)
    
    test_results = {}
    
    # 1. 健康检查
    test_results['健康检查'] = test_health()
    if not test_results['健康检查']:
        print("\n❌ API无法访问，请检查服务是否正常启动！")
        return
    
    # 测试用户
    test_username = 'testuser_all'
    test_email = 'testuser_all@example.com'
    test_password = 'MyStr0ngPass!'
    
    # 2. 用户注册
    test_results['用户注册'] = test_register(test_username, test_email, test_password)
    
    # 3. 用户登录
    token = test_login(test_username, test_password)
    test_results['用户登录'] = token is not None
    
    if not token:
        print("\n❌ 无法继续测试，需要有效token")
        return
    
    # 4. 用户信息
    test_results['获取用户信息'] = test_get_profile(token)
    
    # 5. 文件上传
    upload_result = test_upload_file(token)
    test_results['文件上传'] = upload_result is not None
    
    # 6. 文件列表
    test_results['文件列表'] = test_list_files(token)
    
    # 7. 搜索功能
    test_results['搜索功能'] = test_search(token, 'test')
    
    # 8. 分类功能
    test_results['分类功能'] = test_categories(token)
    
    # 9. AI配置
    test_results['AI配置'] = test_ai_config(token)
    
    # 总结
    print_separator("测试总结")
    total = len(test_results)
    passed = sum(1 for v in test_results.values() if v)
    failed = total - passed
    
    for name, result in test_results.items():
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{name}: {status}")
    
    print(f"\n总计: {passed}/{total} 测试通过")
    
    if failed > 0:
        print(f"\n⚠️  {failed} 个测试失败，请检查相关功能！")
    else:
        print("\n🎉 所有核心功能测试通过！")

if __name__ == '__main__':
    main()
