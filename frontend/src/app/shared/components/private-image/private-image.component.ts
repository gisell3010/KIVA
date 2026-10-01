import {
  Component,
  input,
  signal,
  computed,
  effect,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-private-image',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (loading()) {
      <div class="image-placeholder loading" [style.width]="width()" [style.height]="height()">
        <div class="spinner"></div>
      </div>
    } @else if (error()) {
      <div class="image-placeholder error" [style.width]="width()" [style.height]="height()">
        <svg class="ui-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="1.5"/>
          <path d="M7 11l5 5 7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    } @else if (imageUrl()) {
      <img
        [src]="imageUrl()"
        [alt]="alt()"
        [style.width]="width()"
        [style.height]="height()"
        [style.object-fit]="objectFit()"
        [style.border-radius]="borderRadius()"
        class="private-image"
        (error)="onError()"
      />
    } @else {
      <div class="image-placeholder empty" [style.width]="width()" [style.height]="height()">
        <svg class="ui-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="1.5"/>
          <path d="M7 11l5 5 7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    }
  `,
  styles: [`
    .image-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-panel-2);
      border: 1px solid var(--border-soft);
      border-radius: inherit;
      color: var(--text-muted);
    }
    .image-placeholder.loading .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid var(--border-soft);
      border-top-color: var(--accent-blue);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    .private-image {
      display: block;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class PrivateImageComponent {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly src = input.required<string>();
  readonly alt = input('');
  readonly width = input('100%');
  readonly height = input('auto');
  readonly objectFit = input<'cover' | 'contain' | 'fill' | 'none' | 'scale-down'>('cover');
  readonly borderRadius = input('8px');

  readonly imageUrl = signal<string | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);

  constructor() {
    effect(() => {
      const src = this.src();
      if (src) {
        this.loadImage(src);
      }
    });
  }

  private loadImage(path: string): void {
    this.loading.set(true);
    this.error.set(false);
    this.imageUrl.set(null);

    const token = this.auth.accessToken;
    if (!token) {
      this.loading.set(false);
      this.error.set(true);
      return;
    }

    const fullUrl = `${environment.apiUrl}${path}`;

    this.http
      .get(fullUrl, {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .subscribe({
        next: (blob) => {
          const objectUrl = URL.createObjectURL(blob);
          this.imageUrl.set(objectUrl);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set(true);
        },
      });
  }

  onError(): void {
    this.error.set(true);
  }
}