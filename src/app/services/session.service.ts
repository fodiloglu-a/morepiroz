// src/app/services/session.service.ts

import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UserSession, SessionRequest, SessionResponse } from '../models/user-session.model';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly API_URL = 'http://localhost:8080/api';
  private readonly SESSION_KEY = 'morepiroz_session';

  // Signals for reactive state
  private currentSessionSubject = new BehaviorSubject<UserSession | null>(null);
  public currentSession$ = this.currentSessionSubject.asObservable();

  // Signal for current session
  currentSession = signal<UserSession | null>(null);

  constructor(private http: HttpClient) {
    this.loadSessionFromStorage();
  }

  // Anonim oturum oluştur (dil ile)
  createSession(language: string = 'ua'): Observable<SessionResponse> {
    const sessionRequest: SessionRequest = {
      deviceId: this.generateDeviceId(),
      language: language
    };

    return this.http.post<SessionResponse>(`${this.API_URL}/session`, sessionRequest)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.saveSession(response.data);
            // Session oluşturulduğunda dil bilgisini kaydet
            localStorage.setItem('morepiroz_language', language);
          }
        })
      );
  }

  // Oturum ile birlikte dil oluştur
  createSessionWithLanguage(selectedLanguage: string): Observable<SessionResponse> {
    return this.createSession(selectedLanguage);
  }

  // Oturumu kaydet
  private saveSession(session: UserSession): void {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    this.currentSessionSubject.next(session);
    this.currentSession.set(session);
  }

  // Oturumu yükle
  private loadSessionFromStorage(): void {
    const sessionData = localStorage.getItem(this.SESSION_KEY);
    if (sessionData) {
      try {
        const session: UserSession = JSON.parse(sessionData);
        if (this.isSessionValid(session)) {
          this.currentSessionSubject.next(session);
          this.currentSession.set(session);
        } else {
          this.clearSession();
        }
      } catch (error) {
        console.error('Session loading error:', error);
        this.clearSession();
      }
    }
  }

  // Oturum geçerli mi?
  private isSessionValid(session: UserSession): boolean {
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    return session.isActive && expiresAt > now;
  }

  // Oturumu temizle
  clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
    this.currentSessionSubject.next(null);
    this.currentSession.set(null);
  }

  // Mevcut token'ı al
  getCurrentToken(): string | null {
    const session = this.currentSession();
    return session?.token || null;
  }

  // Oturum var mı?
  hasValidSession(): boolean {
    const session = this.currentSession();
    return session ? this.isSessionValid(session) : false;
  }

  // Cihaz ID'si oluştur
  private generateDeviceId(): string {
    return 'device_' + Math.random().toString(36).substr(2, 16) + '_' + Date.now();
  }

  // Oturum istatistiklerini güncelle
  updateSessionStats(messageCount?: number, replyCount?: number): void {
    const currentSession = this.currentSession();
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        messageCount: messageCount ?? currentSession.messageCount,
        replyCount: replyCount ?? currentSession.replyCount
      };
      this.saveSession(updatedSession);
    }
  }
}
