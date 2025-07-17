// src/app/services/message.service.ts

import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Message, MessageRequest, MessageResponse } from '../models/message.model';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private readonly API_URL = 'http://localhost:8080/api';

  // Reactive state management
  private sentMessagesSubject = new BehaviorSubject<Message[]>([]);
  private receivedMessagesSubject = new BehaviorSubject<Message[]>([]);

  public sentMessages$ = this.sentMessagesSubject.asObservable();
  public receivedMessages$ = this.receivedMessagesSubject.asObservable();

  // Signals
  sentMessages = signal<Message[]>([]);
  receivedMessages = signal<Message[]>([]);
  isLoading = signal<boolean>(false);

  constructor(
    private http: HttpClient,
    private sessionService: SessionService
  ) {}

  // Mesaj gönder (Şişeyi denize at)
  sendMessage(content: string): Observable<MessageResponse> {
    const token = this.sessionService.getCurrentToken();
    if (!token) {
      throw new Error('Geçerli oturum bulunamadı');
    }

    this.isLoading.set(true);

    const messageRequest: MessageRequest = {
      content: content.trim(),
      senderToken: token
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<MessageResponse>(`${this.API_URL}/messages`, messageRequest, { headers })
      .pipe(
        tap(response => {
          this.isLoading.set(false);
          if (response.success && response.data) {
            this.addSentMessage(response.data);
            // Session stats güncelle
            this.sessionService.updateSessionStats(
              this.sessionService.currentSession()!.messageCount + 1
            );
          }
        })
      );
  }

  // Gelen mesajları al
  getReceivedMessages(): Observable<Message[]> {
    const token = this.sessionService.getCurrentToken();
    if (!token) {
      throw new Error('Geçerli oturum bulunamadı');
    }

    this.isLoading.set(true);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<Message[]>(`${this.API_URL}/messages/received`, { headers })
      .pipe(
        tap(messages => {
          this.isLoading.set(false);
          this.receivedMessagesSubject.next(messages);
          this.receivedMessages.set(messages);
        })
      );
  }

  // Belirli mesajı getir
  getMessageById(messageId: number): Observable<Message> {
    const token = this.sessionService.getCurrentToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<Message>(`${this.API_URL}/messages/${messageId}`, { headers });
  }

  // Gönderilen mesajları al
  getSentMessages(): Observable<Message[]> {
    const token = this.sessionService.getCurrentToken();
    if (!token) {
      throw new Error('Geçerli oturum bulunamadı');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<Message[]>(`${this.API_URL}/messages/sent`, { headers })
      .pipe(
        tap(messages => {
          this.sentMessagesSubject.next(messages);
          this.sentMessages.set(messages);
        })
      );
  }

  // Gönderilen mesaj listesine ekle
  private addSentMessage(message: Message): void {
    const currentMessages = this.sentMessages();
    const updatedMessages = [message, ...currentMessages];
    this.sentMessagesSubject.next(updatedMessages);
    this.sentMessages.set(updatedMessages);
  }

  // Mesaj durumunu güncelle
  updateMessageStatus(messageId: number, hasReply: boolean): void {
    // Alınan mesajları güncelle
    const receivedMessages = this.receivedMessages();
    const updatedReceived = receivedMessages.map(msg =>
      msg.id === messageId ? { ...msg, hasReply } : msg
    );
    this.receivedMessages.set(updatedReceived);
    this.receivedMessagesSubject.next(updatedReceived);
  }

  // Tüm mesajları temizle
  clearMessages(): void {
    this.sentMessagesSubject.next([]);
    this.receivedMessagesSubject.next([]);
    this.sentMessages.set([]);
    this.receivedMessages.set([]);
  }

  // Mesaj sayısını al
  getMessageCounts(): { sent: number; received: number } {
    return {
      sent: this.sentMessages().length,
      received: this.receivedMessages().length
    };
  }
}
