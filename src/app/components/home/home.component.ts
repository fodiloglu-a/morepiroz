// src/app/components/home/home.component.ts

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { TranslatePipe } from '../../pipes/translate.pipe';
import { LanguageService } from '../../services/language.service';
import { SessionService } from '../../services/session.service';
import { MessageService } from '../../services/message.service';
import { UserSession } from '../../models/user-session.model';
import { Message } from '../../models/message.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  // Signals
  currentSession = signal<UserSession | null>(null);
  messageCount = signal<number>(0);
  receivedCount = signal<number>(0);
  replyCount = signal<number>(0);
  isLoading = signal<boolean>(false);
  recentMessages = signal<Message[]>([]);
  welcomeMessage = signal<string>('');

  constructor(
    private router: Router,
    private languageService: LanguageService,
    private sessionService: SessionService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadUserSession();
    this.loadRecentMessages();
    this.setWelcomeMessage();
  }

  // Kullanıcı oturumunu yükle
  private loadUserSession(): void {
    this.sessionService.currentSession$.subscribe(session => {
      this.currentSession.set(session);
      if (session) {
        this.messageCount.set(session.messageCount);
        this.replyCount.set(session.replyCount);
      }
    });
  }

  // Son mesajları yükle
  private loadRecentMessages(): void {
    if (!this.sessionService.hasValidSession()) return;

    this.isLoading.set(true);
    this.messageService.getReceivedMessages().subscribe({
      next: (messages) => {
        this.recentMessages.set(messages.slice(0, 3)); // Son 3 mesaj
        this.receivedCount.set(messages.length);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.isLoading.set(false);
      }
    });
  }

  // Karşılama mesajını ayarla
  private setWelcomeMessage(): void {
    const hour = new Date().getHours();
    let timeKey = 'home.welcome.day';

    if (hour < 12) {
      timeKey = 'home.welcome.morning';
    } else if (hour < 18) {
      timeKey = 'home.welcome.afternoon';
    } else {
      timeKey = 'home.welcome.evening';
    }

    // Çeviri servisi reactive olduğu için signal'a direkt atayabiliriz
    this.welcomeMessage.set(this.languageService.translate(timeKey));
  }

  // Navigation metodları
  navigateToSend(): void {
    this.router.navigate(['/send']);
  }

  navigateToMessages(): void {
    this.router.navigate(['/messages']);
  }

  navigateToReply(messageId: number): void {
    this.router.navigate(['/reply', messageId]);
  }

  // Mesaj önizlemesi
  getMessagePreview(content: string): string {
    return content.length > 60 ? content.substring(0, 60) + '...' : content;
  }

  // Zaman formatı
  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return this.languageService.translate('time.now');
    if (diffInMinutes < 60) return this.languageService.translate('time.minutesAgo', { count: diffInMinutes.toString() });

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return this.languageService.translate('time.hoursAgo', { count: diffInHours.toString() });

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return this.languageService.translate('time.daysAgo', { count: diffInDays.toString() });

    return new Date(date).toLocaleDateString();
  }

  // Yenile
  refresh(): void {
    this.loadRecentMessages();
    this.loadUserSession();
  }

  // İstatistikleri göster
  hasStats(): boolean {
    return this.messageCount() > 0 || this.receivedCount() > 0 || this.replyCount() > 0;
  }

  // Hoş geldin mesajını güncelle (dil değişiminde)
  updateWelcomeMessage(): void {
    this.setWelcomeMessage();
  }
}
