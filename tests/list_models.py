import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("❌ Error: API Key is missing. Check .env file.")
else:
    genai.configure(api_key=api_key)
    print("🔍 Checking available models for your API key...")
    try:
        count = 0
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"✅ Found: {m.name}")
                count += 1
        if count == 0:
            print("❌ No models found. Your API key might be invalid or has no access.")
    except Exception as e:
        print(f"❌ Error listing models: {e}")