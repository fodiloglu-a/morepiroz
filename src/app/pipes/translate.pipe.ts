// src/app/pipes/translate.pipe.ts

import { Pipe, PipeTransform, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { LanguageService } from '../services/language.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // Reactive olması için pure: false
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private lastKey: string = '';
  private lastParams: any = {};
  private lastValue: string = '';
  private subscription?: Subscription;

  constructor(private languageService: LanguageService) {}

  transform(key: string, params?: { [key: string]: string }): string {
    if (!key) return '';

    // Cache kontrolü
    if (key === this.lastKey && JSON.stringify(params) === JSON.stringify(this.lastParams)) {
      return this.lastValue;
    }

    // Yeni değerleri cache'le
    this.lastKey = key;
    this.lastParams = params || {};

    // Çeviriyi al
    this.lastValue = this.languageService.translate(key, params);

    return this.lastValue;
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
