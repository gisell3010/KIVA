import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MockDataService } from '../../../data-access/mock/mock-data.service';
import { User, TripStatus } from '../../../shared/models/domain.models';

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="admin-page">
      <div class="page-head">
        <div>
          <h1 class="page-title">Visión General de la Plataforma</h1>
          <p class="page-subtitle">Métricas agregadas y estado operativo</p>
        </div>
        <a routerLink="/admin" class="btn btn-outline">
          <svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Volver al panel
        </a>
      </div>

      <div class="overview-grid">
        <section class="card overview-section">
          <h2 class="overview-title">Distribución de Usuarios</h2>
          <div class="distribution-chart">
            <div class="dist-bar">
              <div class="dist-label">
                <span>Usuarios regulares</span>
                <span class="dist-value">{{ regularUsers() }}</span>
              </div>
              <div class="dist-track">
                <div class="dist-fill" [style.width.%]="regularUsersPercentage()" style="background: var(--accent-blue)"></div>
              </div>
            </div>
            <div class="dist-bar">
              <div class="dist-label">
                <span>Administradores</span>
                <span class="dist-value">{{ adminUsers() }}</span>
              </div>
              <div class="dist-track">
                <div class="dist-fill" [style.width.%]="adminUsersPercentage()" style="background: var(--accent-purple)"></div>
              </div>
            </div>
            <div class="dist-bar">
              <div class="dist-label">
                <span>Soporte</span>
                <span class="dist-value">{{ supportUsers() }}</span>
              </div>
              <div class="dist-track">
                <div class="dist-fill" [style.width.%]="supportUsersPercentage()" style="background: var(--accent-green)"></div>
              </div>
            </div>
            <div class="dist-bar">
              <div class="dist-label">
                <span>Usuarios activos (30d)</span>
                <span class="dist-value">{{ activeUsers() }}</span>
              </div>
              <div class="dist-track">
                <div class="dist-fill" [style.width.%]="activeUsersPercentage()" style="background: var(--accent-green)"></div>
              </div>
            </div>
            <div class="dist-bar">
              <div class="dist-label">
                <span>Usuarios suspendidos</span>
                <span class="dist-value">{{ suspendedUsers() }}</span>
              </div>
              <div class="dist-track">
                <div class="dist-fill" [style.width.%]="suspendedUsersPercentage()" style="background: var(--accent-red)"></div>
              </div>
            </div>
          </div>
        </section>

        <section class="card overview-section">
          <h2 class="overview-title">Estado de Viajes</h2>
          <div class="trip-status-grid">
            @for (status of tripStatuses(); track status.key) {
              <div class="status-card" [style.border-left-color]="status.color">
                <div class="status-header">
                  <span class="status-dot" [style.background]="status.color"></span>
                  <span class="status-label">{{ status.label }}</span>
                </div>
                <div class="status-count">{{ status.count }}</div>
                <div class="status-percent">{{ status.percentage }}% del total</div>
              </div>
            }
          </div>
        </section>

        <section class="card overview-section">
          <h2 class="overview-title">Actividad por Tipo</h2>
          <div class="activity-stats">
            <div class="activity-item">
              <div class="activity-icon" style="background: rgba(59,130,246,0.15); color: #60a5fa">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <div>
                <div class="activity-count">{{ totalExpenses() }}</div>
                <div class="activity-label">Gastos registrados</div>
              </div>
            </div>
            <div class="activity-item">
              <div class="activity-icon" style="background: rgba(34,211,238,0.15); color: #22d3ee">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                  <path d="M2 9.5V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2.5a2.5 2.5 0 0 0 0 5V17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2.5a2.5 2.5 0 0 0 0-5Z"/>
                </svg>
              </div>
              <div>
                <div class="activity-count">{{ totalReservations() }}</div>
                <div class="activity-label">Reservas simuladas</div>
              </div>
            </div>
            <div class="activity-item">
              <div class="activity-icon" style="background: rgba(168,85,247,0.15); color: #c084fc">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7.5 12 2.5 2.5L15.5 9"/>
                </svg>
              </div>
              <div>
                <div class="activity-count">{{ totalPolls() }}</div>
                <div class="activity-label">Votaciones creadas</div>
              </div>
            </div>
            <div class="activity-item">
              <div class="activity-icon" style="background: rgba(34,197,94,0.15); color: #4ade80">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>
                </svg>
              </div>
              <div>
                <div class="activity-count">{{ totalCalendarEvents() }}</div>
                <div class="activity-label">Eventos en calendario</div>
              </div>
            </div>
          </div>
        </section>

        <section class="card overview-section full-width">
          <h2 class="overview-title">Top Grupos por Actividad</h2>
          <div class="table-container">
            <table class="overview-table">
              <thead>
                <tr>
                  <th>Grupo</th>
                  <th>Propietario</th>
                  <th>Miembros</th>
                  <th>Viajes</th>
                  <th>Gastos</th>
                  <th>Volumen gastos</th>
                  <th>Última actividad</th>
                </tr>
              </thead>
              <tbody>
                @for (group of topGroups(); track group.id) {
                  <tr>
                    <td>
                      <div class="group-cell">
                        <div class="group-color" [style.background]="group.colorTheme"></div>
                        <span>{{ group.name }}</span>
                      </div>
                    </td>
                    <td>{{ getUserName(group.ownerId) }}</td>
                    <td class="text-center">{{ getMemberCount(group.id) }}</td>
                    <td class="text-center">{{ getTripCount(group.id) }}</td>
                    <td class="text-center">{{ getExpenseCount(group.id) }}</td>
                    <td>{{ formatMoney(getExpenseVolume(group.id)) }}</td>
                    <td>{{ getLastActivity(group.id) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>

        <section class="card overview-section full-width">
          <h2 class="overview-title">Salud de la Plataforma</h2>
          <div class="health-grid">
            <div class="health-item good">
              <div class="health-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
              </div>
              <div>
                <div class="health-title">API Respondiendo</div>
                <div class="health-desc">Todos los endpoints operativos</div>
              </div>
              <span class="health-badge ok">OK</span>
            </div>
            <div class="health-item good">
              <div class="health-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                  <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2"/>
                </svg>
              </div>
              <div>
                <div class="health-title">Base de Datos</div>
                <div class="health-desc">Conexión estable, sin errores</div>
              </div>
              <span class="health-badge ok">OK</span>
            </div>
            <div class="health-item warning">
              <div class="health-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                  <path d="M12 9v4M12 17h.01"/>
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                </svg>
              </div>
              <div>
                <div class="health-title">Almacenamiento</div>
                <div class="health-desc">78% de capacidad usada</div>
              </div>
              <span class="health-badge warn">Atención</span>
            </div>
            <div class="health-item good">
              <div class="health-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                  <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2"/>
                </svg>
              </div>
              <div>
                <div class="health-title">Autenticación</div>
                <div class="health-desc">JWT funcionando correctamente</div>
              </div>
              <span class="health-badge ok">OK</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .admin-page { max-width: 1200px; }

    .overview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 20px;
    }

    .full-width { grid-column: 1 / -1; }

    .overview-section { display: flex; flex-direction: column; gap: 16px; }

    .overview-title {
      font-size: 1rem;
      font-weight: 700;
      margin: 0;
    }

    .distribution-chart { display: flex; flex-direction: column; gap: 16px; }

    .dist-bar { display: flex; flex-direction: column; gap: 6px; }

    .dist-label {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
    }

    .dist-value { font-weight: 700; color: var(--text-primary); }

    .dist-track {
      height: 8px;
      background: var(--bg-panel-2);
      border-radius: 999px;
      overflow: hidden;
    }

    .dist-fill {
      height: 100%;
      border-radius: 999px;
      transition: width var(--transition-normal);
    }

    .trip-status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
    }

    .status-card {
      padding: 16px;
      background: var(--bg-panel-2);
      border-radius: 10px;
      border-left: 4px solid;
      text-align: center;
    }

    .status-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 8px;
    }

    .status-dot { width: 8px; height: 8px; border-radius: 50%; }

    .status-count { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); }
    .status-percent { font-size: 0.7rem; color: var(--text-muted); margin-top: 4px; }

    .activity-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: var(--bg-panel-2);
      border-radius: 10px;
    }

    .activity-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .activity-count { font-size: 1.25rem; font-weight: 800; color: var(--text-primary); }
    .activity-label { font-size: 0.75rem; color: var(--text-muted); }

    .table-container { overflow-x: auto; }

    .overview-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8rem;
    }

    .overview-table th {
      text-align: left;
      color: var(--text-muted);
      font-weight: 600;
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      padding: 10px;
      border-bottom: 1px solid var(--border-soft);
    }

    .overview-table td {
      padding: 12px 10px;
      border-bottom: 1px solid var(--border-soft);
      color: var(--text-secondary);
    }

    .group-cell { display: flex; align-items: center; gap: 8px; font-weight: 500; color: var(--text-primary); }
    .group-color { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

    .health-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }

    .health-item {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 16px;
      background: var(--bg-panel-2);
      border-radius: 10px;
    }

    .health-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .health-item.warning .health-icon {
      background: rgba(249, 115, 22, 0.15);
      color: #fb923c;
    }

    .health-title { font-weight: 600; font-size: 0.9rem; color: var(--text-primary); }
    .health-desc { font-size: 0.8rem; color: var(--text-muted); margin-top: 2px; }

    .health-badge {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 999px;
      flex-shrink: 0;
      margin-top: 4px;
    }

    .health-badge.ok { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
    .health-badge.warn { background: rgba(249, 115, 22, 0.15); color: #fb923c; }

    @media (max-width: 700px) {
      .overview-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminOverviewComponent {
  private mockData = inject(MockDataService);

  totalUsers = computed(() => this.mockData.users().length);
  adminUsers = computed(() => this.mockData.users().filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length);
  supportUsers = computed(() => this.mockData.users().filter(u => u.role === 'SUPPORT').length);
  regularUsers = computed(() => this.mockData.users().filter(u => u.role === 'USER').length);
  activeUsers = computed(() => this.mockData.users().filter(u => u.id !== '9').length);
  suspendedUsers = computed(() => this.mockData.users().filter(u => u.id === '9').length);

  regularUsersPercentage = computed(() => (this.regularUsers() / this.totalUsers()) * 100);
  adminUsersPercentage = computed(() => (this.adminUsers() / this.totalUsers()) * 100);
  supportUsersPercentage = computed(() => (this.supportUsers() / this.totalUsers()) * 100);
  activeUsersPercentage = computed(() => (this.activeUsers() / this.totalUsers()) * 100);
  suspendedUsersPercentage = computed(() => (this.suspendedUsers() / this.totalUsers()) * 100);

  tripStatuses = computed(() => {
    const trips = this.mockData.trips();
    const total = trips.length;
    const statuses: { key: TripStatus; label: string; color: string }[] = [
      { key: 'PLANNING', label: 'Planificando', color: '#f97316' },
      { key: 'CONFIRMED', label: 'Confirmado', color: '#3b82f6' },
      { key: 'IN_PROGRESS', label: 'En curso', color: '#22c55e' },
      { key: 'COMPLETED', label: 'Finalizado', color: '#94a3b8' },
    ];

    return statuses.map(s => ({
      ...s,
      count: trips.filter(t => t.status === s.key).length,
      percentage: total > 0 ? Math.round((trips.filter(t => t.status === s.key).length / total) * 100) : 0,
    }));
  });

  totalExpenses = computed(() => this.mockData.expenses().length);
  totalReservations = computed(() => this.mockData.reservations().length);
  totalPolls = computed(() => this.mockData.polls().length);
  totalCalendarEvents = computed(() => this.mockData.calendarEvents().length);

  topGroups = computed(() => {
    return [...this.mockData.groups()].sort((a, b) => {
      const aExpenses = this.getExpenseCount(a.id);
      const bExpenses = this.getExpenseCount(b.id);
      return bExpenses - aExpenses;
    }).slice(0, 10);
  });

  getUserName(userId: string): string {
    return this.mockData.getUser(userId as any)?.displayName || 'Desconocido';
  }

  getMemberCount(groupId: string): number {
    return this.mockData.getGroupMembers(groupId as any).length;
  }

  getTripCount(groupId: string): number {
    return this.mockData.trips().filter(t => t.groupId === groupId).length;
  }

  getExpenseCount(groupId: string): number {
    const trips = this.mockData.trips().filter(t => t.groupId === groupId);
    const tripIds = trips.map(t => t.id);
    return this.mockData.expenses().filter(e => tripIds.includes(e.tripId)).length;
  }

  getExpenseVolume(groupId: string): number {
    const trips = this.mockData.trips().filter(t => t.groupId === groupId);
    const tripIds = trips.map(t => t.id);
    return this.mockData.expenses().filter(e => tripIds.includes(e.tripId)).reduce((sum, e) => sum + e.amount, 0);
  }

  getLastActivity(groupId: string): string {
    const trips = this.mockData.trips().filter(t => t.groupId === groupId);
    const tripIds = trips.map(t => t.id);
    const expenses = this.mockData.expenses().filter(e => tripIds.includes(e.tripId));
    if (expenses.length === 0) return 'Sin actividad';
    const latest = expenses.reduce((max, e) => e.createdAt > max.createdAt ? e : max);
    return this.formatRelativeTime(latest.createdAt);
  }

  formatMoney(v: number): string {
    return v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  }

  formatRelativeTime(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} sem`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }
}