// src/app/components/settings/settings.component.ts

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { TranslatePipe } from '../../pipes/translate.pipe';
import { LanguageService } from '../../services/language.service';
import { SessionService } from '../../services/session.service';
import { LanguageSelectorComponent } from '../shared/language-selector/language-selector.component';
import { Language, AVAILABLE_LANGUAGES } from '../../models/language.model';
import { UserSession } from '../../models/user-session.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, TranslatePipe, LanguageSelectorComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  // Signals
  currentSession = signal<UserSession | null>(null);
  currentLanguage = signal<string>('tr');
  availableLanguages = signal<Language[]>(AVAILABLE_LANGUAGES);
  isDarkMode = signal<boolean>(false);
  notificationsEnabled = signal<boolean>(true);
  soundEnabled = signal<boolean>(true);
  showDeleteConfirm = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  // App info
  readonly appVersion = '1.0.0';
  readonly buildDate = new Date().getFullYear();

  constructor(
    private router: Router,
    private languageService: LanguageService,
    private sessionService: SessionService
  ) {}

  ngOnInit(): void {
    this.checkSession();
    this.loadSettings();
    this.setupLanguageSubscription();
  }

  // Session kontrolü
  private checkSession(): void {
    if (!this.sessionService.hasValidSession()) {
      this.router.navigate(['/language-setup']);
    }
  }

  // Ayarları yükle
  private loadSettings(): void {
    // Current session
    this.sessionService.currentSession$.subscribe(session => {
      this.currentSession.set(session);
    });

    // Current language
    this.currentLanguage.set(this.languageService.getCurrentLanguageCode());

    // LocalStorage'dan diğer ayarları yükle
    this.loadUserPreferences();
  }

  // Kullanıcı tercihlerini yükle
  private loadUserPreferences(): void {
    const darkMode = localStorage.getItem('morepiroz_dark_mode') === 'true';
    const notifications = localStorage.getItem('morepiroz_notifications') !== 'false';
    const sound = localStorage.getItem('morepiroz_sound') !== 'false';

    this.isDarkMode.set(darkMode);
    this.notificationsEnabled.set(notifications);
    this.soundEnabled.set(sound);

    // Dark mode'u uygula
    this.applyDarkMode(darkMode);
  }

  // Dil değişikliği subscription
  private setupLanguageSubscription(): void {
    this.languageService.currentLanguage$.subscribe(languageCode => {
      this.currentLanguage.set(languageCode);
    });
  }

  // Dark mode toggle
  toggleDarkMode(): void {
    const newValue = !this.isDarkMode();
    this.isDarkMode.set(newValue);
    localStorage.setItem('morepiroz_dark_mode', newValue.toString());
    this.applyDarkMode(newValue);
  }

  // Dark mode uygula
  private applyDarkMode(enabled: boolean): void {
    if (enabled) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  // Bildirimler toggle
  toggleNotifications(): void {
    const newValue = !this.notificationsEnabled();
    this.notificationsEnabled.set(newValue);
    localStorage.setItem('morepiroz_notifications', newValue.toString());

    if (newValue) {
      this.requestNotificationPermission();
    }
  }

  // Bildirim izni iste
  private requestNotificationPermission(): void {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'denied') {
          this.notificationsEnabled.set(false);
          localStorage.setItem('morepiroz_notifications', 'false');
        }
      });
    }
  }

  // Ses toggle
  toggleSound(): void {
    const newValue = !this.soundEnabled();
    this.soundEnabled.set(newValue);
    localStorage.setItem('morepiroz_sound', newValue.toString());
  }

  // Dil değiştir
  onLanguageChange(): void {
    // LanguageSelector component handles this
    setTimeout(() => {
      this.currentLanguage.set(this.languageService.getCurrentLanguageCode());
    }, 100);
  }

  // Verileri temizle
  clearData(): void {
    this.showDeleteConfirm.set(true);
  }

  // Veri silmeyi onayla
  confirmClearData(): void {
    this.isLoading.set(true);

    // Clear all localStorage data
    const keysToRemove = [
      'morepiroz_session',
      'morepiroz_language',
      'morepiroz_dark_mode',
      'morepiroz_notifications',
      'morepiroz_sound'
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    // Reset session
    this.sessionService.clearSession();

    setTimeout(() => {
      this.isLoading.set(false);
      this.showDeleteConfirm.set(false);
      this.router.navigate(['/language-setup']);
    }, 1500);
  }

  // Veri silmeyi iptal et
  cancelClearData(): void {
    this.showDeleteConfirm.set(false);
  }

  // Geri dön
  goBack(): void {
    this.router.navigate(['/']);
  }

  // Ana sayfaya git
  goHome(): void {
    this.router.navigate(['/']);
  }

  // Session bilgileri
  getSessionInfo(): any {
    const session = this.currentSession();
    if (!session) return null;

    return {
      created: new Date(session.createdAt).toLocaleDateString(),
      expires: new Date(session.expiresAt).toLocaleDateString(),
      messageCount: session.messageCount,
      replyCount: session.replyCount,
      token: session.token.substring(0, 8) + '...'
    };
  }

  // Mevcut dil bilgisi
  getCurrentLanguageInfo(): Language | undefined {
    return this.availableLanguages().find(
      lang => lang.code === this.currentLanguage()
    );
  }

  // Uygulama hakkında
  openAbout(): void {
    // Modal veya yeni sayfa açılabilir
    alert(this.languageService.translate('settings.about.description'));
  }

  // Geri bildirim gönder
  sendFeedback(): void {
    const subject = encodeURIComponent('MorePiroz Feedback');
    const body = encodeURIComponent(
      this.languageService.translate('settings.feedback.template')
    );

    window.open(`mailto:feedback@morepiroz.com?subject=${subject}&body=${body}`);
  }

  // Privacy policy
  openPrivacyPolicy(): void {
    window.open('https://morepiroz.com/privacy', '_blank');
  }

  // Terms of service
  openTermsOfService(): void {
    window.open('https://morepiroz.com/terms', '_blank');
  }

  // Support
  openSupport(): void {
    window.open('https://morepiroz.com/support', '_blank');
  }

  // Export data
  exportData(): void {
    const session = this.currentSession();
    if (!session) return;

    const data = {
      exportDate: new Date().toISOString(),
      language: this.currentLanguage(),
      messageCount: session.messageCount,
      replyCount: session.replyCount,
      preferences: {
        darkMode: this.isDarkMode(),
        notifications: this.notificationsEnabled(),
        sound: this.soundEnabled()
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `morepiroz-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Development mode bilgisi
  isDevelopmentMode(): boolean {
    return !navigator.onLine || window.location.hostname === 'localhost';
  }

  // Reset to defaults
  resetToDefaults(): void {
    this.isDarkMode.set(false);
    this.notificationsEnabled.set(true);
    this.soundEnabled.set(true);

    localStorage.setItem('morepiroz_dark_mode', 'false');
    localStorage.setItem('morepiroz_notifications', 'true');
    localStorage.setItem('morepiroz_sound', 'true');

    this.applyDarkMode(false);
  }

  // Get storage usage
  getStorageUsage(): string {
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key) && key.startsWith('morepiroz_')) {
        totalSize += localStorage[key].length;
      }
    }

    if (totalSize < 1024) return `${totalSize} bytes`;
    if (totalSize < 1024 * 1024) return `${(totalSize / 1024).toFixed(1)} KB`;
    return `${(totalSize / (1024 * 1024)).toFixed(1)} MB`;
  }
}
