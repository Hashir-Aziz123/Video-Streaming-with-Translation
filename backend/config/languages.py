"""
Language configuration for translation service
Maps language names to their respective language codes and configurations
"""

SUPPORTED_LANGUAGES = {
    "Spanish": {"code": "es", "native_name": "Español"},
    "French": {"code": "fr", "native_name": "Français"},
    "German": {"code": "de", "native_name": "Deutsch"},
    "Hindi": {"code": "hi", "native_name": "हिन्दी"},
    "Chinese": {"code": "zh", "native_name": "中文"},
    "Japanese": {"code": "ja", "native_name": "日本語"},
    "Korean": {"code": "ko", "native_name": "한국어"},
    "Arabic": {"code": "ar", "native_name": "العربية"},
    "Portuguese": {"code": "pt", "native_name": "Português"},
    "Russian": {"code": "ru", "native_name": "Русский"},
    "Italian": {"code": "it", "native_name": "Italiano"},
    "Turkish": {"code": "tr", "native_name": "Türkçe"},
}

def get_language_info(language_name: str) -> dict:
    """Get language information by name"""
    return SUPPORTED_LANGUAGES.get(language_name, {"code": "es", "native_name": "Español"})

def get_all_languages() -> list:
    """Get list of all supported languages"""
    return [
        {"name": name, **info}
        for name, info in SUPPORTED_LANGUAGES.items()
    ]
