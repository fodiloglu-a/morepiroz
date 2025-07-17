// src/app/services/language.service.ts

import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  Language,
  Translation,
  SupportedLanguages,
  AVAILABLE_LANGUAGES,
  DEFAULT_LANGUAGE
} from '../models/language.model';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly LANGUAGE_KEY = 'morepiroz_language';
  private readonly TRANSLATION_CACHE = new Map<string, Translation>();

  // Reactive state
  private currentLanguageSubject = new BehaviorSubject<string>(DEFAULT_LANGUAGE);
  private translationsSubject = new BehaviorSubject<Translation>({});

  public currentLanguage$ = this.currentLanguageSubject.asObservable();
  public translations$ = this.translationsSubject.asObservable();

  // Signals
  currentLanguage = signal<string>(DEFAULT_LANGUAGE);
  translations = signal<Translation>({});
  isLoading = signal<boolean>(false);
  availableLanguages = signal<Language[]>(AVAILABLE_LANGUAGES);

  constructor(private http: HttpClient) {
    this.initializeLanguage();
  }

  // Dil sistemini başlat
  private initializeLanguage(): void {
    const savedLanguage = this.getSavedLanguage();
    const browserLanguage = this.getBrowserLanguage();
    const initialLanguage = savedLanguage || browserLanguage || DEFAULT_LANGUAGE;

    this.setLanguage(initialLanguage);
  }

  // Kayıtlı dili al
  private getSavedLanguage(): string | null {
    return localStorage.getItem(this.LANGUAGE_KEY);
  }

  // Tarayıcı dilini tespit et
  getBrowserLanguage(): string {
    const browserLang = navigator.language.split('-')[0];
    const supportedLanguages = Object.values(SupportedLanguages);

    return supportedLanguages.includes(browserLang as SupportedLanguages)
      ? browserLang
      : DEFAULT_LANGUAGE;
  }

  // Dil ayarla
  setLanguage(languageCode: string): Observable<Translation> {
    if (!this.isLanguageSupported(languageCode)) {
      languageCode = DEFAULT_LANGUAGE;
    }

    // Cache'den kontrol et
    if (this.TRANSLATION_CACHE.has(languageCode)) {
      const translations = this.TRANSLATION_CACHE.get(languageCode)!;
      this.updateLanguageState(languageCode, translations);
      return of(translations);
    }

    // Çeviri dosyasını yükle
    return this.loadTranslations(languageCode);
  }

  // Çeviri dosyasını yükle
  private loadTranslations(languageCode: string): Observable<Translation> {
    this.isLoading.set(true);

    return this.http.get<Translation>(`/assets/i18n/${languageCode}.json`)
      .pipe(
        map(translations => {
          this.TRANSLATION_CACHE.set(languageCode, translations);
          this.updateLanguageState(languageCode, translations);
          this.isLoading.set(false);
          return translations;
        }),
        catchError(error => {
          console.error(`Translation loading error for ${languageCode}:`, error);
          this.isLoading.set(false);

          // Fallback to default language
          if (languageCode !== DEFAULT_LANGUAGE) {
            return this.loadTranslations(DEFAULT_LANGUAGE);
          }

          return of({});
        })
      );
  }

  // Dil durumunu güncelle
  private updateLanguageState(languageCode: string, translations: Translation): void {
    // LocalStorage'a kaydet
    localStorage.setItem(this.LANGUAGE_KEY, languageCode);

    // State güncelle
    this.currentLanguageSubject.next(languageCode);
    this.translationsSubject.next(translations);

    // Signals güncelle
    this.currentLanguage.set(languageCode);
    this.translations.set(translations);

    // HTML lang attribute
    document.documentElement.lang = languageCode;

    // RTL desteği
    const language = this.getLanguageInfo(languageCode);
    if (language?.isRTL) {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }

  // Çeviri al (nested key desteği ile)
  translate(key: string, params?: { [key: string]: string }): string {
    const translations = this.translations();
    let value = this.getNestedValue(translations, key);

    if (!value) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }

    // Parametre değiştirme
    if (params) {
      Object.keys(params).forEach(param => {
        value = value.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
      });
    }

    return value;
  }

  // Nested obje değeri al
  private getNestedValue(obj: any, key: string): string {
    return key.split('.').reduce((o, k) => o && o[k], obj) || '';
  }

  // Instant çeviri (reactive olmayan)
  instant(key: string, params?: { [key: string]: string }): string {
    return this.translate(key, params);
  }

  // Mevcut dil bilgisi
  getCurrentLanguageInfo(): Language | undefined {
    return this.getLanguageInfo(this.currentLanguage());
  }

  // Dil bilgisi al
  getLanguageInfo(languageCode: string): Language | undefined {
    return AVAILABLE_LANGUAGES.find(lang => lang.code === languageCode);
  }

  // Desteklenen dil mi?
  isLanguageSupported(languageCode: string): boolean {
    return Object.values(SupportedLanguages).includes(languageCode as SupportedLanguages);
  }

  // Tüm desteklenen dilleri al
  getAvailableLanguages(): Language[] {
    return AVAILABLE_LANGUAGES;
  }

  // Mevcut dil kodu
  getCurrentLanguageCode(): string {
    return this.currentLanguage();
  }

  // Dil değiştirildi mi?
  hasLanguageChanged(): boolean {
    const savedLanguage = this.getSavedLanguage();
    return savedLanguage !== null && savedLanguage !== this.currentLanguage();
  }

  // Cache'i temizle
  clearTranslationCache(): void {
    this.TRANSLATION_CACHE.clear();
  }

  // Çeviri dosyasını yenile
  refreshTranslations(): Observable<Translation> {
    const currentLang = this.currentLanguage();
    this.TRANSLATION_CACHE.delete(currentLang);
    return this.loadTranslations(currentLang);
  }

  // Dil için backend isteklerinde kullanılacak header
  getLanguageHeader(): { [key: string]: string } {
    return {
      'Accept-Language': this.currentLanguage(),
      'Content-Language': this.currentLanguage()
    };
  }
}
