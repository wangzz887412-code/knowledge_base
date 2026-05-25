import requests
import json

def test_ollama_direct():
    """直接测试Ollama API"""
    url = "http://localhost:11434/v1/chat/completions"
    
    payload = {
        "model": "qwen3.5:4b",
        "messages": [
            {
                "role": "system",
                "content": "你是一个专业的文档摘要助手。请根据用户的要求对文档内容进行总结、分析或回答问题。"
            },
            {
                "role": "user",
                "content": "请总结以下内容：\n\n人工智能是一门研究、开发用于模拟、延伸和扩展人的智能的理论、方法、技术及应用系统的一门新的技术科学。人工智能领域的研究包括机器人、语言识别、图像识别、自然语言处理和专家系统等。"
            }
        ],
        "max_tokens": 500,
        "temperature": 0.3
    }
    
    try:
        print("📡 正在调用Ollama API...")
        response = requests.post(url, json=payload, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Ollama调用成功!")
            print("📝 响应内容:")
            print(result['choices'][0]['message']['content'])
            return True
        else:
            print(f"❌ Ollama调用失败，状态码: {response.status_code}")
            print(f"错误信息: {response.text}")
            return False
    except Exception as e:
        print(f"❌ 调用异常: {e}")
        return False

def test_ollama_wrong_model():
    """测试使用错误的模型名称"""
    url = "http://localhost:11434/v1/chat/completions"
    
    payload = {
        "model": "qwen3.5:0.8b",  # 不存在的模型
        "messages": [
            {
                "role": "user",
                "content": "你好"
            }
        ]
    }
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        print(f"使用错误模型的状态码: {response.status_code}")
        if response.status_code != 200:
            print(f"错误信息: {response.text}")
    except Exception as e:
        print(f"异常: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("🧪 直接测试Ollama API")
    print("=" * 60)
    
    # 测试正确的模型
    test_ollama_direct()
    
    print("\n" + "=" * 60)
    print("🧪 测试错误的模型")
    print("=" * 60)
    test_ollama_wrong_model()