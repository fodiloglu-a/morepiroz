// src/app/models/language.model.ts

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  isRTL: boolean;
}

export interface Translation {
  [key: string]: string | Translation;
}

export interface LanguageResponse {
  success: boolean;
  message: string;
  data?: Language[];
}

export enum SupportedLanguages {
  UKRAINIAN = 'ua',
  KURDISH = 'ku',
  ENGLISH = 'en',
  TURKISH = 'tr',
  RUSSIAN = 'ru'
}

export const AVAILABLE_LANGUAGES: Language[] = [
  {
    code: 'ua',
    name: 'Ukrainian',
    nativeName: 'Українська',
    flag: '🇺🇦',
    isRTL: false
  },
  {
    code: 'ku',
    name: 'Kurdish',
    nativeName: 'Kurdî',
    flag: '🏴',
    isRTL: false
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    isRTL: false
  },
  {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    flag: '🇹🇷',
    isRTL: false
  },
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    isRTL: false
  }
];

export const DEFAULT_LANGUAGE = SupportedLanguages.UKRAINIAN;
