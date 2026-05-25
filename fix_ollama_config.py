import requests

API_BASE = "http://localhost:8000/api"
TOKEN = "3e351d3bc81d63339a0b193a4a6c3945b2f8cfaf"

url = f"{API_BASE}/ai/config/"
headers = {
    "Authorization": f"Token {TOKEN}",
    "Content-Type": "application/json"
}

data = {
    "model_id": "ollama:qwen3.5:0.8b",
    "api_key": "",
    "enable_vision": False
}

response = requests.put(url, headers=headers, json=data)
if response.status_code == 200:
    print("✅ Ollama配置已更新为 qwen3.5:0.8b")
    print("\n当前配置:")
    print(f"  模型ID: {response.json().get('config', {}).get('model_id')}")
else:
    print(f"❌ 配置更新失败: {response.text}")