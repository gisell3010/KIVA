import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MockDataService } from '../../../data-access/mock/mock-data.service';

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="admin-page">
      <div class="page-head">
        <div>
          <h1 class="page-title">Super Administración</h1>
          <p class="page-subtitle">Control total de la plataforma KIVA</p>
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
            <div class="kpi-label">Usuarios</div>
          </div>
        </div>
        <div class="card kpi">
          <div class="kpi-icon" style="background: rgba(168,85,247,0.15); color:#c084fc;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <circle cx="9" cy="8" r="3"/>
              <path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 4v2"/>
            </svg>
          </div>
          <div>
            <div class="kpi-value">{{ totalGroups() }}</div>
            <div class="kpi-label">Grupos</div>
          </div>
        </div>
        <div class="card kpi">
          <div class="kpi-icon" style="background: rgba(34,197,94,0.15); color:#4ade80;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h6z"/>
            </svg>
          </div>
          <div>
            <div class="kpi-value">{{ totalTrips() }}</div>
            <div class="kpi-label">Viajes</div>
          </div>
        </div>
        <div class="card kpi">
          <div class="kpi-icon" style="background: rgba(239,68,68,0.15); color:#f87171;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2"/>
            </svg>
          </div>
          <div>
            <div class="kpi-value">{{ staffCount() }}</div>
            <div class="kpi-label">Staff (admin + soporte)</div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2">
        <div class="card">
          <div class="card-header">
            <h3>Distribución de roles</h3>
          </div>
          <div class="role-bars">
            @for (row of roleDistribution(); track row.role) {
              <div class="role-bar-row">
                <span class="role-bar-label">{{ row.label }}</span>
                <div class="role-bar-track">
                  <div class="role-bar-fill" [style.width.%]="row.percent" [style.background]="row.color"></div>
                </div>
                <span class="role-bar-count">{{ row.count }}</span>
              </div>
            }
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Accesos rápidos</h3>
          </div>
          <div class="quick-links">
            <a routerLink="/super-admin/configuracion" class="quick-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
              </svg>
              Configuración del sistema
            </a>
            <a routerLink="/super-admin/auditoria" class="quick-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" x2="8" y1="13" y2="13"/>
                <line x1="16" x2="8" y1="17" y2="17"/>
              </svg>
              Registro de auditoría
            </a>
            <a routerLink="/super-admin/salud" class="quick-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              Salud del sistema
            </a>
            <a routerLink="/admin" class="quick-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2"/>
              </svg>
              Panel de administración
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-page { max-width: 1200px; }
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
      flex-shrink: 0;
    }

    .kpi-value { font-size: 1.3rem; font-weight: 700; }
    .kpi-label { font-size: 0.8rem; color: var(--text-secondary); }

    .role-bars {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .role-bar-row {
      display: grid;
      grid-template-columns: 140px 1fr 40px;
      align-items: center;
      gap: 12px;
    }

    .role-bar-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
      white-space: nowrap;
    }

    .role-bar-track {
      height: 10px;
      background: var(--bg-panel-2);
      border-radius: 999px;
      overflow: hidden;
    }

    .role-bar-fill {
      height: 100%;
      border-radius: 999px;
      transition: width var(--transition-normal);
    }

    .role-bar-count {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-primary);
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    .quick-links {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .quick-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: var(--bg-panel-2);
      border: 1px solid var(--border-soft);
      border-radius: 10px;
      color: var(--text-primary);
      font-size: 0.9rem;
      font-weight: 500;
      transition: border-color var(--transition-fast), background var(--transition-fast);
    }

    .quick-link:hover {
      border-color: var(--accent-purple);
      background: rgba(168,85,247,0.08);
    }

    @media (max-width: 600px) {
      .role-bar-row { grid-template-columns: 100px 1fr 32px; }
    }
  `]
})
export class SuperAdminDashboardComponent {
  private mockData = inject(MockDataService);

  totalUsers = computed(() => this.mockData.users().length);
  totalGroups = computed(() => this.mockData.groups().length);
  totalTrips = computed(() => this.mockData.trips().length);
  staffCount = computed(() =>
    this.mockData.users().filter(u => u.role === 'ADMIN' || u.role === 'SUPPORT' || u.role === 'SUPER_ADMIN').length
  );

  roleDistribution = computed(() => {
    const users = this.mockData.users();
    const total = users.length || 1;
    const defs = [
      { role: 'SUPER_ADMIN' as const, label: 'Super Admin', color: '#7c3aed' },
      { role: 'ADMIN' as const, label: 'Administrador', color: '#a855f7' },
      { role: 'SUPPORT' as const, label: 'Soporte', color: '#22c55e' },
      { role: 'USER' as const, label: 'Usuario', color: '#3b82f6' },
    ];
    return defs.map(d => {
      const count = users.filter(u => u.role === d.role).length;
      return { ...d, count, percent: Math.round((count / total) * 100) };
    });
  });
}
