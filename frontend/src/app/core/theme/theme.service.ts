import { Injectable, signal, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly STORAGE_KEY = 'kiva-theme-preference';
  private readonly MEDIA_QUERY = '(prefers-color-scheme: dark)';

  readonly currentTheme = signal<ThemeMode>(this.loadInitialTheme());
  readonly effectiveTheme = signal<'light' | 'dark'>('dark');

  constructor() {
    effect(() => {
      const theme = this.currentTheme();
      this.applyTheme(theme);
      this.persistTheme(theme);
    });
  }

  private loadInitialTheme(): ThemeMode {
    try {
      const stored = this.document.defaultView?.localStorage.getItem(this.STORAGE_KEY);
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        return stored as ThemeMode;
      }
    } catch {
      // localStorage not available
    }
    return 'system';
  }

  private persistTheme(theme: ThemeMode): void {
    try {
      this.document.defaultView?.localStorage.setItem(this.STORAGE_KEY, theme);
    } catch {
      // localStorage not available
    }
  }

  private applyTheme(theme: ThemeMode): void {
    const root = this.document.documentElement;
    const prefersDark = this.document.defaultView?.matchMedia(this.MEDIA_QUERY).matches ?? true;
    const effective = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;

    this.effectiveTheme.set(effective);
    root.setAttribute('data-theme', effective);
    root.classList.remove('light', 'dark');
    root.classList.add(effective);
  }

  setTheme(theme: ThemeMode): void {
    this.currentTheme.set(theme);
  }

  toggleTheme(): void {
    const current = this.currentTheme();
    const next: ThemeMode = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
    this.setTheme(next);
  }

  initialize(): void {
    if (this.currentTheme() === 'system') {
      const mediaQuery = this.document.defaultView?.matchMedia(this.MEDIA_QUERY);
      mediaQuery?.addEventListener?.('change', () => {
        this.applyTheme('system');
      });
    }
  }
}