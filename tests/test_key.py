import os
from dotenv import load_dotenv
import google.generativeai as genai

# 1. Load the secret key
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("❌ Error: API Key not found! Check your .env file.")
    exit()

# 2. Configure Gemini
genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-2.5-flash')

# 3. Ask it a question
print("🤖 Asking Gemini to say hello...")
try:
    response = model.generate_content("Say 'System Operational' if you can hear me.")
    print(f"✅ Success! Gemini says: {response.text}")
except Exception as e:
    print(f"❌ Error: {e}")