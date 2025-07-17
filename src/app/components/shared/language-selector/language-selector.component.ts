// src/app/components/shared/language-selector/language-selector.component.ts

import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../../services/language.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { Language, AVAILABLE_LANGUAGES } from '../../../models/language.model';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="language-selector">
      <div class="language-current" (click)="toggleDropdown()">
        <span class="flag">{{ getCurrentLanguage()?.flag }}</span>
        <span class="name">{{ getCurrentLanguage()?.nativeName }}</span>
        <span class="arrow" [class.open]="isOpen()">▼</span>
      </div>

      <div class="language-dropdown" [class.show]="isOpen()">
        <div class="dropdown-header">
          <h4>{{ 'language.select' | translate }}</h4>
        </div>

        <div class="language-list">
          <div
            *ngFor="let language of availableLanguages()"
            class="language-item"
            [class.active]="language.code === currentLanguageCode()"
            (click)="selectLanguage(language.code)"
          >
            <span class="flag">{{ language.flag }}</span>
            <div class="language-info">
              <span class="native-name">{{ language.nativeName }}</span>
              <span class="english-name">{{ language.name }}</span>
            </div>
            <span class="check" *ngIf="language.code === currentLanguageCode()">✓</span>
          </div>
        </div>
      </div>

      <div class="overlay" [class.show]="isOpen()" (click)="closeDropdown()"></div>
    </div>
  `,
  styles: [`
    .language-selector {
      position: relative;
      z-index: var(--z-dropdown);
    }

    .language-current {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) var(--spacing-md);
      background: var(--white);
      border: 2px solid var(--light-gray);
      border-radius: var(--border-radius);
      cursor: pointer;
      transition: all 0.3s ease;
      min-height: 48px;
    }

    .language-current:hover {
      border-color: var(--primary-blue);
      box-shadow: var(--shadow-soft);
    }

    .flag {
      font-size: var(--font-size-lg);
    }

    .name {
      flex: 1;
      font-weight: 500;
      color: var(--text-primary);
    }

    .arrow {
      transition: transform 0.3s ease;
      color: var(--text-secondary);
    }

    .arrow.open {
      transform: rotate(180deg);
    }

    .language-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--white);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-strong);
      opacity: 0;
      visibility: hidden;
      transform: translateY(-10px);
      transition: all 0.3s ease;
      z-index: var(--z-dropdown);
      margin-top: var(--spacing-xs);
    }

    .language-dropdown.show {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .dropdown-header {
      padding: var(--spacing-md);
      border-bottom: 1px solid var(--light-gray);
    }

    .dropdown-header h4 {
      margin: 0;
      font-size: var(--font-size-base);
      color: var(--text-primary);
    }

    .language-list {
      max-height: 300px;
      overflow-y: auto;
    }

    .language-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .language-item:hover {
      background: var(--light-gray);
    }

    .language-item.active {
      background: rgba(25, 118, 210, 0.1);
      color: var(--primary-blue);
    }

    .language-item .flag {
      font-size: var(--font-size-lg);
      min-width: 24px;
    }

    .language-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .native-name {
      font-weight: 500;
      color: var(--text-primary);
    }

    .english-name {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }

    .check {
      color: var(--primary-blue);
      font-weight: bold;
    }

    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.1);
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      z-index: calc(var(--z-dropdown) - 1);
    }

    .overlay.show {
      opacity: 1;
      visibility: visible;
    }

    /* Loading state */
    .language-selector.loading .language-current {
      opacity: 0.6;
      pointer-events: none;
    }

    /* Mobile optimizations */
    @media (max-width: 480px) {
      .language-dropdown {
        left: -16px;
        right: -16px;
        width: calc(100vw - 32px);
      }

      .language-item {
        padding: var(--spacing-lg) var(--spacing-md);
        min-height: 56px;
      }

      .language-info {
        gap: 4px;
      }
    }
  `]
})
export class LanguageSelectorComponent implements OnInit {
  // Signals
  isOpen = signal<boolean>(false);
  currentLanguageCode = signal<string>('ua');
  availableLanguages = signal<Language[]>(AVAILABLE_LANGUAGES);
  isLoading = signal<boolean>(false);

  constructor(private languageService: LanguageService) {}

  ngOnInit(): void {
    // Mevcut dili al
    this.currentLanguageCode.set(this.languageService.getCurrentLanguageCode());

    // Dil değişikliklerini dinle
    this.languageService.currentLanguage$.subscribe(languageCode => {
      this.currentLanguageCode.set(languageCode);
    });

    // Loading durumunu dinle
    //  this.languageService.isLoading.subscribe(loading => {
    //    this.isLoading.set(loading);
    //  });
  }

  // Dropdown'ı aç/kapat
  toggleDropdown(): void {
    if (this.isLoading()) return;
    this.isOpen.set(!this.isOpen());
  }

  // Dropdown'ı kapat
  closeDropdown(): void {
    this.isOpen.set(false);
  }

  // Dil seç
  selectLanguage(languageCode: string): void {
    if (this.currentLanguageCode() === languageCode) {
      this.closeDropdown();
      return;
    }

    this.isLoading.set(true);

    this.languageService.setLanguage(languageCode).subscribe({
      next: () => {
        this.currentLanguageCode.set(languageCode);
        this.closeDropdown();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Language change error:', error);
        this.isLoading.set(false);
      }
    });
  }

  // Mevcut dil bilgisini al
  getCurrentLanguage(): Language | undefined {
    return this.availableLanguages().find(
      lang => lang.code === this.currentLanguageCode()
    );
  }

  // Keyboard navigation
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeDropdown();
    }
  }
}
