// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { LanguageGuard } from './guards/language.guard';

export const routes: Routes = [
  // Language Setup (dil seçimi)
  {
    path: 'language-setup',
    loadComponent: () => import('./components/language-setup/language-setup.component')
      .then(m => m.LanguageSetupComponent)
  },

  // Ana rotalar (dil guard ile korumalı)
  {
    path: '',
    canActivate: [LanguageGuard],
    loadComponent: () => import('./components/home/home.component')
      .then(m => m.HomeComponent)
  },
  {
    path: 'send',
    canActivate: [LanguageGuard],
    loadComponent: () => import('./components/send-message/send-message.component')
      .then(m => m.SendMessageComponent)
  },
  {
    path: 'messages',
    canActivate: [LanguageGuard],
    loadComponent: () => import('./components/received-messages/received-messages.component')
      .then(m => m.ReceivedMessagesComponent)
  },
  {
    path: 'reply/:messageId',
    canActivate: [LanguageGuard],
    loadComponent: () => import('./components/reply-templates/reply-templates.component')
      .then(m => m.ReplyTemplatesComponent)
  },
  {
    path: 'settings',
    canActivate: [LanguageGuard],
    loadComponent: () => import('./components/settings/settings.component')
      .then(m => m.SettingsComponent)
  },

  // Fallback
  {
    path: '**',
    redirectTo: ''
  }
];
