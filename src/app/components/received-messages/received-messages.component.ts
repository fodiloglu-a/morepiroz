// src/app/components/received-messages/received-messages.component.ts

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { TranslatePipe } from '../../pipes/translate.pipe';
import { LanguageService } from '../../services/language.service';
import { SessionService } from '../../services/session.service';
import { MessageService } from '../../services/message.service';
import { Message, MessageStatus } from '../../models/message.model';

@Component({
  selector: 'app-received-messages',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './received-messages.component.html',
  styleUrl: './received-messages.component.css'
})
export class ReceivedMessagesComponent implements OnInit {
  // Signals
  messages = signal<Message[]>([]);
  filteredMessages = signal<Message[]>([]);
  isLoading = signal<boolean>(false);
  selectedFilter = signal<'all' | 'unread' | 'replied'>('all');
  searchQuery = signal<string>('');
  totalCount = signal<number>(0);
  unreadCount = signal<number>(0);
  repliedCount = signal<number>(0);

  constructor(
    private router: Router,
    private languageService: LanguageService,
    private sessionService: SessionService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.checkSession();
    this.loadMessages();
    this.setupMessageSubscription();
  }

  // Session kontrolü
  private checkSession(): void {
    if (!this.sessionService.hasValidSession()) {
      this.router.navigate(['/language-setup']);
    }
  }

  // Mesajları yükle
  loadMessages(): void {
    this.isLoading.set(true);

    // Development mode için mock mesajlar
    if (this.isDevelopmentMode()) {
      this.loadMockMessages();
    } else {
      this.loadRealMessages();
    }
  }

  // Gerçek mesajları yükle
  private loadRealMessages(): void {
    this.messageService.getReceivedMessages().subscribe({
      next: (messages) => {
        this.processMessages(messages);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        // Fallback to mock
        this.loadMockMessages();
      }
    });
  }

  // Mock mesajları yükle
  private loadMockMessages(): void {
    console.log('🚀 Development mode: Loading mock messages');

    const mockMessages: Message[] = [
      {
        id: 1,
        content: "Bugün kendimi çok yalnız hissediyorum. Sanki kimse beni anlamıyor ve hayatta bir yere ait değilim gibi geliyor. Bu duygularla nasıl başa çıkacağımı bilmiyorum...",
        senderToken: 'mock_sender_1',
        receiverToken: this.sessionService.getCurrentToken()!,
        sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 saat önce
        status: MessageStatus.DELIVERED,
        hasReply: false
      },
      {
        id: 2,
        content: "İş yerinde çok stres yaşıyorum. Patronum sürekli baskı yapıyor ve işimi kaybetme korkusu var. Gece uyuyamıyorum, sürekli endişeliyim. Ne yapacağımı bilmiyorum.",
        senderToken: 'mock_sender_2',
        receiverToken: this.sessionService.getCurrentToken()!,
        sentAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 saat önce
        status: MessageStatus.DELIVERED,
        hasReply: true
      },
      {
        id: 3,
        content: "Ailemle sorunlar yaşıyorum. Onlar beni anlamıyor ve sürekli eleştiriyorlar. Kendi hayatımı yaşamak istiyorum ama onları da üzmek istemiyorum.",
        senderToken: 'mock_sender_3',
        receiverToken: this.sessionService.getCurrentToken()!,
        sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 gün önce
        status: MessageStatus.DELIVERED,
        hasReply: false
      },
      {
        id: 4,
        content: "Sevdiğim biriyle ilişkim bitti. Çok acı çekiyorum ve onun gitmesiyle başa çıkamıyorum. Hayat anlamsız gelmeye başladı.",
        senderToken: 'mock_sender_4',
        receiverToken: this.sessionService.getCurrentToken()!,
        sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 gün önce
        status: MessageStatus.DELIVERED,
        hasReply: true
      }
    ];

    setTimeout(() => {
      this.processMessages(mockMessages);
      this.isLoading.set(false);
    }, 1000);
  }

  // Mesajları işle ve istatistikleri hesapla
  private processMessages(messages: Message[]): void {
    this.messages.set(messages);
    this.totalCount.set(messages.length);
    this.unreadCount.set(messages.filter(m => !m.hasReply).length);
    this.repliedCount.set(messages.filter(m => m.hasReply).length);

    this.applyFilters();
  }

  // Message service subscription
  private setupMessageSubscription(): void {
    this.messageService.receivedMessages$.subscribe(messages => {
      if (messages.length > 0) {
        this.processMessages(messages);
      }
    });
  }

  // Filter uygula
  applyFilters(): void {
    let filtered = this.messages();

    // Filter'a göre filtrele
    switch (this.selectedFilter()) {
      case 'unread':
        filtered = filtered.filter(m => !m.hasReply);
        break;
      case 'replied':
        filtered = filtered.filter(m => m.hasReply);
        break;
      // 'all' için filtreleme yok
    }

    // Arama sorgusuna göre filtrele
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      filtered = filtered.filter(m =>
        m.content.toLowerCase().includes(query)
      );
    }

    // Tarihe göre sırala (en yeni önce)
    filtered.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

    this.filteredMessages.set(filtered);
  }

  // Filter değiştir
  setFilter(filter: 'all' | 'unread' | 'replied'): void {
    this.selectedFilter.set(filter);
    this.applyFilters();
  }

  // Arama
  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.applyFilters();
  }

  // Mesaja yanıt ver
  replyToMessage(message: Message): void {
    if (message.hasReply) {
      return; // Zaten yanıtlanmış
    }
    this.router.navigate(['/reply', message.id]);
  }

  // Mesaj önizlemesi
  getMessagePreview(content: string, maxLength: number = 100): string {
    return content.length > maxLength
      ? content.substring(0, maxLength) + '...'
      : content;
  }

  // Zaman formatı
  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return this.languageService.translate('time.now');
    if (diffInMinutes < 60) {
      return this.languageService.translate('time.minutesAgo', {
        count: diffInMinutes.toString()
      });
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return this.languageService.translate('time.hoursAgo', {
        count: diffInHours.toString()
      });
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return this.languageService.translate('time.daysAgo', {
        count: diffInDays.toString()
      });
    }

    return new Date(date).toLocaleDateString();
  }

  // Mesaj durumu ikonu
  getStatusIcon(message: Message): string {
    return message.hasReply ? '✅' : '📬';
  }

  // Mesaj durumu metni
  getStatusText(message: Message): string {
    return message.hasReply
      ? this.languageService.translate('reply.alreadyReplied')
      : this.languageService.translate('message.received.canReply');
  }

  // Mesaj durumu rengi
  getStatusColor(message: Message): string {
    return message.hasReply ? '#4caf50' : '#2196f3';
  }

  // Yenile
  refresh(): void {
    this.loadMessages();
  }

  // Ana sayfaya dön
  goHome(): void {
    this.router.navigate(['/']);
  }

  // Development mode kontrolü
  private isDevelopmentMode(): boolean {
    return !navigator.onLine || window.location.hostname === 'localhost';
  }

  // Filter badge sayısı
  getFilterBadgeCount(filter: 'all' | 'unread' | 'replied'): number {
    switch (filter) {
      case 'all': return this.totalCount();
      case 'unread': return this.unreadCount();
      case 'replied': return this.repliedCount();
      default: return 0;
    }
  }

  // Boş durum kontrolü
  hasMessages(): boolean {
    return this.messages().length > 0;
  }

  // Filtrelenmiş sonuç var mı?
  hasFilteredResults(): boolean {
    return this.filteredMessages().length > 0;
  }

  // Arama yapılıyor mu?
  isSearching(): boolean {
    return this.searchQuery().trim().length > 0;
  }

  // TrackBy function for performance
  trackByMessageId(index: number, message: Message): number {
    return message.id;
  }
}
