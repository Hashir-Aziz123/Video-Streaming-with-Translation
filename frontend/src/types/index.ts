export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export interface TranslationResult {
  userId: string;
  original: string;
  translated: string;
  sourceLang: string;
  targetLang: string;
  reverseTranslation?: string;
}

export interface User {
  id: string;
  name: string;
  language: string;
  streamActive: boolean;
  screenShareActive: boolean;
}

export interface Recording {
  id: number;
  roomId: string;
  userId: string;
  originalText: string;
  translatedText: string;
  targetLanguage: string;
  duration: number;
  createdAt: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe" },
];
