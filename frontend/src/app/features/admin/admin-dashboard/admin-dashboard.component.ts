import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { MockDataService } from '../../../data-access/mock/mock-data.service';
import { User, UserRole } from '../../../shared/models/domain.models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="admin-page">
      <div class="page-head">
        <div>
          <h1 class="page-title">Panel de Administración</h1>
          <p class="page-subtitle">Visión general de la plataforma KIVA</p>
        </div>
        <a routerLink="/dashboard" class="btn btn-outline">
          <svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>
            <path d="M9 22V12h6v10"/>
          </svg>
          Espacio de usuario
        </a>
      </div>

      <div class="grid grid-cols-4 kpi-row">
        <div class="card kpi">
          <div class="kpi-icon" style="background: rgba(59,130,246,0.15); color:#60a5fa;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <div class="kpi-value">{{ totalUsers() }}</div>
            <div class="kpi-label">Usuarios totales</div>
          </div>
        </div>
        <div class="card kpi">
          <div class="kpi-icon" style="background: rgba(34,197,94,0.15); color:#4ade80;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
              <path d="M22 11v-2a4 4 0 0 0-4-4h-1a4 4 0 0 0-4 4v2"/>
            </svg>
          </div>
          <div>
            <div class="kpi-value">{{ activeUsers() }}</div>
            <div class="kpi-label">Usuarios activos (30d)</div>
          </div>
        </div>
        <div class="card kpi">
          <div class="kpi-icon" style="background: rgba(239,68,68,0.15); color:#f87171;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
              <line x1="9" x2="15" y1="7" y2="7" stroke-width="2"/>
            </svg>
          </div>
          <div>
            <div class="kpi-value">{{ suspendedUsers() }}</div>
            <div class="kpi-label">Usuarios suspendidos</div>
          </div>
        </div>
        <div class="card kpi">
          <div class="kpi-icon" style="background: rgba(168,85,247,0.15); color:#c084fc;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
            </svg>
          </div>
          <div>
            <div class="kpi-value">{{ adminUsers() }}</div>
            <div class="kpi-label">Administradores</div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 main-row">
        <div class="card">
          <div class="card-header">
            <h3>Grupos y viajes</h3>
          </div>
          <div class="stat-grid">
            <div class="stat-item">
              <div class="stat-value-large">{{ totalGroups() }}</div>
              <div class="stat-label">Grupos totales</div>
            </div>
            <div class="stat-item">
              <div class="stat-value-large">{{ totalTrips() }}</div>
              <div class="stat-label">Viajes totales</div>
            </div>
            <div class="stat-item">
              <div class="stat-value-large">{{ activeTrips() }}</div>
              <div class="stat-label">Viajes activos</div>
            </div>
            <div class="stat-item">
              <div class="stat-value-large">{{ completedTrips() }}</div>
              <div class="stat-label">Viajes finalizados</div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Actividad de la plataforma</h3>
          </div>
          <div class="stat-grid">
            <div class="stat-item">
              <div class="stat-value-large">{{ totalExpenses() }}</div>
              <div class="stat-label">Gastos registrados</div>
            </div>
            <div class="stat-item">
              <div class="stat-value-large">{{ totalReservations() }}</div>
              <div class="stat-label">Reservas simuladas</div>
            </div>
            <div class="stat-item">
              <div class="stat-value-large">{{ totalPolls() }}</div>
              <div class="stat-label">Votaciones creadas</div>
            </div>
            <div class="stat-item">
              <div class="stat-value-large">{{ formatMoney(totalVolume()) }}</div>
              <div class="stat-label">Volumen total gastos</div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2">
        <div class="card">
          <div class="card-header">
            <h3>Usuarios recientes</h3>
            <a routerLink="/admin/usuarios" class="link-see-all">Ver todos →</a>
          </div>
          <div class="user-table">
            <div class="table-header">
              <span>Usuario</span>
              <span>Rol</span>
              <span>Estado</span>
              <span>Último acceso</span>
            </div>
            @for (user of recentUsers(); track user.id) {
              <div class="table-row">
                <div class="user-cell">
                  <div class="avatar avatar-sm" [style.background]="user.avatarColor">{{ user.initials }}</div>
                  <div>
                    <div class="user-name">{{ user.displayName }}</div>
                    <div class="user-email">{{ user.email }}</div>
                  </div>
                </div>
                <span class="badge" [ngClass]="roleBadgeClass(user.role)">{{ roleLabel(user.role) }}</span>
                <span class="status-badge" [class.active]="user.id !== '1'">{{ user.id === '1' ? 'Suspendido' : 'Activo' }}</span>
                <span class="text-muted">{{ formatRelativeTime(user.updatedAt) }}</span>
              </div>
            }
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Grupos recientes</h3>
            <a routerLink="/admin/grupos" class="link-see-all">Ver todos →</a>
          </div>
          <div class="group-table">
            <div class="table-header">
              <span>Grupo</span>
              <span>Propietario</span>
              <span>Miembros</span>
              <span>Viajes</span>
              <span>Creado</span>
            </div>
            @for (group of recentGroups(); track group.id) {
              <div class="table-row">
                <div class="group-cell">
                  <div class="group-color" [style.background]="group.colorTheme"></div>
                  <div>
                    <div class="group-name">{{ group.name }}</div>
                    <div class="group-desc">{{ group.description }}</div>
                  </div>
                </div>
                <div class="owner-name">{{ getUserName(group.ownerId) }}</div>
                <div class="text-center">{{ getGroupMemberCount(group.id) }}</div>
                <div class="text-center">{{ getGroupTripCount(group.id) }}</div>
                <div class="text-muted">{{ formatRelativeTime(group.createdAt) }}</div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-page {
      max-width: 1200px;
    }

    .kpi-row { margin-bottom: 22px; }

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
      font-size: 1.3rem;
      flex-shrink: 0;
    }

    .kpi-value { font-size: 1.3rem; font-weight: 700; }
    .kpi-label { font-size: 0.8rem; color: var(--text-secondary); }

    .main-row { align-items: start; }

    .stat-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    @media (max-width: 600px) {
      .stat-grid { grid-template-columns: 1fr; }
    }

    .stat-item {
      padding: 16px;
      background: var(--bg-panel-2);
      border-radius: 10px;
      text-align: center;
    }

    .stat-value-large { font-size: 1.8rem; font-weight: 800; color: var(--text-primary); }
    .stat-label { font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; }

    .user-table, .group-table {
      display: flex;
      flex-direction: column;
    }

    .table-header {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
      gap: 12px;
      padding: 10px 0;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-soft);
    }

    @media (max-width: 700px) {
      .table-header { grid-template-columns: 2fr 1fr 1fr; }
      .table-header > :nth-child(4) { display: none; }
    }

    .table-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
      gap: 12px;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid var(--border-soft);
      font-size: 0.8rem;
    }

    .table-row:last-child { border-bottom: none; }

    @media (max-width: 700px) {
      .table-row { grid-template-columns: 2fr 1fr 1fr; }
      .table-row > :nth-child(4) { display: none; }
    }

    .user-cell, .group-cell, .owner-name {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .group-color {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .user-name, .group-name { font-weight: 600; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-email, .group-desc { font-size: 0.7rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .status-badge {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 999px;
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
    }

    .status-badge.active { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
    .status-badge:not(.active) { background: rgba(239, 68, 68, 0.15); color: #f87171; }

    .text-center { text-align: center; }
    .text-muted { font-size: 0.75rem; color: var(--text-muted); }

    .link-see-all {
      font-size: 0.8rem;
      color: var(--accent-cyan);
      font-weight: 600;
    }
  `]
})
export class AdminDashboardComponent {
  private authService = inject(AuthService);
  private mockData = inject(MockDataService);

  totalUsers = computed(() => this.mockData.users().length);
  activeUsers = computed(() => this.mockData.users().filter(u => u.id !== '1').length);
  suspendedUsers = computed(() => this.mockData.users().filter(u => u.id === '1').length);
  adminUsers = computed(() => this.mockData.users().filter(u => u.role === 'ADMIN').length);

  totalGroups = computed(() => this.mockData.groups().length);
  totalTrips = computed(() => this.mockData.trips().length);
  activeTrips = computed(() => this.mockData.trips().filter(t => t.status === 'PLANNING' || t.status === 'CONFIRMED' || t.status === 'IN_PROGRESS').length);
  completedTrips = computed(() => this.mockData.trips().filter(t => t.status === 'COMPLETED').length);

  totalExpenses = computed(() => this.mockData.expenses().length);
  totalReservations = computed(() => this.mockData.reservations().length);
  totalPolls = computed(() => this.mockData.polls().length);
  totalVolume = computed(() => this.mockData.expenses().reduce((sum, e) => sum + e.amount, 0));

  recentUsers = computed(() => [...this.mockData.users()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5));
  recentGroups = computed(() => [...this.mockData.groups()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5));

  getUserName(userId: string): string {
    return this.mockData.getUser(userId as any)?.displayName || 'Desconocido';
  }

  getGroupMemberCount(groupId: string): number {
    return this.mockData.getGroupMembers(groupId as any).length;
  }

  getGroupTripCount(groupId: string): number {
    return this.mockData.trips().filter(t => t.groupId === groupId).length;
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

  roleBadgeClass(role: UserRole): string {
    switch (role) {
      case 'ADMIN': return 'badge-purple';
      case 'USER': return 'badge-blue';
      default: return 'badge-gray';
    }
  }

  roleLabel(role: UserRole): string {
    switch (role) {
      case 'ADMIN': return 'Administrador';
      case 'USER': return 'Usuario';
      default: return 'Usuario';
    }
  }
}