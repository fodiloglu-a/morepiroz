// src/app/guards/language.guard.ts

import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { LanguageService } from '../services/language.service';
import { SessionService } from '../services/session.service';

@Injectable({
  providedIn: 'root'
})
export class LanguageGuard implements CanActivate {

  constructor(
    private languageService: LanguageService,
    private sessionService: SessionService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    // Dil yüklü mü kontrol et
    if (this.languageService.translations().hasOwnProperty('app')) {
      return of(true);
    }

    // Session var mı ve dil seçilmiş mi kontrol et
    const session = this.sessionService.currentSession();
    if (!session) {
      // Session yoksa language selection'a yönlendir
      this.router.navigate(['/language-setup']);
      return of(false);
    }

    // Mevcut dil ile çevirileri yükle
    const currentLanguage = this.languageService.getCurrentLanguageCode();

    return this.languageService.setLanguage(currentLanguage).pipe(
      map(translations => {
        // Çeviriler başarıyla yüklendiyse true
        return Object.keys(translations).length > 0;
      }),
      catchError(error => {
        console.error('Language loading error in guard:', error);
        // Hata durumunda default dile fallback
        return this.languageService.setLanguage('ua').pipe(
          map(() => true),
          catchError(() => of(true)) // En son çare olarak geçir
        );
      })
    );
  }
}
