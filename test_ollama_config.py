import requests

# 配置
API_BASE = "http://localhost:8000/api"
TOKEN = "3e351d3bc81d63339a0b193a4a6c3945b2f8cfaf"

def get_current_config():
    """获取当前AI配置"""
    url = f"{API_BASE}/ai/config/"
    headers = {"Authorization": f"Token {TOKEN}"}
    
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()
    return None

def set_ollama_config():
    """设置Ollama配置"""
    url = f"{API_BASE}/ai/config/"
    headers = {
        "Authorization": f"Token {TOKEN}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model_id": "ollama:qwen3.5:4b",  # 使用实际安装的模型
        "api_key": "",
        "enable_vision": False
    }
    
    response = requests.put(url, headers=headers, json=data)
    if response.status_code == 200:
        print("✅ Ollama配置已更新")
        return response.json()
    else:
        print(f"❌ 配置更新失败: {response.text}")
        return None

def test_ollama_summary():
    """测试Ollama摘要生成"""
    url = f"{API_BASE}/ai/test/"
    headers = {"Authorization": f"Token {TOKEN}"}
    
    data = {
        "prompt": "请总结以下内容：\n\n人工智能是一门研究、开发用于模拟、延伸和扩展人的智能的理论、方法、技术及应用系统的一门新的技术科学。人工智能领域的研究包括机器人、语言识别、图像识别、自然语言处理和专家系统等。"
    }
    
    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        result = response.json()
        print("📝 AI响应:")
        print(result.get('response', '无响应'))
    else:
        print(f"❌ 测试失败: {response.text}")

def main():
    print("=" * 60)
    print("🔧 检查和配置Ollama模型")
    print("=" * 60)
    
    # 获取当前配置
    config = get_current_config()
    if config:
        print("\n当前AI配置:")
        print(f"  模型: {config.get('config', {}).get('model_id', '未设置')}")
        print(f"  模型名称: {config.get('current_model', {}).get('name', '未知')}")
        
        current_model = config.get('config', {}).get('model_id', '')
        if not current_model.startswith('ollama'):
            print("\n⚠️ 当前模型不是Ollama，正在更新配置...")
            set_ollama_config()
    
    # 测试摘要生成
    print("\n" + "=" * 60)
    print("🧪 测试Ollama摘要生成")
    print("=" * 60)
    test_ollama_summary()

if __name__ == "__main__":
    main()