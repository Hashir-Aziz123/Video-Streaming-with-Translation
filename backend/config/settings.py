import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'secret!')

    # CORS Configuration
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', '*')

    # Gemini API Configuration
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    GEMINI_MODEL_NAME = 'gemini-2.0-flash'

    # Gemini Generation Config
    GENERATION_CONFIG = {
        "temperature": 0.0,
        "max_output_tokens": 50,
    }

    # Server Configuration
    SERVER_HOST = os.getenv('HOST', '0.0.0.0')
    SERVER_PORT = int(os.getenv('PORT', 5000))
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
