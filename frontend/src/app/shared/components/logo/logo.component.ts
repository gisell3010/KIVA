import { Component, input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="logo-container" [class.compact]="compact()">
      <div class="logo-icon-wrapper" [class.has-error]="imageError()">
        @if (!imageError() && logoSrc()) {
          <img
            class="logo-image"
            [src]="logoSrc()"
            [alt]="'KIVA - ' + getMeaning()"
            (error)="onImageError()"
            loading="lazy"
          />
        } @else {
          <div class="logo-fallback" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12Z"/>
            </svg>
          </div>
        }
      </div>

      @if (!compact() && showText()) {
        <div class="logo-text">
          <div class="logo-name">KIVA</div>
          <div class="logo-sub">{{ getMeaning() }}</div>
        </div>
      }
    </div>
  `,
  styles: [`
    .logo-container {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .logo-container.compact {
      gap: 0;
    }

    .logo-icon-wrapper {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      overflow: hidden;
      position: relative;
    }

    .logo-container.compact .logo-icon-wrapper {
      width: 32px;
      height: 32px;
      border-radius: 8px;
    }

    .logo-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: inherit;
    }

    .logo-fallback {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .logo-fallback svg {
      width: 20px;
      height: 20px;
    }

    .logo-text {
      display: flex;
      flex-direction: column;
      line-height: 1.1;
      min-width: 0;
      overflow: hidden;
    }

    .logo-name {
      font-weight: 700;
      font-size: 1rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .logo-sub {
      font-size: 0.62rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    @media (max-width: 480px) {
      .logo-name { font-size: 0.9rem; }
      .logo-sub { font-size: 0.58rem; }
    }
  `]
})
export class LogoComponent {
  readonly logoSrc = input<string>('assets/logo/kiva-logo.svg');
  readonly compact = input<boolean>(false);
  readonly showText = input<boolean>(true);

  protected imageError = signal(false);

  onImageError(): void {
    this.imageError.set(true);
  }

  getMeaning(): string {
    return 'Kinship, Inspiration, Voyages & Adventures';
  }
}