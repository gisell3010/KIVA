import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminApiService } from '../../../data-access/api/admin-api.service';
import { AdminDashboardRead, GlobalRole, TripStatus} from '../../../shared/models/domain.models';

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="admin-page">
      <div class="page-head">
        <div>
          <h1 class="page-title">
            Visión general de la plataforma
          </h1>
          <p class="page-subtitle">
            Métricas reales de KIVA
          </p>
        </div>
        <a
          routerLink="/admin"
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
          <p>
            Cargando métricas administrativas...
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
            <div class="kpi-value">
              {{ dashboard()!.users_count }}
            </div>

            <div class="kpi-label">
              Usuarios
            </div>
          </div>


          <div class="card kpi-card">
            <div class="kpi-value">
              {{ dashboard()!.groups_count }}
            </div>

            <div class="kpi-label">
              Grupos
            </div>
          </div>


          <div class="card kpi-card">
            <div class="kpi-value">
              {{ dashboard()!.trips_count }}
            </div>

            <div class="kpi-label">
              Viajes
            </div>
          </div>


          <div class="card kpi-card">
            <div class="kpi-value">
              {{ dashboard()!.active_trips_count }}
            </div>

            <div class="kpi-label">
              Viajes activos
            </div>
          </div>

        </div>


        <div class="overview-grid">

          <section class="card overview-section">

            <h2 class="overview-title">
              Estado de usuarios
            </h2>

            <div class="status-summary">

              <div class="summary-item">

                <div class="summary-value good-text">
                  {{ dashboard()!.active_users_count }}
                </div>

                <div class="summary-label">
                  Activos
                </div>

              </div>


              <div class="summary-item">

                <div class="summary-value danger-text">
                  {{ dashboard()!.suspended_users_count }}
                </div>

                <div class="summary-label">
                  Suspendidos
                </div>

              </div>

            </div>

          </section>


          <section class="card overview-section">

            <h2 class="overview-title">
              Usuarios por rol
            </h2>

            <div class="distribution-chart">

              @for (
                row of roleDistribution();
                track row.role
              ) {

                <div class="dist-bar">

                  <div class="dist-label">
                    <span>
                      {{ row.label }}
                    </span>

                    <span class="dist-value">
                      {{ row.count }}
                    </span>
                  </div>


                  <div class="dist-track">

                    <div
                      class="dist-fill"
                      [style.width.%]="row.percentage"
                      [style.background]="row.color"
                    ></div>

                  </div>

                </div>

              }

            </div>

          </section>


          <section
            class="card overview-section full-width"
          >

            <h2 class="overview-title">
              Estado de viajes
            </h2>

            <div class="trip-status-grid">

              @for (
                status of tripStatuses();
                track status.key
              ) {

                <div
                  class="status-card"
                  [style.border-left-color]="status.color"
                >

                  <div class="status-header">

                    <span
                      class="status-dot"
                      [style.background]="status.color"
                    ></span>

                    <span class="status-label">
                      {{ status.label }}
                    </span>

                  </div>


                  <div class="status-count">
                    {{ status.count }}
                  </div>


                  <div class="status-percent">
                    {{ status.percentage }}% del total
                  </div>

                </div>

              }

            </div>

          </section>


          <section
            class="card overview-section full-width"
          >

            <h2 class="overview-title">
              Actividad registrada
            </h2>

            <div class="activity-stats">

              <div class="activity-item">

                <div
                  class="activity-icon"
                  style="
                    background: rgba(59,130,246,0.15);
                    color: #60a5fa;
                  "
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.75"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                    />
                  </svg>
                </div>

                <div>
                  <div class="activity-count">
                    {{ dashboard()!.expenses_count }}
                  </div>

                  <div class="activity-label">
                    Gastos registrados
                  </div>
                </div>

              </div>


              <div class="activity-item">

                <div
                  class="activity-icon"
                  style="
                    background: rgba(34,211,238,0.15);
                    color: #22d3ee;
                  "
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.75"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 9.5V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2.5a2.5 2.5 0 0 0 0 5V17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2.5a2.5 2.5 0 0 0 0-5Z"
                    />
                  </svg>
                </div>

                <div>
                  <div class="activity-count">
                    {{ dashboard()!.reservations_count }}
                  </div>

                  <div class="activity-label">
                    Reservas registradas
                  </div>
                </div>

              </div>


              <div class="activity-item">

                <div
                  class="activity-icon"
                  style="
                    background: rgba(168,85,247,0.15);
                    color: #c084fc;
                  "
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.75"
                    aria-hidden="true"
                  >
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="16"
                      rx="2"
                    />

                    <path
                      d="m7.5 12 2.5 2.5L15.5 9"
                    />
                  </svg>
                </div>

                <div>
                  <div class="activity-count">
                    {{ dashboard()!.polls_count }}
                  </div>

                  <div class="activity-label">
                    Votaciones creadas
                  </div>
                </div>

              </div>


              <div class="activity-item">

                <div
                  class="activity-icon"
                  style="
                    background: rgba(34,197,94,0.15);
                    color: #4ade80;
                  "
                >
                  <svg
                    width="20"
                    height="20"
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
                      d="M12 7v5l3 2"
                    />
                  </svg>
                </div>

                <div>
                  <div class="activity-count">
                    {{ dashboard()!.open_polls_count }}
                  </div>

                  <div class="activity-label">
                    Votaciones abiertas
                  </div>
                </div>

              </div>

            </div>

          </section>


          <section
            class="card overview-section full-width"
          >

            <h2 class="overview-title">
              Volumen de gastos
            </h2>

            <div class="expense-total">

              <div class="expense-value">
                {{
                  formatCurrency(
                    dashboard()!.total_expenses
                  )
                }}
              </div>

              <div class="expense-label">
                Total registrado en
                {{ dashboard()!.currency }}
              </div>

            </div>

          </section>

        </div>

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
        repeat(4, minmax(0, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }

    .kpi-card {
      min-width: 0;
    }

    .kpi-value {
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--text-primary);
    }

    .kpi-label {
      margin-top: 4px;
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .overview-grid {
      display: grid;
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
      gap: 20px;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .overview-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .overview-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
    }

    .status-summary {
      display: grid;
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .summary-item {
      padding: 18px;
      border-radius: 10px;
      background: var(--bg-panel-2);
      text-align: center;
    }

    .summary-value {
      font-size: 1.5rem;
      font-weight: 800;
    }

    .summary-label {
      margin-top: 4px;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .good-text {
      color: #4ade80;
    }

    .danger-text {
      color: #f87171;
    }

    .distribution-chart {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .dist-bar {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .dist-label {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      font-size: 0.8rem;
    }

    .dist-value {
      font-weight: 700;
      color: var(--text-primary);
    }

    .dist-track {
      height: 8px;
      overflow: hidden;
      border-radius: 999px;
      background: var(--bg-panel-2);
    }

    .dist-fill {
      height: 100%;
      border-radius: 999px;
      transition:
        width var(--transition-normal);
    }

    .trip-status-grid {
      display: grid;
      grid-template-columns:
        repeat(4, minmax(0, 1fr));
      gap: 12px;
    }

    .status-card {
      padding: 16px;
      border-radius: 10px;
      border-left: 4px solid;
      background: var(--bg-panel-2);
      text-align: center;
    }

    .status-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-bottom: 8px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .status-count {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-primary);
    }

    .status-percent {
      margin-top: 4px;
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    .activity-stats {
      display: grid;
      grid-template-columns:
        repeat(4, minmax(0, 1fr));
      gap: 12px;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-radius: 10px;
      background: var(--bg-panel-2);
    }

    .activity-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      flex-shrink: 0;
      border-radius: 12px;
    }

    .activity-count {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-primary);
    }

    .activity-label {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .expense-total {
      padding: 20px;
      border-radius: 10px;
      background: var(--bg-panel-2);
    }

    .expense-value {
      font-size: 1.7rem;
      font-weight: 800;
      color: var(--text-primary);
    }

    .expense-label {
      margin-top: 4px;
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .error-text {
      color: var(--accent-red);
    }

    @media (max-width: 900px) {
      .kpi-grid,
      .trip-status-grid,
      .activity-stats {
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 700px) {
      .overview-grid {
        grid-template-columns: 1fr;
      }

      .full-width {
        grid-column: auto;
      }

      .state-card {
        align-items: flex-start;
        flex-direction: column;
      }
    }

    @media (max-width: 520px) {
      .kpi-grid,
      .trip-status-grid,
      .activity-stats,
      .status-summary {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class AdminOverviewComponent
  implements OnInit
{
  private readonly adminApi =
    inject(AdminApiService);

  readonly dashboard =
    signal<AdminDashboardRead | null>(
      null
    );

  readonly loading =
    signal(true);

  readonly error =
    signal<string | null>(null);


  readonly roleDistribution =
    computed(() => {
      const data = this.dashboard();

      const total =
        data?.users_count ?? 0;

      const byRole =
        data?.users_by_role;

      const roles: Array<{
        role: GlobalRole;
        label: string;
        color: string;
      }> = [
        {
          role: 'SUPER_ADMIN',
          label: 'Super administradores',
          color: '#7c3aed',
        },
        {
          role: 'ADMIN',
          label: 'Administradores',
          color: '#a855f7',
        },
        {
          role: 'SUPPORT',
          label: 'Soporte',
          color: '#22c55e',
        },
        {
          role: 'USER',
          label: 'Usuarios',
          color: '#3b82f6',
        },
      ];

      return roles.map(
        item => {
          const count =
            byRole?.[item.role] ?? 0;

          return {
            ...item,

            count,

            percentage:
              total > 0
                ? Math.round(
                    (count / total)
                    * 100
                  )
                : 0,
          };
        }
      );
    });


  readonly tripStatuses =
    computed(() => {
      const data = this.dashboard();

      const total =
        data?.trips_count ?? 0;

      const byStatus =
        data?.trips_by_status;

      const statuses: Array<{
        key: TripStatus;
        label: string;
        color: string;
      }> = [
        {
          key: 'PLANNING',
          label: 'Planificando',
          color: '#f97316',
        },
        {
          key: 'CONFIRMED',
          label: 'Confirmado',
          color: '#3b82f6',
        },
        {
          key: 'COMPLETED',
          label: 'Finalizado',
          color: '#94a3b8',
        },
        {
          key: 'CANCELLED',
          label: 'Cancelado',
          color: '#ef4444',
        },
      ];

      return statuses.map(
        item => {
          const count =
            byStatus?.[item.key] ?? 0;

          return {
            ...item,

            count,

            percentage:
              total > 0
                ? Math.round(
                    (count / total)
                    * 100
                  )
                : 0,
          };
        }
      );
    });


  ngOnInit(): void {
    this.loadDashboard();
  }


  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    this.adminApi
      .dashboard()
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
            'No se pudieron cargar las métricas administrativas.'
          );

          this.loading.set(false);
        },

      });
  }


  formatCurrency(
    value: string | number
  ): string {
    const amount =
      Number(value);

    return (
      Number.isFinite(amount)
        ? amount
        : 0
    ).toLocaleString(
      'es-CO',
      {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
      }
    );
  }
}