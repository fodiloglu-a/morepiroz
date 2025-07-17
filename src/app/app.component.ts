// src/app/app.component.ts

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { LanguageService } from './services/language.service';
import { SessionService } from './services/session.service';
import { TranslatePipe } from './pipes/translate.pipe';
import { LanguageSelectorComponent } from './components/shared/language-selector/language-selector.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    TranslatePipe,
    LanguageSelectorComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  // Signals
  currentRoute = signal<string>('/');
  isLoading = signal<boolean>(false);
  unreadCount = signal<number>(0);
  isRTL = signal<boolean>(false);
  showHeader = signal<boolean>(true);
  showBottomNav = signal<boolean>(true);

  constructor(
    private router: Router,
    private languageService: LanguageService,
    private sessionService: SessionService
  ) {}

  ngOnInit(): void {
    this.initializeApp();
    this.setupRouteTracking();
    this.setupLanguageDirection();
  }

  // Uygulama başlatma
  private initializeApp(): void {
    // Session kontrolü
    if (!this.sessionService.hasValidSession()) {
      // Sadece ana sayfada değilse language-setup'a yönlendir
      if (this.router.url !== '/language-setup') {
        this.router.navigate(['/language-setup']);
      }
      return;
    }

    // Dil yükleme
    this.isLoading.set(true);
    const currentLanguage = this.languageService.getCurrentLanguageCode();

    this.languageService.setLanguage(currentLanguage).subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Language loading error:', error);
        this.isLoading.set(false);
      }
    });
  }

  // Route takibi
  private setupRouteTracking(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute.set(event.url);
      this.updateUIVisibility(event.url);
    });
  }

  // Dil yönü takibi
  private setupLanguageDirection(): void {
    this.languageService.currentLanguage$.subscribe(languageCode => {
      const languageInfo = this.languageService.getLanguageInfo(languageCode);
      this.isRTL.set(languageInfo?.isRTL || false);
    });
  }

  // UI görünürlüğü ayarla
  private updateUIVisibility(url: string): void {
    const hideHeaderRoutes = ['/language-setup'];
    const hideNavRoutes = ['/language-setup', '/reply'];

    this.showHeader.set(!hideHeaderRoutes.some(route => url.includes(route)));
    this.showBottomNav.set(!hideNavRoutes.some(route => url.includes(route)));
  }

  // Navigation
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  navigateToSettings(): void {
    this.router.navigate(['/settings']);
  }

  // Okunmamış mesaj sayısını güncelle
  updateUnreadCount(): void {
    // Bu method message service'den çağrılacak
    // Şimdilik placeholder
    // this.messageService.getUnreadCount().subscribe(count => {
    //   this.unreadCount.set(count);
    // });
  }

  // Unread count'u string'e çevir (translate pipe için)
  getUnreadCountString(): string {
    return this.unreadCount().toString();
  }

  // Loading durumunu kontrol et
  setLoading(loading: boolean): void {
    this.isLoading.set(loading);
  }

  // Keyboard shortcuts
  onKeyDown(event: KeyboardEvent): void {
    // Alt + 1: Home
    if (event.altKey && event.key === '1') {
      event.preventDefault();
      this.navigateTo('/');
    }

    // Alt + 2: Send
    if (event.altKey && event.key === '2') {
      event.preventDefault();
      this.navigateTo('/send');
    }

    // Alt + 3: Messages
    if (event.altKey && event.key === '3') {
      event.preventDefault();
      this.navigateTo('/messages');
    }
  }
}
