// src/app/app.config.ts

import {ApplicationConfig, importProvidersFrom, inject} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { CommonModule } from '@angular/common';

import { routes } from './app.routes';
import { LanguageInterceptor } from './interceptors/language.interceptor';
import {LanguageService} from './services/language.service';
import {SessionService} from './services/session.service';
import {MessageService} from './services/message.service';
import {TemplateService} from './services/template.service';
import {ReplyService} from './services/reply.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        // Language interceptor'ı ekle
        (req, next) => {
          // Modern functional interceptor
          const languageService = inject(LanguageService);

          if (req.url.includes('/api/') || req.url.includes('localhost:8080')) {
            const headers = languageService.getLanguageHeader();
            let updatedHeaders = req.headers;

            Object.keys(headers).forEach(key => {
              updatedHeaders = updatedHeaders.set(key, headers[key]);
            });

            const updatedReq = req.clone({ headers: updatedHeaders });
            return next(updatedReq);
          }

          return next(req);
        }
      ])
    ),
    importProvidersFrom(CommonModule),

    // Services
    LanguageService,
    SessionService,
    MessageService,
    TemplateService,
    ReplyService
  ]
};
