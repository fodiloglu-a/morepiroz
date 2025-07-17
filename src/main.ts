// src/main.ts

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { isDevMode } from '@angular/core';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error('Bootstrap error:', err));

// PWA için service worker kaydı (opsiyonel)
if ('serviceWorker' in navigator && !isDevMode()) {
  navigator.serviceWorker.register('/ngsw-worker.js')
    .then(registration => {
      console.log('SW registered:', registration);
    })
    .catch(error => {
      console.log('SW registration failed:', error);
    });
}
