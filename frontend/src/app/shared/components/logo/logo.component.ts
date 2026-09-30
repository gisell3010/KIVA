import {
  Component,
  input,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <div
      class="logo-container"
      [class.compact]="compact()"
    >
      <div class="logo-icon-wrapper">
        @if (!imageError()) {
          <img
            class="logo-image"
            [src]="logoSrc()"
            [alt]="'KIVA - ' + getMeaning()"
            (error)="onImageError()"
          />
        } @else {
          <div
            class="logo-fallback"
            aria-hidden="true"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
              />

              <path
                d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12Z"
              />
            </svg>
          </div>
        }
      </div>

      @if (!compact() && showText()) {
        <div class="logo-text">
          <div class="logo-name">
            KIVA
          </div>

          <div class="logo-sub">
            {{ getMeaning() }}
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .logo-container {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .logo-container.compact {
      gap: 0;
    }

    .logo-icon-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      overflow: hidden;
      border-radius: 10px;
    }

    .logo-container.compact .logo-icon-wrapper {
      width: 34px;
      height: 34px;
      border-radius: 8px;
    }

    .logo-image {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .logo-fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      background:
        linear-gradient(
          135deg,
          var(--accent-blue),
          var(--accent-purple)
        );
      color: white;
    }

    .logo-fallback svg {
      width: 20px;
      height: 20px;
    }

    .logo-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
      overflow: hidden;
      line-height: 1.1;
    }

    .logo-name {
      overflow: hidden;
      color: var(--text-primary);
      font-size: 1rem;
      font-weight: 700;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .logo-sub {
      overflow: hidden;
      color: var(--text-muted);
      font-size: 0.62rem;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    @media (max-width: 480px) {
      .logo-name {
        font-size: 0.9rem;
      }

      .logo-sub {
        font-size: 0.58rem;
      }
    }
  `],
})
export class LogoComponent {
  readonly logoSrc = input<string>(
    '/assets/logo/kiva-logo.png',
  );

  readonly compact = input<boolean>(false);
  readonly showText = input<boolean>(true);

  protected readonly imageError = signal(false);

  onImageError(): void {
    this.imageError.set(true);
  }

  getMeaning(): string {
    return 'Kinship, Inspiration, Voyages & Adventures';
  }
}