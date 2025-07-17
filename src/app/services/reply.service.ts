// src/app/services/reply.service.ts

import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reply, ReplyRequest, ReplyResponse } from '../models/reply.model';
import { SessionService } from './session.service';
import { MessageService } from './message.service';

@Injectable({
  providedIn: 'root'
})
export class ReplyService {
  private readonly API_URL = 'http://localhost:8080/api';

  // Signals
  isLoading = signal<boolean>(false);
  lastReply = signal<Reply | null>(null);

  constructor(
    private http: HttpClient,
    private sessionService: SessionService,
    private messageService: MessageService
  ) {}

  // Cevap gönder (Tek seferlik)
  sendReply(messageId: number, templateId: number): Observable<ReplyResponse> {
    const token = this.sessionService.getCurrentToken();
    if (!token) {
      throw new Error('Geçerli oturum bulunamadı');
    }

    this.isLoading.set(true);

    const replyRequest: ReplyRequest = {
      messageId: messageId,
      templateId: templateId,
      receiverToken: token
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<ReplyResponse>(`${this.API_URL}/replies`, replyRequest, { headers })
      .pipe(
        tap(response => {
          this.isLoading.set(false);
          if (response.success && response.data) {
            this.lastReply.set(response.data);

            // Message durumunu güncelle
            this.messageService.updateMessageStatus(messageId, true);

            // Session reply count'unu güncelle
            const currentSession = this.sessionService.currentSession();
            if (currentSession) {
              this.sessionService.updateSessionStats(
                undefined,
                currentSession.replyCount + 1
              );
            }
          }
        })
      );
  }

  // Mesajın cevabını kontrol et
  checkReplyStatus(messageId: number): Observable<boolean> {
    const token = this.sessionService.getCurrentToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<boolean>(`${this.API_URL}/replies/status/${messageId}`, { headers });
  }

  // Mesajın cevabını getir
  getReplyByMessageId(messageId: number): Observable<Reply> {
    const token = this.sessionService.getCurrentToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<Reply>(`${this.API_URL}/replies/message/${messageId}`, { headers });
  }

  // Kullanıcının gönderdiği tüm cevapları getir
  getUserReplies(): Observable<Reply[]> {
    const token = this.sessionService.getCurrentToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<Reply[]>(`${this.API_URL}/replies/user`, { headers });
  }

  // Cevap verilip verilemeyeceğini kontrol et
  canReplyToMessage(messageId: number): Observable<boolean> {
    const token = this.sessionService.getCurrentToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<boolean>(`${this.API_URL}/replies/can-reply/${messageId}`, { headers });
  }

  // Son cevabı temizle
  clearLastReply(): void {
    this.lastReply.set(null);
  }

  // Cevap istatistikleri
  getReplyStats(): Observable<{total: number, today: number, thisWeek: number}> {
    const token = this.sessionService.getCurrentToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<{total: number, today: number, thisWeek: number}>(
      `${this.API_URL}/replies/stats`,
      { headers }
    );
  }

  // Cevap zamanını formatla
  formatReplyTime(repliedAt: Date): string {
    const now = new Date();
    const replyDate = new Date(repliedAt);
    const diffInMinutes = Math.floor((now.getTime() - replyDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Şimdi';
    if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} saat önce`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} gün önce`;

    return replyDate.toLocaleDateString('tr-TR');
  }

  // Cevap başarı durumunu kontrol et
  isReplySuccessful(): boolean {
    return this.lastReply() !== null;
  }

  // Loading durumunu manuel kontrol
  setLoading(loading: boolean): void {
    this.isLoading.set(loading);
  }
}
