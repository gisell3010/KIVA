import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminApiService } from '../../../data-access/api/admin-api.service';
import { AdminDashboardRead, UserRead, GroupRead, GlobalRole } from '../../../shared/models/domain.models';
import { formatMoney } from '../../../shared/utils/money.utils';
import { formatRelativeTime } from '../../../shared/utils/date.utils';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="admin-page">
      <div class="page-head">
        <div>
          <h1 class="page-title">
            Panel de Administración
          </h1>
          <p class="page-subtitle">
            Visión general de la plataforma KIVA
          </p>
        </div>
        <a
          routerLink="/dashboard"
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
            <path
              d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"
            />

            <path
              d="M9 22V12h6v10"
            />
          </svg>

          Espacio de usuario
        </a>

      </div>


      @if (error()) {

        <div
          class="error-banner"
          role="alert"
        >
          <svg
            class="ui-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
            />

            <path
              d="M12 8v4M12 16h.01"
            />
          </svg>

          <span>
            {{ error() }}
          </span>


          <button
            type="button"
            class="btn btn-outline btn-sm"
            (click)="reload()"
          >
            Reintentar
          </button>

        </div>

      }


      @if (loading()) {

        <div class="loading-state">

          <svg
            class="ui-icon animate-spin"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path
              d="M21 12a9 9 0 11-6.219-8.56"
            />
          </svg>

          <p>
            Cargando panel...
          </p>

        </div>

      } @else if (dashboard()) {

        <div class="grid grid-cols-4 kpi-row">

          <div class="card kpi">

            <div
              class="kpi-icon"
              style="
                background: rgba(59,130,246,0.15);
                color: #60a5fa;
              "
            >
              <svg
                width="24"
                height="24"
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
                Usuarios totales
              </div>

            </div>

          </div>


          <div class="card kpi">

            <div
              class="kpi-icon"
              style="
                background: rgba(34,197,94,0.15);
                color: #4ade80;
              "
            >
              <svg
                width="24"
                height="24"
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


          <div class="card kpi">

            <div
              class="kpi-icon"
              style="
                background: rgba(239,68,68,0.15);
                color: #f87171;
              "
            >
              <svg
                width="24"
                height="24"
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
                  d="M8 12h8"
                />
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


          <div class="card kpi">

            <div
              class="kpi-icon"
              style="
                background: rgba(168,85,247,0.15);
                color: #c084fc;
              "
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                aria-hidden="true"
              >
                <path
                  d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
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


            <div>

              <div class="kpi-value">
                {{ adminCount() }}
              </div>

              <div class="kpi-label">
                Administradores
              </div>

            </div>

          </div>

        </div>


        <div class="grid grid-cols-2 main-row">

          <div class="card">

            <div class="card-header">

              <h3>
                Grupos y viajes
              </h3>


              <div class="header-links">

                <a
                  routerLink="/admin/grupos"
                  class="link-see-all"
                >
                  Grupos →
                </a>

                <a
                  routerLink="/admin/viajes"
                  class="link-see-all"
                >
                  Viajes →
                </a>

              </div>

            </div>


            <div class="stat-grid">

              <div class="stat-item">

                <div class="stat-value-large">
                  {{ dashboard()!.groups_count }}
                </div>

                <div class="stat-label">
                  Grupos totales
                </div>

              </div>


              <div class="stat-item">

                <div class="stat-value-large">
                  {{ dashboard()!.trips_count }}
                </div>

                <div class="stat-label">
                  Viajes totales
                </div>

              </div>


              <div class="stat-item">

                <div class="stat-value-large">
                  {{ dashboard()!.active_trips_count }}
                </div>

                <div class="stat-label">
                  Viajes activos
                </div>

              </div>


              <div class="stat-item">

                <div class="stat-value-large">
                  {{ completedTrips() }}
                </div>

                <div class="stat-label">
                  Viajes finalizados
                </div>

              </div>

            </div>

          </div>


          <div class="card">

            <div class="card-header">

              <h3>
                Actividad de la plataforma
              </h3>

            </div>


            <div class="stat-grid">

              <div class="stat-item">

                <div class="stat-value-large">
                  {{ dashboard()!.expenses_count }}
                </div>

                <div class="stat-label">
                  Gastos registrados
                </div>

              </div>


              <div class="stat-item">

                <div class="stat-value-large">
                  {{ dashboard()!.reservations_count }}
                </div>

                <div class="stat-label">
                  Reservas
                </div>

              </div>


              <div class="stat-item">

                <div class="stat-value-large">
                  {{ dashboard()!.polls_count }}
                </div>

                <div class="stat-label">
                  Votaciones creadas
                </div>

              </div>


              <div class="stat-item">

                <div class="stat-value-large">
                  {{
                    formatMoney(
                      dashboard()!.total_expenses
                    )
                  }}
                </div>

                <div class="stat-label">
                  Volumen total de gastos
                </div>

              </div>

            </div>

          </div>

        </div>


        <div class="grid grid-cols-2">

          <div class="card">

            <div class="card-header">

              <h3>
                Usuarios recientes
              </h3>

              <a
                routerLink="/admin/usuarios"
                class="link-see-all"
              >
                Ver todos →
              </a>

            </div>


            @if (recentUsers().length > 0) {

              <div class="user-table">

                <div class="table-header">
                  <span>Usuario</span>
                  <span>Rol</span>
                  <span>Estado</span>
                  <span>Registrado</span>
                </div>


                @for (
                  user of recentUsers();
                  track user.id
                ) {

                  <div class="table-row">

                    <div class="user-cell">

                      <div
                        class="avatar avatar-sm"
                        [style.background]="
                          getAvatarColor(user)
                        "
                      >
                        {{ getInitials(user) }}
                      </div>


                      <div class="user-info">

                        <div class="user-name">
                          {{ user.full_name }}
                        </div>

                        <div class="user-email">
                          {{ user.email }}
                        </div>

                      </div>

                    </div>


                    <span
                      class="badge"
                      [ngClass]="
                        roleBadgeClass(
                          user.role
                        )
                      "
                    >
                      {{ roleLabel(user.role) }}
                    </span>


                    <span
                      class="status-badge"
                      [class.suspended]="
                        user.status ===
                        'SUSPENDED'
                      "
                    >
                      {{
                        user.status ===
                        'SUSPENDED'
                          ? 'Suspendido'
                          : 'Activo'
                      }}
                    </span>


                    <span class="text-muted">
                      {{
                        formatRelativeTime(
                          user.created_at
                        )
                      }}
                    </span>

                  </div>

                }

              </div>

            } @else {

              <div class="empty-state">
                No hay usuarios para mostrar.
              </div>

            }

          </div>


          <div class="card">

            <div class="card-header">

              <h3>
                Grupos recientes
              </h3>

              <a
                routerLink="/admin/grupos"
                class="link-see-all"
              >
                Ver todos →
              </a>

            </div>


            @if (recentGroups().length > 0) {

              <div class="group-table">

                <div class="table-header">
                  <span>Grupo</span>
                  <span>Miembros</span>
                  <span>Viajes</span>
                  <span>Creado</span>
                </div>


                @for (
                  group of recentGroups();
                  track group.id
                ) {

                  <div class="table-row">

                    <div class="group-cell">

                      <div
                        class="group-color"
                        [style.background]="
                          getGroupColor(
                            group.id
                          )
                        "
                      ></div>


                      <div class="group-info">

                        <div class="group-name">
                          {{ group.name }}
                        </div>

                        <div class="group-desc">
                          {{
                            group.description
                            || 'Sin descripción'
                          }}
                        </div>

                      </div>

                    </div>


                    <div class="text-center">
                      {{ group.members_count }}
                    </div>


                    <div class="text-center">
                      {{ group.trips_count }}
                    </div>


                    <div class="text-muted">
                      {{
                        formatRelativeTime(
                          group.created_at
                        )
                      }}
                    </div>

                  </div>

                }

              </div>

            } @else {

              <div class="empty-state">
                No hay grupos para mostrar.
              </div>

            }

          </div>

        </div>

      }

    </div>
  `,

  styles: [`
    .admin-page {
      max-width: 1200px;
    }


    .kpi-row {
      margin-bottom: 22px;
    }


    .kpi {
      display: flex;
      align-items: center;
      gap: 14px;
    }


    .kpi-icon {
      width: 46px;
      height: 46px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }


    .kpi-value {
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--text-primary);
    }


    .kpi-label {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }


    .main-row {
      align-items: start;
    }


    .stat-grid {
      display: grid;
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
      gap: 16px;
    }


    .stat-item {
      padding: 16px;
      background: var(--bg-panel-2);
      border-radius: 10px;
      text-align: center;
    }


    .stat-value-large {
      font-size: 1.8rem;
      font-weight: 800;
      color: var(--text-primary);
    }


    .stat-label {
      margin-top: 4px;
      font-size: 0.75rem;
      color: var(--text-muted);
    }


    .user-table,
    .group-table {
      display: flex;
      flex-direction: column;
    }


    .table-header {
      display: grid;
      gap: 12px;
      padding: 10px 0;
      border-bottom:
        1px solid var(--border-soft);
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }


    .table-row {
      display: grid;
      gap: 12px;
      align-items: center;
      padding: 12px 0;
      border-bottom:
        1px solid var(--border-soft);
      font-size: 0.8rem;
    }


    .user-table .table-header,
    .user-table .table-row {
      grid-template-columns:
        minmax(0, 2fr)
        minmax(90px, 0.8fr)
        minmax(90px, 0.8fr)
        minmax(90px, 0.9fr);
    }


    .group-table .table-header,
    .group-table .table-row {
      grid-template-columns:
        minmax(0, 2fr)
        minmax(80px, 0.7fr)
        minmax(70px, 0.7fr)
        minmax(90px, 0.9fr);
    }


    .table-row:last-child {
      border-bottom: none;
    }


    .user-cell,
    .group-cell {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }


    .user-info,
    .group-info {
      min-width: 0;
    }


    .group-color {
      width: 10px;
      height: 10px;
      flex-shrink: 0;
      border-radius: 50%;
    }


    .user-name,
    .group-name {
      overflow: hidden;
      font-size: 0.85rem;
      font-weight: 600;
      white-space: nowrap;
      text-overflow: ellipsis;
      color: var(--text-primary);
    }


    .user-email,
    .group-desc {
      overflow: hidden;
      font-size: 0.7rem;
      white-space: nowrap;
      text-overflow: ellipsis;
      color: var(--text-muted);
    }


    .status-badge {
      width: fit-content;
      padding: 2px 8px;
      border-radius: 999px;
      background:
        rgba(34,197,94,0.15);
      color: #4ade80;
      font-size: 0.7rem;
      font-weight: 600;
    }


    .status-badge.suspended {
      background:
        rgba(239,68,68,0.15);
      color: #f87171;
    }


    .text-center {
      text-align: center;
    }


    .text-muted {
      font-size: 0.75rem;
      color: var(--text-muted);
    }


    .link-see-all {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--accent-cyan);
    }


    .header-links {
      display: flex;
      gap: 12px;
    }


    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      margin-bottom: 16px;
      border:
        1px solid rgba(239,68,68,0.3);
      border-radius: 10px;
      background:
        rgba(239,68,68,0.12);
      color: #f87171;
      font-size: 0.85rem;
    }


    .error-banner span {
      flex: 1;
    }


    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 48px 24px;
      color: var(--text-muted);
    }


    .empty-state {
      padding: 24px 10px;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.82rem;
    }


    .animate-spin {
      animation: spin 1s linear infinite;
    }


    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }


    @media (max-width: 900px) {
      .grid-cols-4 {
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
      }

      .grid-cols-2 {
        grid-template-columns: 1fr;
      }
    }


    @media (max-width: 700px) {
      .user-table .table-header,
      .user-table .table-row,
      .group-table .table-header,
      .group-table .table-row {
        grid-template-columns:
          minmax(0, 2fr)
          minmax(80px, 1fr)
          minmax(80px, 1fr);
      }


      .user-table
        .table-header
        > :nth-child(4),
      .user-table
        .table-row
        > :nth-child(4),
      .group-table
        .table-header
        > :nth-child(4),
      .group-table
        .table-row
        > :nth-child(4) {
        display: none;
      }
    }


    @media (max-width: 600px) {
      .stat-grid,
      .grid-cols-4 {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminDashboardComponent
  implements OnInit
{
  private readonly adminApi =
    inject(AdminApiService);


  readonly dashboard =
    signal<AdminDashboardRead | null>(
      null
    );

  readonly recentUsers =
    signal<UserRead[]>([]);

  readonly recentGroups =
    signal<GroupRead[]>([]);

  readonly loading =
    signal(false);

  readonly error =
    signal<string | null>(null);


  readonly adminCount =
    computed(() => {
      const byRole =
        this.dashboard()
          ?.users_by_role;

      return (
        (byRole?.ADMIN ?? 0)
        +
        (byRole?.SUPER_ADMIN ?? 0)
      );
    });


  readonly completedTrips =
    computed(() => {
      return (
        this.dashboard()
          ?.trips_by_status
          ?.COMPLETED
        ?? 0
      );
    });


  readonly formatMoney =
    formatMoney;

  readonly formatRelativeTime =
    formatRelativeTime;


  ngOnInit(): void {
    this.reload();
  }


  reload(): void {
    this.loadDashboard();
    this.loadRecentUsers();
    this.loadRecentGroups();
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
            'Error al cargar el panel de administración.'
          );

          this.loading.set(false);
        }

      });
  }


  loadRecentUsers(): void {
    this.adminApi
      .users({
        page: 1,
        page_size: 5
      })
      .subscribe({

        next: page => {
          this.recentUsers.set(
            page.items
          );
        },

        error: () => {
          this.recentUsers.set([]);
        }

      });
  }


  loadRecentGroups(): void {
    this.adminApi
      .groups({
        page: 1,
        page_size: 5
      })
      .subscribe({

        next: page => {
          this.recentGroups.set(
            page.items
          );
        },

        error: () => {
          this.recentGroups.set([]);
        }

      });
  }


  getAvatarColor(
    user: UserRead
  ): string {
    const colors = [
      '#3b82f6',
      '#22c55e',
      '#a855f7',
      '#f97316',
      '#ec4899',
      '#06b6d4'
    ];

    return colors[
      Math.abs(user.id)
      % colors.length
    ];
  }


  getGroupColor(
    groupId: number
  ): string {
    const colors = [
      '#3b82f6',
      '#8b5cf6',
      '#10b981',
      '#f59e0b',
      '#ef4444',
      '#06b6d4'
    ];

    return colors[
      Math.abs(groupId)
      % colors.length
    ];
  }


  getInitials(
    user: UserRead
  ): string {
    return user.full_name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(
        part =>
          part[0]
            ?.toUpperCase()
      )
      .join('');
  }


  roleBadgeClass(
    role: GlobalRole
  ): string {
    switch (role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return 'badge-purple';

      case 'SUPPORT':
        return 'badge-green';

      case 'USER':
        return 'badge-blue';
    }
  }


  roleLabel(
    role: GlobalRole
  ): string {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Administrador';

      case 'ADMIN':
        return 'Administrador';

      case 'SUPPORT':
        return 'Soporte';

      case 'USER':
        return 'Usuario';
    }
  }
}