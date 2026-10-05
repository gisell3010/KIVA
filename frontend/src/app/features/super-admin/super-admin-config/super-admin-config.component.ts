import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminApiService } from '../../../data-access/api/admin-api.service';
import { SystemConfigRead } from '../../../shared/models/domain.models';

@Component({
  selector: 'app-super-admin-config',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="admin-page">
      <div class="page-head">
        <div>
          <h1 class="page-title">
            Configuración del sistema
          </h1>

          <p class="page-subtitle">
            Parámetros efectivos de la plataforma KIVA
          </p>
        </div>

        <a
          routerLink="/super-admin"
          class="btn btn-outline"
        >
          <svg
            class="ui-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            aria-hidden="true"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>

          Volver al panel
        </a>
      </div>

      @if (loading()) {
        <div class="card state-card">
          <p>Cargando configuración...</p>
        </div>
      } @else if (error()) {
        <div
          class="card state-card error-text"
          role="alert"
        >
          <p>{{ error() }}</p>

          <button
            type="button"
            class="btn btn-outline"
            (click)="loadConfig()"
          >
            Reintentar
          </button>
        </div>
      } @else if (config()) {
        <div class="config-grid">
          <section class="card config-section">
            <div class="section-head">
              <h2>Aplicación</h2>
              <p>
                Identificación y entorno activo del backend.
              </p>
            </div>

            <dl class="config-list">
              <div class="config-row">
                <dt>Nombre</dt>
                <dd>{{ config()!.app_name }}</dd>
              </div>

              <div class="config-row">
                <dt>Entorno</dt>
                <dd>
                  <span class="badge badge-blue">
                    {{ environmentLabel(config()!.environment) }}
                  </span>
                </dd>
              </div>

              <div class="config-row">
                <dt>Prefijo de API</dt>
                <dd>
                  <code>{{ config()!.api_prefix }}</code>
                </dd>
              </div>

              <div class="config-row">
                <dt>Moneda</dt>
                <dd>{{ config()!.currency }}</dd>
              </div>
            </dl>
          </section>

          <section class="card config-section">
            <div class="section-head">
              <h2>Sesiones</h2>
              <p>
                Duración configurada para los tokens de autenticación.
              </p>
            </div>

            <dl class="config-list">
              <div class="config-row">
                <dt>Access token</dt>
                <dd>
                  {{ config()!.access_token_minutes }} min
                </dd>
              </div>

              <div class="config-row">
                <dt>Refresh token</dt>
                <dd>
                  {{ config()!.refresh_token_days }} días
                </dd>
              </div>
            </dl>
          </section>

          <section class="card config-section">
            <div class="section-head">
              <h2>Imágenes</h2>
              <p>
                Límites efectivos para archivos y fotografías de destinos.
              </p>
            </div>

            <dl class="config-list">
              <div class="config-row">
                <dt>Tamaño máximo</dt>
                <dd>{{ imageLimitMb() }} MB</dd>
              </div>

              <div class="config-row">
                <dt>Fotos por destino</dt>
                <dd>
                  {{ config()!.max_destination_photos }}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-page {
      max-width: 980px;
    }

    .state-card {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
    }

    .state-card p {
      margin: 0;
    }

    .config-grid {
      display: grid;
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
      gap: 20px;
    }

    .config-section {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .config-section:last-child {
      grid-column: 1 / -1;
    }

    .section-head h2 {
      margin: 0;
      font-size: 1.05rem;
      color: var(--text-primary);
    }

    .section-head p {
      margin: 5px 0 0;
      font-size: 0.82rem;
      color: var(--text-muted);
    }

    .config-list {
      margin: 0;
      display: flex;
      flex-direction: column;
    }

    .config-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding: 14px 0;
      border-bottom: 1px solid var(--border-soft);
    }

    .config-row:first-child {
      padding-top: 0;
    }

    .config-row:last-child {
      padding-bottom: 0;
      border-bottom: 0;
    }

    .config-row dt {
      font-size: 0.82rem;
      color: var(--text-muted);
    }

    .config-row dd {
      margin: 0;
      text-align: right;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .config-row code {
      padding: 3px 7px;
      border: 1px solid var(--border-soft);
      border-radius: 6px;
      background: var(--bg-panel-2);
      color: var(--text-secondary);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.8rem;
    }

    @media (max-width: 760px) {
      .config-grid {
        grid-template-columns: 1fr;
      }

      .config-section:last-child {
        grid-column: auto;
      }
    }

    @media (max-width: 520px) {
      .config-row {
        align-items: flex-start;
        flex-direction: column;
        gap: 6px;
      }

      .config-row dd {
        text-align: left;
      }
    }
  `]
})
export class SuperAdminConfigComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);

  readonly config = signal<SystemConfigRead | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadConfig();
  }

  loadConfig(): void {
    this.loading.set(true);
    this.error.set(null);

    this.adminApi.config().subscribe({
      next: config => {
        this.config.set(config);
        this.loading.set(false);
      },
      error: () => {
        this.config.set(null);
        this.loading.set(false);
        this.error.set(
          'No se pudo cargar la configuración del sistema.'
        );
      }
    });
  }

  imageLimitMb(): string {
    const bytes = this.config()?.max_image_bytes ?? 0;
    return (bytes / (1024 * 1024)).toFixed(0);
  }

  environmentLabel(
    environment: SystemConfigRead['environment']
  ): string {
    switch (environment) {
      case 'production':
        return 'Producción';
      case 'test':
        return 'Pruebas';
      default:
        return 'Desarrollo';
    }
  }
}
