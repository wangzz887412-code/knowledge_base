import requests
import json
import time
import os

# 配置
API_BASE = "http://localhost:8000/api"
TOKEN = "3e351d3bc81d63339a0b193a4a6c3945b2f8cfaf"  # 用户wzz的token
TEST_FILE_PATH = "test_document.txt"

def create_test_file():
    """创建测试文档"""
    content = """# 智能计算专业介绍

## 一、专业概述

智能计算是一门融合了人工智能、计算机科学、数据科学和机器学习的新兴交叉学科。该专业旨在培养具备扎实的计算机基础理论和前沿人工智能技术的复合型人才。

## 二、核心课程

1. **人工智能基础**：学习神经网络、深度学习、强化学习等核心技术
2. **数据科学**：掌握数据挖掘、数据分析和大数据处理技术
3. **机器学习算法**：深入理解各种机器学习算法的原理和应用
4. **自然语言处理**：学习文本分析、语义理解和语言生成技术
5. **计算机视觉**：掌握图像识别、目标检测和图像生成技术

## 三、就业方向

- 人工智能工程师
- 机器学习研究员
- 数据科学家
- 算法工程师
- 深度学习工程师

## 四、发展前景

随着人工智能技术的快速发展，智能计算专业的毕业生在就业市场上非常抢手。各大科技公司都在大力发展AI业务，对相关人才的需求持续增长。

## 五、总结

智能计算专业是面向未来的前沿学科，具有广阔的发展前景和良好的就业机会。"""
    
    with open(TEST_FILE_PATH, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✅ 测试文件已创建: {TEST_FILE_PATH}")

def upload_file():
    """上传文件"""
    url = f"{API_BASE}/files/files/"
    headers = {
        "Authorization": f"Token {TOKEN}"
    }
    
    with open(TEST_FILE_PATH, 'rb') as f:
        data = {
            'file': f
        }
        files = {
            'file': ('test_document.txt', f, 'text/plain')
        }
        
        print("📤 正在上传文件...")
        response = requests.post(url, headers=headers, files=files)
        
        if response.status_code == 201:
            result = response.json()
            print(f"✅ 文件上传成功!")
            print(f"   文件ID: {result.get('id')}")
            print(f"   文件名: {result.get('filename')}")
            return result.get('id')
        else:
            print(f"❌ 文件上传失败!")
            print(f"   状态码: {response.status_code}")
            print(f"   错误信息: {response.text}")
            return None

def check_progress(file_id):
    """检查处理进度"""
    url = f"{API_BASE}/files/files/{file_id}/"
    headers = {
        "Authorization": f"Token {TOKEN}"
    }
    
    print(f"\n🔄 开始轮询文件 {file_id} 的处理进度...")
    
    for i in range(10):  # 最多轮询10次
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            process_status = result.get('process_status', 'unknown')
            process_progress = result.get('process_progress', 0)
            process_message = result.get('process_message', '')
            ai_summary = result.get('ai_summary', '')
            
            print(f"\n第 {i+1} 次轮询:")
            print(f"   处理状态: {process_status}")
            print(f"   处理进度: {process_progress}%")
            print(f"   进度消息: {process_message}")
            
            if ai_summary:
                print(f"\n📝 AI摘要已生成:")
                print(f"   {ai_summary[:200]}..." if len(ai_summary) > 200 else f"   {ai_summary}")
            
            if process_status == 'completed':
                print("\n🎉 文件处理完成!")
                return True
            elif process_status == 'failed':
                print(f"\n❌ 文件处理失败: {process_message}")
                return False
            
        else:
            print(f"❌ 获取进度失败，状态码: {response.status_code}")
        
        time.sleep(5)  # 每5秒轮询一次，给Ollama足够的响应时间
    
    print("\n⏰ 轮询超时，文件可能仍在处理中")
    return None

def verify_summary(file_id):
    """验证生成的摘要"""
    url = f"{API_BASE}/files/files/{file_id}/"
    headers = {
        "Authorization": f"Token {TOKEN}"
    }
    
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        result = response.json()
        ai_summary = result.get('ai_summary', '')
        
        print("\n📋 验证AI摘要:")
        print("=" * 60)
        print(ai_summary)
        print("=" * 60)
        
        if ai_summary and "请在AI设置中配置API密钥" not in ai_summary:
            print("\n✅ AI摘要生成成功!")
            return True
        else:
            print("\n❌ AI摘要未生成或需要配置API密钥")
            return False
    else:
        print(f"❌ 获取文件详情失败，状态码: {response.status_code}")
        return False

def main():
    print("=" * 60)
    print("🤖 测试Ollama模型文档摘要生成")
    print("=" * 60)
    
    # 1. 创建测试文件
    create_test_file()
    
    try:
        # 2. 上传文件
        file_id = upload_file()
        
        if not file_id:
            print("❌ 测试失败: 文件上传失败")
            return
        
        # 3. 检查处理进度
        result = check_progress(file_id)
        
        if result is False:
            print("❌ 测试失败: 文件处理失败")
            return
        
        # 4. 验证摘要
        verify_summary(file_id)
        
    finally:
        # 清理测试文件
        if os.path.exists(TEST_FILE_PATH):
            os.remove(TEST_FILE_PATH)
            print(f"\n🗑️ 测试文件已清理")

if __name__ == "__main__":
    main()