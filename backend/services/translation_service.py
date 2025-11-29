import google.generativeai as genai
from typing import Optional
from config import Config

class TranslationService:
    def __init__(self):
        genai.configure(api_key=Config.GOOGLE_API_KEY)
        self.model = genai.GenerativeModel(
            model_name=Config.GEMINI_MODEL_NAME,
            generation_config=Config.GENERATION_CONFIG
        )

    def translate(self, text: str, target_language: str) -> Optional[str]:
        """
        Translate text to target language using Gemini API

        Args:
            text: The text to translate
            target_language: The target language name (e.g., 'Spanish', 'French')

        Returns:
            Translated text or None if error occurs
        """
        if not text:
            return None

        prompt = self._build_translation_prompt(text, target_language)

        try:
            response = self.model.generate_content(prompt)
            translated_text = response.text.strip()
            return translated_text
        except Exception as e:
            print(f"❌ Translation Error: {e}")
            return None

    def _build_translation_prompt(self, text: str, target_language: str) -> str:
        """
        Build an optimized few-shot prompt for translation

        The prompt uses examples to guide the model to:
        - Return ONLY the translation
        - Avoid explanations or notes
        - Be concise and fast
        """
        return f"""Task: Translate to {target_language}.
Rule: Return ONLY the translated text. No notes, no explanations.

Examples:
Input: Hello there
Output: Hola
Input: How are you doing?
Output: ¿Cómo estás?
Input: Good morning
Output: Buenos días

Input: {text}
Output:"""
