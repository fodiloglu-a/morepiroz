// src/app/services/template.service.ts

import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ReplyTemplate, ReplyTemplateResponse, ReplyCategory } from '../models/reply-template.model';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class TemplateService {
  private readonly API_URL = 'http://localhost:8080/api';

  // Reactive state
  private templatesSubject = new BehaviorSubject<ReplyTemplate[]>([]);
  public templates$ = this.templatesSubject.asObservable();

  // Signals
  templates = signal<ReplyTemplate[]>([]);
  isLoading = signal<boolean>(false);
  selectedCategory = signal<ReplyCategory | null>(null);

  constructor(
    private http: HttpClient,
    private sessionService: SessionService
  ) {}

  // Tüm şablonları getir
  getAllTemplates(language: string = 'ua'): Observable<ReplyTemplateResponse> {
    this.isLoading.set(true);

    const token = this.sessionService.getCurrentToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept-Language': language
    });

    return this.http.get<ReplyTemplateResponse>(`${this.API_URL}/templates`, { headers })
      .pipe(
        tap(response => {
          this.isLoading.set(false);
          if (response.success && response.data) {
            this.templatesSubject.next(response.data);
            this.templates.set(response.data);
          }
        })
      );
  }

  // Kategoriye göre şablonları getir
  getTemplatesByCategory(category: ReplyCategory, language: string = 'ua'): Observable<ReplyTemplate[]> {
    const token = this.sessionService.getCurrentToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept-Language': language
    });

    return this.http.get<ReplyTemplate[]>(`${this.API_URL}/templates/category/${category}`, { headers })
      .pipe(
        tap(templates => {
          this.selectedCategory.set(category);
        })
      );
  }

  // Şablon ID'sine göre getir
  getTemplateById(templateId: number): ReplyTemplate | null {
    const templates = this.templates();
    return templates.find(template => template.id === templateId) || null;
  }

  // Kategorileri grupla
  getTemplatesGroupedByCategory(): Map<ReplyCategory, ReplyTemplate[]> {
    const templates = this.templates();
    const grouped = new Map<ReplyCategory, ReplyTemplate[]>();

    // Tüm kategorileri initialize et
    Object.values(ReplyCategory).forEach(category => {
      grouped.set(category, []);
    });

    // Şablonları kategorilere göre grupla
    templates.forEach(template => {
      const categoryTemplates = grouped.get(template.category) || [];
      categoryTemplates.push(template);
      grouped.set(template.category, categoryTemplates);
    });

    return grouped;
  }

  // Rastgele şablon getir
  getRandomTemplate(category?: ReplyCategory): ReplyTemplate | null {
    let availableTemplates = this.templates();

    if (category) {
      availableTemplates = availableTemplates.filter(t => t.category === category);
    }

    if (availableTemplates.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * availableTemplates.length);
    return availableTemplates[randomIndex];
  }

  // Popüler şablonları getir (API'den)
  getPopularTemplates(limit: number = 10): Observable<ReplyTemplate[]> {
    const token = this.sessionService.getCurrentToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<ReplyTemplate[]>(`${this.API_URL}/templates/popular?limit=${limit}`, { headers });
  }

  // Kategori adını çevir
  getCategoryDisplayName(category: ReplyCategory): string {
    const categoryNames: Record<ReplyCategory, string> = {
      [ReplyCategory.SUPPORT]: '🤗 Destek',
      [ReplyCategory.EMPATHY]: '💙 Empati',
      [ReplyCategory.ENCOURAGEMENT]: '✨ Cesaret',
      [ReplyCategory.MOTIVATION]: '💪 Motivasyon',
      [ReplyCategory.UNDERSTANDING]: '🫂 Anlayış'
    };

    return categoryNames[category] || category;
  }

  // Kategori rengini al
  getCategoryColor(category: ReplyCategory): string {
    const categoryColors: Record<ReplyCategory, string> = {
      [ReplyCategory.SUPPORT]: '#4CAF50',
      [ReplyCategory.EMPATHY]: '#2196F3',
      [ReplyCategory.ENCOURAGEMENT]: '#FF9800',
      [ReplyCategory.MOTIVATION]: '#E91E63',
      [ReplyCategory.UNDERSTANDING]: '#9C27B0'
    };

    return categoryColors[category] || '#757575';
  }

  // Şablonları temizle
  clearTemplates(): void {
    this.templatesSubject.next([]);
    this.templates.set([]);
    this.selectedCategory.set(null);
  }

  // Cache'i yenile
  refreshTemplates(language: string = 'ua'): Observable<ReplyTemplateResponse> {
    this.clearTemplates();
    return this.getAllTemplates(language);
  }
}
