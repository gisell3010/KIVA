import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminApiService } from '../../../data-access/api/admin-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { SupportDashboardRead } from '../../../shared/models/domain.models';

@Component({
  selector: 'app-support-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="admin-page">
      <div class="page-head">
        <div>
          <h1 class="page-title">
            Panel de Soporte
          </h1>
          <p class="page-subtitle">
            Consulta general de usuarios de KIVA
          </p>
        </div>
        <a
          routerLink="/dashboard"
          class="btn btn-outline"
        >
          Espacio de usuario
        </a>

      </div>


      @if (loading()) {

        <div class="card state-card">
          <p>
            Cargando información de soporte...
          </p>
        </div>

      } @else if (error()) {

        <div
          class="card state-card error-text"
          role="alert"
        >

          <p>
            {{ error() }}
          </p>

          <button
            type="button"
            class="btn btn-outline"
            (click)="loadDashboard()"
          >
            Reintentar
          </button>

        </div>

      } @else if (dashboard()) {

        <div class="kpi-grid">

          <div class="card kpi-card">

            <div class="kpi-icon users-icon">

              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                aria-hidden="true"
              >
                <path
                  d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                />

                <circle
                  cx="9"
                  cy="7"
                  r="4"
                />

                <path
                  d="M23 21v-2a4 4 0 0 0-3-3.87"
                />

                <path
                  d="M16 3.13a4 4 0 0 1 0 7.75"
                />
              </svg>

            </div>

            <div>

              <div class="kpi-value">
                {{ dashboard()!.users_count }}
              </div>

              <div class="kpi-label">
                Usuarios registrados
              </div>

            </div>

          </div>


          <div class="card kpi-card">

            <div class="kpi-icon active-icon">

              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                />

                <path
                  d="m8 12 2.5 2.5L16 9"
                />
              </svg>

            </div>

            <div>

              <div class="kpi-value">
                {{ dashboard()!.active_users_count }}
              </div>

              <div class="kpi-label">
                Usuarios activos
              </div>

            </div>

          </div>


          <div class="card kpi-card">

            <div class="kpi-icon suspended-icon">

              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                />

                <path d="M8 12h8"/>
              </svg>

            </div>

            <div>

              <div class="kpi-value">
                {{ dashboard()!.suspended_users_count }}
              </div>

              <div class="kpi-label">
                Usuarios suspendidos
              </div>

            </div>

          </div>

        </div>


        <div class="support-grid">

          <section class="card support-section">

            <div class="card-header">

              <div>
                <h2 class="section-title">
                  Gestión de soporte
                </h2>

                <p class="section-description">
                  Consulta la información de los usuarios
                  para atender solicitudes de soporte.
                </p>
              </div>

            </div>


            <div class="support-actions">

              <a
                routerLink="/soporte/usuarios"
                class="support-action"
              >

                <div class="action-icon">

                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.75"
                    aria-hidden="true"
                  >
                    <path
                      d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                    />

                    <circle
                      cx="9"
                      cy="7"
                      r="4"
                    />

                    <path
                      d="M19 8v6"
                    />

                    <path
                      d="M22 11h-6"
                    />
                  </svg>

                </div>

                <div class="action-content">

                  <strong>
                    Consultar usuarios
                  </strong>

                  <span>
                    Busca usuarios y revisa su información.
                  </span>

                </div>

                <svg
                  class="action-arrow"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.75"
                  aria-hidden="true"
                >
                  <path d="m9 18 6-6-6-6"/>
                </svg>

              </a>

            </div>

          </section>


          <section class="card support-section">

            <h2 class="section-title">
              Estado de usuarios
            </h2>


            <div class="status-list">

              <div class="status-row">

                <div class="status-info">

                  <span class="status-dot active"></span>

                  <span>
                    Usuarios activos
                  </span>

                </div>

                <strong>
                  {{ dashboard()!.active_users_count }}
                </strong>

              </div>


              <div class="status-row">

                <div class="status-info">

                  <span class="status-dot suspended"></span>

                  <span>
                    Usuarios suspendidos
                  </span>

                </div>

                <strong>
                  {{ dashboard()!.suspended_users_count }}
                </strong>

              </div>


              <div class="status-row">

                <div class="status-info">

                  <span class="status-dot total"></span>

                  <span>
                    Total de usuarios
                  </span>

                </div>

                <strong>
                  {{ dashboard()!.users_count }}
                </strong>

              </div>

            </div>

          </section>

        </div>


        @if (authService.isAdmin()) {

          <div class="card admin-access">

            <div>

              <h2 class="section-title">
                Administración
              </h2>

              <p class="section-description">
                Tu cuenta también tiene permisos administrativos.
              </p>

            </div>

            <a
              routerLink="/admin"
              class="btn btn-outline"
            >
              Ir a administración
            </a>

          </div>

        }

      }

    </div>
  `,

  styles: [`
    .admin-page {
      max-width: 1200px;
    }

    .state-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }

    .kpi-card {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .kpi-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 46px;
      height: 46px;
      flex-shrink: 0;
      border-radius: 12px;
    }

    .users-icon {
      color: #60a5fa;
      background:
        rgba(59, 130, 246, 0.15);
    }

    .active-icon {
      color: #4ade80;
      background:
        rgba(34, 197, 94, 0.15);
    }

    .suspended-icon {
      color: #f87171;
      background:
        rgba(239, 68, 68, 0.15);
    }

    .kpi-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-primary);
    }

    .kpi-label {
      margin-top: 3px;
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .support-grid {
      display: grid;
      grid-template-columns:
        minmax(0, 1.3fr)
        minmax(0, 0.7fr);
      gap: 20px;
    }

    .support-section {
      min-width: 0;
    }

    .section-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .section-description {
      margin: 5px 0 0;
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .support-actions {
      margin-top: 18px;
    }

    .support-action {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px;
      border:
        1px solid var(--border-soft);
      border-radius: 10px;
      background: var(--bg-panel-2);
      color: var(--text-primary);
      text-decoration: none;
      transition:
        border-color var(--transition-fast),
        transform var(--transition-fast);
    }

    .support-action:hover {
      border-color: var(--accent-blue);
      transform: translateY(-1px);
    }

    .action-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      flex-shrink: 0;
      border-radius: 10px;
      background:
        rgba(59, 130, 246, 0.15);
      color: #60a5fa;
    }

    .action-content {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 3px;
    }

    .action-content span {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .action-arrow {
      color: var(--text-muted);
    }

    .status-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 18px;
    }

    .status-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px;
      border-radius: 9px;
      background: var(--bg-panel-2);
    }

    .status-info {
      display: flex;
      align-items: center;
      gap: 9px;
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .status-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
    }

    .status-dot.active {
      background: #22c55e;
    }

    .status-dot.suspended {
      background: #ef4444;
    }

    .status-dot.total {
      background: #3b82f6;
    }

    .admin-access {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-top: 20px;
    }

    .error-text {
      color: var(--accent-red);
    }

    @media (max-width: 800px) {
      .kpi-grid {
        grid-template-columns: 1fr;
      }

      .support-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 600px) {
      .state-card,
      .admin-access {
        align-items: flex-start;
        flex-direction: column;
      }
    }
  `],
})
export class SupportDashboardComponent
  implements OnInit
{
  protected readonly authService =
    inject(AuthService);

  private readonly adminApi =
    inject(AdminApiService);


  readonly dashboard =
    signal<SupportDashboardRead | null>(
      null
    );

  readonly loading =
    signal(true);

  readonly error =
    signal<string | null>(null);


  ngOnInit(): void {
    this.loadDashboard();
  }


  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    this.adminApi
      .supportDashboard()
      .subscribe({

        next: data => {
          this.dashboard.set(
            data
          );

          this.loading.set(false);
        },

        error: () => {
          this.dashboard.set(
            null
          );

          this.error.set(
            'No se pudo cargar el panel de soporte.'
          );

          this.loading.set(false);
        },

      });
  }
}