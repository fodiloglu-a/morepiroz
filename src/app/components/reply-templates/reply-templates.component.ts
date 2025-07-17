// src/app/components/reply-templates/reply-templates.component.ts

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslatePipe } from '../../pipes/translate.pipe';
import { LanguageService } from '../../services/language.service';
import { SessionService } from '../../services/session.service';
import { MessageService } from '../../services/message.service';
import { TemplateService } from '../../services/template.service';
import { ReplyService } from '../../services/reply.service';
import { Message } from '../../models/message.model';
import { ReplyTemplate, ReplyCategory } from '../../models/reply-template.model';

@Component({
  selector: 'app-reply-templates',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './reply-templates.component.html',
  styleUrl: './reply-templates.component.css'
})
export class ReplyTemplatesComponent implements OnInit {
  // Signals
  messageId = signal<number>(0);
  currentMessage = signal<Message | null>(null);
  templates = signal<ReplyTemplate[]>([]);
  selectedCategory = signal<ReplyCategory | null>(null);
  selectedTemplate = signal<ReplyTemplate | null>(null);
  isLoading = signal<boolean>(false);
  isSending = signal<boolean>(false);
  showSuccess = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Categories
  readonly categories = Object.values(ReplyCategory);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private languageService: LanguageService,
    private sessionService: SessionService,
    private messageService: MessageService,
    private templateService: TemplateService,
    private replyService: ReplyService
  ) {}

  ngOnInit(): void {
    this.checkSession();
    this.getMessageId();
    this.loadMessage();
    this.loadTemplates();
  }

  // Session kontrolü
  private checkSession(): void {
    if (!this.sessionService.hasValidSession()) {
      this.router.navigate(['/language-setup']);
    }
  }

  // URL'den message ID'yi al
  private getMessageId(): void {
    this.route.params.subscribe(params => {
      const id = +params['messageId'];
      if (id) {
        this.messageId.set(id);
      } else {
        this.router.navigate(['/messages']);
      }
    });
  }

  // Mesajı yükle
  private loadMessage(): void {
    const id = this.messageId();
    if (!id) return;

    // Development mode için mock mesaj
    if (this.isDevelopmentMode()) {
      this.loadMockMessage(id);
    } else {
      this.loadRealMessage(id);
    }
  }

  // Gerçek mesajı yükle
  private loadRealMessage(id: number): void {
    this.messageService.getMessageById(id).subscribe({
      next: (message) => {
        if (message.hasReply) {
          this.router.navigate(['/messages']);
          return;
        }
        this.currentMessage.set(message);
      },
      error: (error) => {
        console.error('Error loading message:', error);
        this.loadMockMessage(id);
      }
    });
  }

  // Mock mesajı yükle
  private loadMockMessage(id: number): void {
    console.log('🚀 Development mode: Loading mock message');

    const mockMessages = [
      {
        id: 1,
        content: "Bugün kendimi çok yalnız hissediyorum. Sanki kimse beni anlamıyor ve hayatta bir yere ait değilim gibi geliyor. Bu duygularla nasıl başa çıkacağımı bilmiyorum...",
        senderToken: 'mock_sender_1',
        receiverToken: this.sessionService.getCurrentToken()!,
        sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: 'DELIVERED' as any,
        hasReply: false
      },
      {
        id: 2,
        content: "İş yerinde çok stres yaşıyorum. Patronum sürekli baskı yapıyor ve işimi kaybetme korkusu var. Gece uyuyamıyorum, sürekli endişeliyim.",
        senderToken: 'mock_sender_2',
        receiverToken: this.sessionService.getCurrentToken()!,
        sentAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        status: 'DELIVERED' as any,
        hasReply: false
      }
    ];

    const message = mockMessages.find(m => m.id === id);
    if (message) {
      this.currentMessage.set(message as Message);
    } else {
      this.router.navigate(['/messages']);
    }
  }

  // Şablonları yükle
  private loadTemplates(): void {
    // Development mode için mock templates
    if (this.isDevelopmentMode()) {
      this.loadMockTemplates();
    } else {
      this.loadRealTemplates();
    }
  }

  // Gerçek şablonları yükle
  private loadRealTemplates(): void {
    this.isLoading.set(true);

    this.templateService.getAllTemplates().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.templates.set(response.data);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading templates:', error);
        this.loadMockTemplates();
      }
    });
  }

  // Mock şablonları yükle
  private loadMockTemplates(): void {
    console.log('🚀 Development mode: Loading mock templates');

    const mockTemplates: ReplyTemplate[] = [
      // SUPPORT
      { id: 1, category: ReplyCategory.SUPPORT, text: "Anlıyorum, yalnız değilsin ❤️", emoji: "❤️", language: "tr" },
      { id: 2, category: ReplyCategory.SUPPORT, text: "Dayan, her şey yoluna girecek 🤗", emoji: "🤗", language: "tr" },
      { id: 3, category: ReplyCategory.SUPPORT, text: "Paylaştığın için teşekkürler 💙", emoji: "💙", language: "tr" },

      // EMPATHY
      { id: 4, category: ReplyCategory.EMPATHY, text: "Ben de aynısını hissettim 😊", emoji: "😊", language: "tr" },
      { id: 5, category: ReplyCategory.EMPATHY, text: "Bu çok zor olmalı 💙", emoji: "💙", language: "tr" },
      { id: 6, category: ReplyCategory.EMPATHY, text: "Hislerin geçerli ✨", emoji: "✨", language: "tr" },

      // ENCOURAGEMENT
      { id: 7, category: ReplyCategory.ENCOURAGEMENT, text: "Düşündüğünden daha güçlüsün 💪", emoji: "💪", language: "tr" },
      { id: 8, category: ReplyCategory.ENCOURAGEMENT, text: "Yarın yeni bir gün 🌅", emoji: "🌅", language: "tr" },
      { id: 9, category: ReplyCategory.ENCOURAGEMENT, text: "Başarabilirsin 🌟", emoji: "🌟", language: "tr" },

      // MOTIVATION
      { id: 10, category: ReplyCategory.MOTIVATION, text: "Adım adım 🚶‍♀️", emoji: "🚶‍♀️", language: "tr" },
      { id: 11, category: ReplyCategory.MOTIVATION, text: "Doğru yoldasın ✨", emoji: "✨", language: "tr" },
      { id: 12, category: ReplyCategory.MOTIVATION, text: "İlerlemeye devam et 🌈", emoji: "🌈", language: "tr" },

      // UNDERSTANDING
      { id: 13, category: ReplyCategory.UNDERSTANDING, text: "Kendine karşı nazik ol 🌸", emoji: "🌸", language: "tr" },
      { id: 14, category: ReplyCategory.UNDERSTANDING, text: "Bu normal 💚", emoji: "💚", language: "tr" },
      { id: 15, category: ReplyCategory.UNDERSTANDING, text: "Hissetmene izin ver 🤲", emoji: "🤲", language: "tr" }
    ];

    setTimeout(() => {
      this.templates.set(mockTemplates);
      this.isLoading.set(false);
    }, 800);
  }

  // Kategori seç
  selectCategory(category: ReplyCategory): void {
    this.selectedCategory.set(category);
    this.selectedTemplate.set(null);
  }

  // Şablon seç
  selectTemplate(template: ReplyTemplate): void {
    this.selectedTemplate.set(template);
  }

  // Kategoriye göre şablonları filtrele
  getTemplatesByCategory(category: ReplyCategory): ReplyTemplate[] {
    return this.templates().filter(t => t.category === category);
  }

  // Kategori adını çevir
  getCategoryDisplayName(category: ReplyCategory): string {
    return this.languageService.translate(`reply.categories.${category}`);
  }

  // Kategori rengini al
  getCategoryColor(category: ReplyCategory): string {
    const colors = {
      [ReplyCategory.SUPPORT]: '#4CAF50',
      [ReplyCategory.EMPATHY]: '#2196F3',
      [ReplyCategory.ENCOURAGEMENT]: '#FF9800',
      [ReplyCategory.MOTIVATION]: '#E91E63',
      [ReplyCategory.UNDERSTANDING]: '#9C27B0'
    };
    return colors[category] || '#757575';
  }

  // Kategori ikonu al
  getCategoryIcon(category: ReplyCategory): string {
    const icons = {
      [ReplyCategory.SUPPORT]: '🤗',
      [ReplyCategory.EMPATHY]: '💙',
      [ReplyCategory.ENCOURAGEMENT]: '✨',
      [ReplyCategory.MOTIVATION]: '💪',
      [ReplyCategory.UNDERSTANDING]: '🫂'
    };
    return icons[category] || '💌';
  }

  // Cevap gönder
  sendReply(): void {
    const template = this.selectedTemplate();
    const messageId = this.messageId();

    if (!template || !messageId) return;

    this.isSending.set(true);
    this.errorMessage.set('');

    // Development mode için mock reply
    if (this.isDevelopmentMode()) {
      this.sendMockReply(messageId, template.id);
    } else {
      this.sendRealReply(messageId, template.id);
    }
  }

  // Gerçek cevap gönder
  private sendRealReply(messageId: number, templateId: number): void {
    this.replyService.sendReply(messageId, templateId).subscribe({
      next: (response) => {
        if (response.success) {
          this.onReplySuccess();
        } else {
          this.onReplyError(response.message || 'Unknown error');
        }
      },
      error: (error) => {
        console.error('Reply error:', error);
        this.sendMockReply(messageId, templateId);
      }
    });
  }

  // Mock cevap gönder
  private sendMockReply(messageId: number, templateId: number): void {
    console.log('🚀 Development mode: Sending mock reply');

    setTimeout(() => {
      this.onReplySuccess();

      // Session stats güncelle
      const currentSession = this.sessionService.currentSession();
      if (currentSession) {
        this.sessionService.updateSessionStats(
          currentSession.messageCount,
          currentSession.replyCount + 1
        );
      }
    }, 1500);
  }

  // Cevap başarılı
  private onReplySuccess(): void {
    this.isSending.set(false);
    this.showSuccess.set(true);

    // 3 saniye sonra mesajlar sayfasına dön
    setTimeout(() => {
      this.router.navigate(['/messages']);
    }, 3000);
  }

  // Cevap hatası
  private onReplyError(error: string): void {
    this.isSending.set(false);
    this.errorMessage.set(error);
  }

  // Gönderebilir mi?
  canSendReply(): boolean {
    return !!this.selectedTemplate() && !this.isSending();
  }

  // Geri git
  goBack(): void {
    this.router.navigate(['/messages']);
  }

  // Ana sayfaya git
  goHome(): void {
    this.router.navigate(['/']);
  }

  // Development mode kontrolü
  private isDevelopmentMode(): boolean {
    return !navigator.onLine || window.location.hostname === 'localhost';
  }

  // Mesaj önizlemesi
  getMessagePreview(): string {
    const content = this.currentMessage()?.content || '';
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  }

  // Kategori seçili mi?
  isCategorySelected(category: ReplyCategory): boolean {
    return this.selectedCategory() === category;
  }

  // Şablon seçili mi?
  isTemplateSelected(template: ReplyTemplate): boolean {
    return this.selectedTemplate()?.id === template.id;
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
}
