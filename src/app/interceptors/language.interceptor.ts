// src/app/interceptors/language.interceptor.ts

import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpHeaders
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { LanguageService } from '../services/language.service';

@Injectable()
export class LanguageInterceptor implements HttpInterceptor {

  constructor(private languageService: LanguageService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Dil headerlarını sadece API isteklerine ekle
    if (this.isApiRequest(request.url)) {
      const languageHeaders = this.languageService.getLanguageHeader();

      // Yeni headers oluştur
      let headers = request.headers;
      Object.keys(languageHeaders).forEach(key => {
        headers = headers.set(key, languageHeaders[key]);
      });

      // Request'i clone et ve yeni headers ekle
      const languageRequest = request.clone({
        headers: headers
      });

      return next.handle(languageRequest);
    }

    return next.handle(request);
  }

  // API isteği mi kontrol et
  private isApiRequest(url: string): boolean {
    return url.includes('/api/') || url.includes('localhost:8080');
  }
}
