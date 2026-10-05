import { CommonModule } from '@angular/common';
import { Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-private-image',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (imageUrl()) {
      <img
        [src]="imageUrl()"
        [alt]="alt()"
        [style.width]="width()"
        [style.height]="height()"
        [style.object-fit]="objectFit()"
        [style.border-radius]="borderRadius()"
        class="private-image"
        (error)="onImageError()"
      />
    } @else if (fallback() === 'avatar') {
      <div
        class="image-placeholder avatar-fallback"
        [style.width]="width()"
        [style.height]="height()"
        [style.border-radius]="borderRadius()"
        [attr.aria-label]="alt() || 'Imagen de perfil'"
      >
        @if (fallbackText()) {
          <span>{{ fallbackText() }}</span>
        } @else {
          <svg
            width="48%"
            height="48%"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            aria-hidden="true"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0" />
          </svg>
        }
      </div>
    } @else {
      <div
        class="image-placeholder image-fallback"
        [style.width]="width()"
        [style.height]="height()"
        [style.border-radius]="borderRadius()"
        [attr.aria-label]="alt() || 'Imagen no disponible'"
      >
        <svg
          width="42%"
          height="42%"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M5 18l5-5 3 3 2-2 4 4" />
        </svg>
      </div>
    }
  `,
  styles: [`
    :host {
      display: inline-flex;
      max-width: 100%;
      min-width: 0;
      flex: 0 0 auto;
      line-height: 0;
    }

    .private-image,
    .image-placeholder {
      display: block;
      box-sizing: border-box;
      overflow: hidden;
    }

    .private-image {
      background: var(--bg-panel-2);
    }

    .image-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--border-soft);
      background: var(--bg-panel-2);
      color: var(--text-muted);
      user-select: none;
    }

    .avatar-fallback {
      background: linear-gradient(145deg, var(--bg-panel-2), var(--bg-card));
      color: var(--accent-blue);
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    .image-fallback {
      color: var(--text-muted);
    }
  `],
})
export class PrivateImageComponent {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private objectUrl: string | null = null;
  private requestVersion = 0;

  readonly src = input<string | null>('');
  readonly alt = input('');
  readonly width = input('100%');
  readonly height = input('auto');
  readonly objectFit = input<'cover' | 'contain' | 'fill' | 'none' | 'scale-down'>('cover');
  readonly borderRadius = input('8px');
  readonly fallback = input<'image' | 'avatar'>('image');
  readonly fallbackText = input('');

  readonly imageUrl = signal<string | null>(null);

  constructor() {
    effect(() => {
      const path = (this.src() ?? '').trim();
      this.loadImage(path);
    }, { allowSignalWrites: true });

    this.destroyRef.onDestroy(() => {
      this.requestVersion += 1;
      this.revokeObjectUrl();
    });
  }

  private loadImage(path: string): void {
    const version = ++this.requestVersion;

    this.revokeObjectUrl();
    this.imageUrl.set(null);

    if (!path) {
      return;
    }

    const resolved = this.resolveUrl(path);
    const isExternalUrl = /^https?:\/\//i.test(path)
      && !path.startsWith(environment.apiUrl);

    if (isExternalUrl) {
      this.imageUrl.set(path);
      return;
    }

    this.http.get(resolved, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        if (version !== this.requestVersion) {
          return;
        }

        this.revokeObjectUrl();
        this.objectUrl = URL.createObjectURL(blob);
        this.imageUrl.set(this.objectUrl);
      },
      error: () => {
        if (version === this.requestVersion) {
          this.revokeObjectUrl();
          this.imageUrl.set(null);
        }
      },
    });
  }

  private resolveUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    const normalized = path.startsWith('/') ? path : `/${path}`;

    if (
      normalized === environment.apiUrl ||
      normalized.startsWith(`${environment.apiUrl}/`)
    ) {
      return normalized;
    }

    return `${environment.apiUrl}${normalized}`;
  }

  private revokeObjectUrl(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

  onImageError(): void {
    this.revokeObjectUrl();
    this.imageUrl.set(null);
  }
}
