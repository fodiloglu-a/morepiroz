// src/app/components/language-setup/language-setup.component.ts

import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LanguageService } from '../../services/language.service';
import { SessionService } from '../../services/session.service';
import { Language, AVAILABLE_LANGUAGES } from '../../models/language.model';

@Component({
  selector: 'app-language-setup',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="language-setup">
      <div class="welcome-card card-large">
        <div class="logo-section">
          <h1 class="app-title">🌊 MorePiroz</h1>
          <p class="app-subtitle">Kutsal Deniz • Sacred Sea • Deryaya Pîroz</p>
        </div>

        <div class="language-selection">
          <h2>{{ getWelcomeText() }}</h2>
          <p class="description">{{ getDescriptionText() }}</p>

          <div class="language-grid">
            <div
              *ngFor="let language of availableLanguages()"
              class="language-option"
              [class.selected]="selectedLanguage() === language.code"
              (click)="selectLanguage(language.code)"
            >
              <span class="flag">{{ language.flag }}</span>
              <div class="language-info">
                <span class="native-name">{{ language.nativeName }}</span>
                <span class="english-name">{{ language.name }}</span>
              </div>
              <div class="radio-button">
                <span class="radio" [class.checked]="selectedLanguage() === language.code"></span>
              </div>
            </div>
          </div>

          <button
            class="btn btn-primary btn-large btn-full"
            [disabled]="!selectedLanguage() || isLoading()"
            (click)="confirmLanguage()"
          >
            <span *ngIf="!isLoading()">{{ getContinueText() }}</span>
            <span *ngIf="isLoading()" class="loading-text">
              <span class="spinner"></span>
              {{ getLoadingText() }}
            </span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .language-setup {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-md);
      background: var(--gradient-primary);
    }

    .welcome-card {
      max-width: 500px;
      width: 100%;
      text-align: center;
    }

    .logo-section {
      margin-bottom: var(--spacing-2xl);
    }

    .app-title {
      font-size: var(--font-size-3xl);
      margin-bottom: var(--spacing-md);
      background: var(--gradient-secondary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .app-subtitle {
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
      margin: 0;
    }

    .language-selection h2 {
      margin-bottom: var(--spacing-md);
      color: var(--text-primary);
    }

    .description {
      margin-bottom: var(--spacing-xl);
      color: var(--text-secondary);
    }

    .language-grid {
      display: grid;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-xl);
    }

    .language-option {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-lg);
      border: 2px solid var(--light-gray);
      border-radius: var(--border-radius);
      cursor: pointer;
      transition: all 0.3s ease;
      background: var(--white);
    }

    .language-option:hover {
      border-color: var(--primary-light);
      transform: translateY(-2px);
      box-shadow: var(--shadow-medium);
    }

    .language-option.selected {
      border-color: var(--primary-blue);
      background: rgba(25, 118, 210, 0.05);
    }

    .flag {
      font-size: var(--font-size-2xl);
      min-width: 32px;
    }

    .language-info {
      flex: 1;
      text-align: left;
    }

    .native-name {
      display: block;
      font-weight: 600;
      color: var(--text-primary);
      font-size: var(--font-size-lg);
    }

    .english-name {
      display: block;
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }

    .radio-button {
      width: 24px;
      height: 24px;
    }

    .radio {
      display: block;
      width: 20px;
      height: 20px;
      border: 2px solid var(--text-hint);
      border-radius: 50%;
      position: relative;
      transition: all 0.3s ease;
    }

    .radio.checked {
      border-color: var(--primary-blue);
      background: var(--primary-blue);
    }

    .radio.checked::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 8px;
      height: 8px;
      background: white;
      border-radius: 50%;
    }

    .loading-text {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
    }

    /* Mobile optimizations */
    @media (max-width: 480px) {
      .language-setup {
        padding: var(--spacing-sm);
      }

      .welcome-card {
        padding: var(--spacing-lg);
      }

      .language-option {
        padding: var(--spacing-md);
      }
    }
  `]
})
export class LanguageSetupComponent implements OnInit {
  // Signals
  selectedLanguage = signal<string>('');
  availableLanguages = signal<Language[]>(AVAILABLE_LANGUAGES);
  isLoading = signal<boolean>(false);

  constructor(
    private languageService: LanguageService,
    private sessionService: SessionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Tarayıcı dilini default olarak seç
    const browserLanguage = this.languageService.getBrowserLanguage();
    this.selectedLanguage.set(browserLanguage);
  }

  // Dil seç
  selectLanguage(languageCode: string): void {
    this.selectedLanguage.set(languageCode);
  }

  // Dili onayla ve session oluştur
  confirmLanguage(): void {
    const selected = this.selectedLanguage();
    if (!selected) return;

    this.isLoading.set(true);

    // Önce dili ayarla
    this.languageService.setLanguage(selected).subscribe({
      next: () => {
        // Sonra session oluştur
        this.sessionService.createSessionWithLanguage(selected).subscribe({
          next: (response) => {
            if (response.success) {
              this.router.navigate(['/']);
            } else {
              console.error('Session creation failed:', response.message);
              this.isLoading.set(false);
            }
          },
          error: (error) => {
            console.error('Session creation error:', error);
            this.isLoading.set(false);
          }
        });
      },
      error: (error) => {
        console.error('Language setting error:', error);
        this.isLoading.set(false);
      }
    });
  }

  // Çok dilli metinler (hardcoded, henüz çeviri sistemi yok)
  getWelcomeText(): string {
    const texts: { [key: string]: string } = {
      'ua': 'Оберіть мову додатка',
      'ku': 'Zimana sepanê hilbijêre',
      'en': 'Select app language',
      'tr': 'Uygulama dilini seçin',
      'ru': 'Выберите язык приложения'
    };
    return texts[this.selectedLanguage()] || texts['en'];
  }

  getDescriptionText(): string {
    const texts: { [key: string]: string } = {
      'ua': 'Ця мова буде використовуватися в додатку',
      'ku': 'Ev ziman dê li sepanê were bikaranîn',
      'en': 'This language will be used throughout the app',
      'tr': 'Bu dil uygulama boyunca kullanılacak',
      'ru': 'Этот язык будет использоваться в приложении'
    };
    return texts[this.selectedLanguage()] || texts['en'];
  }

  getContinueText(): string {
    const texts: { [key: string]: string } = {
      'ua': 'Продовжити',
      'ku': 'Berdewam',
      'en': 'Continue',
      'tr': 'Devam Et',
      'ru': 'Продолжить'
    };
    return texts[this.selectedLanguage()] || texts['en'];
  }

  getLoadingText(): string {
    const texts: { [key: string]: string } = {
      'ua': 'Налаштування...',
      'ku': 'Sazkirî...',
      'en': 'Setting up...',
      'tr': 'Kuruluyor...',
      'ru': 'Настройка...'
    };
    return texts[this.selectedLanguage()] || texts['en'];
  }
}
