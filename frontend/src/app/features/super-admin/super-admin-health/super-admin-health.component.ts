import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HealthApiService } from '../../../data-access/api/health-api.service';
import { ReadinessRead } from '../../../shared/models/domain.models';

@Component({
  selector: 'app-super-admin-health',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
  ],
  template: `
    <div class="admin-page">
      <div class="page-head">
        <div>
          <h1 class="page-title">
            Salud del Sistema
          </h1>
          <p class="page-subtitle">
            Estado real de la API y la conexión con PostgreSQL.
          </p>
        </div>
        <div class="page-actions">
          <button
            type="button"
            class="btn btn-outline"
            [disabled]="loading()"
            (click)="loadHealth()"
          >
            {{
              loading()
                ? 'Actualizando...'
                : 'Actualizar'
            }}
          </button>


          <a
            routerLink="/super-admin"
            class="btn btn-outline"
          >
            Volver al panel
          </a>

        </div>

      </div>


      @if (
        health();
        as data
      ) {

        <div class="health-grid">

          <div class="card health-card">

            <div
              class="status-icon"
              [class.ok]="
                data.status === 'ok'
              "
              [class.error]="
                data.status !== 'ok'
              "
            >

              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                aria-hidden="true"
              >
                <path
                  d="M22 12h-4l-3 9L9 3l-3 9H2"
                />
              </svg>

            </div>


            <div>

              <div class="health-title">
                API
              </div>

              <div class="health-value">
                {{
                  data.status === 'ok'
                    ? 'Funcionando'
                    : 'No disponible'
                }}
              </div>

            </div>

          </div>


          <div class="card health-card">

            <div
              class="status-icon"
              [class.ok]="
                data.database === 'ok'
              "
              [class.error]="
                data.database !== 'ok'
              "
            >

              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                aria-hidden="true"
              >
                <ellipse
                  cx="12"
                  cy="5"
                  rx="9"
                  ry="3"
                />

                <path
                  d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"
                />

                <path
                  d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"
                />
              </svg>

            </div>


            <div>

              <div class="health-title">
                Base de datos
              </div>

              <div class="health-value">
                {{
                  data.database === 'ok'
                    ? 'Disponible'
                    : 'No disponible'
                }}
              </div>

            </div>

          </div>

        </div>


        @if (
          data.status !== 'ok'
          || data.database !== 'ok'
        ) {

          <div
            class="card warning-card"
            role="alert"
          >
            La comprobación de salud detectó un problema.
            Revisa el backend y la conexión con PostgreSQL.
          </div>

        }

      } @else if (loading()) {

        <div class="card">
          Comprobando salud del sistema...
        </div>

      }

    </div>
  `,

  styles: [`
    .admin-page {
      max-width: 1000px;
    }

    .page-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .health-grid {
      display: grid;
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
      gap: 18px;
    }

    .health-card {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .status-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .status-icon.ok {
      background:
        rgba(34, 197, 94, 0.15);
      color: #4ade80;
    }

    .status-icon.error {
      background:
        rgba(239, 68, 68, 0.15);
      color: #f87171;
    }

    .health-title {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .health-value {
      margin-top: 3px;
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .warning-card {
      margin-top: 18px;
      color: #f87171;
    }

    @media (max-width: 700px) {
      .health-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class SuperAdminHealthComponent
  implements OnInit
{
  private readonly healthApi =
    inject(HealthApiService);


  readonly health =
    signal<ReadinessRead | null>(
      null,
    );

  readonly loading =
    signal(false);


  ngOnInit(): void {
    this.loadHealth();
  }


  loadHealth(): void {
    this.loading.set(true);

    this.healthApi
      .system()
      .subscribe({

        next: data => {
          this.health.set(
            data,
          );

          this.loading.set(false);
        },

        error: () => {
          this.health.set({
            status: 'error',
            database: 'unavailable',
          });

          this.loading.set(false);
        },

      });
  }
}