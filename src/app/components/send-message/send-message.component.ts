// src/app/components/send-message/send-message.component.ts

import { Component, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { TranslatePipe } from '../../pipes/translate.pipe';
import { LanguageService } from '../../services/language.service';
import { SessionService } from '../../services/session.service';
import { MessageService } from '../../services/message.service';

@Component({
  selector: 'app-send-message',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './send-message.component.html',
  styleUrl: './send-message.component.css'
})
export class SendMessageComponent implements OnInit {
  @ViewChild('messageTextarea') messageTextarea!: ElementRef<HTMLTextAreaElement>;

  // Signals
  messageContent = signal<string>('');
  isLoading = signal<boolean>(false);
  isSending = signal<boolean>(false);
  characterCount = signal<number>(0);
  showSuccess = signal<boolean>(false);
  validationError = signal<string>('');

  // Constants
  readonly MAX_LENGTH = 500;
  readonly MIN_LENGTH = 10;

  constructor(
    private router: Router,
    private languageService: LanguageService,
    private sessionService: SessionService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.checkSession();
    this.focusTextarea();
  }

  // Session kontrolü
  private checkSession(): void {
    if (!this.sessionService.hasValidSession()) {
      this.router.navigate(['/language-setup']);
    }
  }

  // Textarea'ya odaklan
  private focusTextarea(): void {
    setTimeout(() => {
      if (this.messageTextarea) {
        this.messageTextarea.nativeElement.focus();
      }
    }, 300);
  }

  // Mesaj içeriği değiştiğinde
  onMessageChange(content: string): void {
    this.messageContent.set(content);
    this.characterCount.set(content.length);
    this.validateMessage();
    this.autoResize();
  }

  // Mesaj validasyonu
  private validateMessage(): void {
    const content = this.messageContent().trim();

    if (content.length === 0) {
      this.validationError.set('');
      return;
    }

    if (content.length < this.MIN_LENGTH) {
      this.validationError.set(
        this.languageService.translate('message.send.tooShort', {
          min: this.MIN_LENGTH.toString()
        })
      );
      return;
    }

    if (content.length > this.MAX_LENGTH) {
      this.validationError.set(
        this.languageService.translate('message.send.tooLong', {
          max: this.MAX_LENGTH.toString()
        })
      );
      return;
    }

    this.validationError.set('');
  }

  // Textarea auto-resize
  private autoResize(): void {
    if (this.messageTextarea) {
      const textarea = this.messageTextarea.nativeElement;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }

  // Mesaj gönder
  sendMessage(): void {
    const content = this.messageContent().trim();

    if (!this.canSendMessage()) {
      return;
    }

    this.isSending.set(true);

    // Development mode için mock implementation
    if (this.isDevelopmentMode()) {
      this.sendMockMessage(content);
    } else {
      this.sendRealMessage(content);
    }
  }

  // Gerçek mesaj gönderme
  private sendRealMessage(content: string): void {
    this.messageService.sendMessage(content).subscribe({
      next: (response) => {
        if (response.success) {
          this.onSendSuccess();
        } else {
          this.onSendError(response.message || 'Unknown error');
        }
      },
      error: (error) => {
        console.error('Send message error:', error);
        // Fallback to mock
        this.sendMockMessage(content);
      }
    });
  }

  // Mock mesaj gönderme (development için)
  private sendMockMessage(content: string): void {
    console.log('🚀 Development mode: Sending mock message');

    setTimeout(() => {
      // Mock success response
      this.onSendSuccess();

      // Session stats güncelle
      const currentSession = this.sessionService.currentSession();
      if (currentSession) {
        this.sessionService.updateSessionStats(
          currentSession.messageCount + 1,
          currentSession.replyCount
        );
      }
    }, 1500); // Realistic delay
  }

  // Gönderme başarılı
  private onSendSuccess(): void {
    this.isSending.set(false);
    this.showSuccess.set(true);
    this.messageContent.set('');
    this.characterCount.set(0);
    this.validationError.set('');

    // 3 saniye sonra ana sayfaya yönlendir
    setTimeout(() => {
      this.router.navigate(['/']);
    }, 3000);
  }

  // Gönderme hatası
  private onSendError(error: string): void {
    this.isSending.set(false);
    this.validationError.set(error);
  }

  // Gönderebilir mi kontrol
  canSendMessage(): boolean {
    const content = this.messageContent().trim();
    return content.length >= this.MIN_LENGTH &&
      content.length <= this.MAX_LENGTH &&
      !this.isSending() &&
      !this.validationError();
  }

  // Progress bar yüzdesi
  getProgressPercentage(): number {
    return Math.min((this.characterCount() / this.MAX_LENGTH) * 100, 100);
  }

  // Progress bar rengi
  getProgressColor(): string {
    const percentage = this.getProgressPercentage();
    if (percentage < 70) return '#4caf50'; // Yeşil
    if (percentage < 90) return '#ff9800'; // Turuncu
    return '#f44336'; // Kırmızı
  }

  // Character count rengi
  getCharacterCountColor(): string {
    if (this.characterCount() < this.MIN_LENGTH) return '#9e9e9e';
    if (this.characterCount() > this.MAX_LENGTH) return '#f44336';
    return '#4caf50';
  }

  // Development mode kontrolü
  private isDevelopmentMode(): boolean {
    return !navigator.onLine || window.location.hostname === 'localhost';
  }

  // Ana sayfaya dön
  goHome(): void {
    this.router.navigate(['/']);
  }

  // Temizle
  clearMessage(): void {
    this.messageContent.set('');
    this.characterCount.set(0);
    this.validationError.set('');
    this.focusTextarea();
  }

  // Klavye kısayolları
  onKeyDown(event: KeyboardEvent): void {
    // Ctrl/Cmd + Enter: Gönder
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      if (this.canSendMessage()) {
        this.sendMessage();
      }
    }

    // Escape: Temizle
    if (event.key === 'Escape') {
      event.preventDefault();
      this.clearMessage();
    }
  }

  // Mesaj önerileri
  getSuggestedMessages(): string[] {
    return [
      this.languageService.translate('message.suggestions.feeling'),
      this.languageService.translate('message.suggestions.support'),
      this.languageService.translate('message.suggestions.grateful'),
      this.languageService.translate('message.suggestions.confused'),
      this.languageService.translate('message.suggestions.excited')
    ];
  }

  // Öneri seç
  selectSuggestion(suggestion: string): void {
    this.messageContent.set(suggestion);
    this.characterCount.set(suggestion.length);
    this.validateMessage();
    this.focusTextarea();
  }
}
