import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface ServiceStatus {
  name: string;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  latencyMs: number;
  uptimePercent: number;
  lastCheck: string;
}

const MOCK_SERVICES: ServiceStatus[] = [
  { name: 'API Principal', status: 'HEALTHY', latencyMs: 42, uptimePercent: 99.98, lastCheck: '2026-09-24T10:00:00Z' },
  { name: 'Base de datos', status: 'HEALTHY', latencyMs: 12, uptimePercent: 99.99, lastCheck: '2026-09-24T10:00:00Z' },
  { name: 'Servicio de autenticación', status: 'HEALTHY', latencyMs: 35, uptimePercent: 99.97, lastCheck: '2026-09-24T10:00:00Z' },
  { name: 'Cola de notificaciones', status: 'DEGRADED', latencyMs: 320, uptimePercent: 99.5, lastCheck: '2026-09-24T10:00:00Z' },
  { name: 'Almacenamiento de archivos', status: 'HEALTHY', latencyMs: 88, uptimePercent: 99.95, lastCheck: '2026-09-24T10:00:00Z' },
  { name: 'Servicio de email transaccional', status: 'HEALTHY', latencyMs: 150, uptimePercent: 99.9, lastCheck: '2026-09-24T10:00:00Z' },
];

@Component({
  selector: 'app-super-admin-health',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="admin-page">
      <div class="page-head">
        <div>
          <h1 class="page-title">Salud del Sistema</h1>
          <p class="page-subtitle">Estado de servicios y métricas de plataforma</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-outline" (click)="refresh()" type="button" [disabled]="refreshing()">
            @if (refreshing()) {
              <svg class="ui-icon animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              Actualizando...
            } @else {
              <svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
                <polyline points="21 3 21 9 15 9"/>
              </svg>
              Actualizar
            }
          </button>
          <a routerLink="/super-admin" class="btn btn-outline">
            <svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Volver al panel
          </a>
        </div>
      </div>

      <div class="grid grid-cols-4 kpi-row">
        <div class="card kpi">
          <div class="kpi-icon" [style.background]="overallStatus() === 'HEALTHY' ? 'rgba(34,197,94,0.15)' : 'rgba(249,115,22,0.15)'" [style.color]="overallStatus() === 'HEALTHY' ? '#4ade80' : '#fb923c'">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <div>
            <div class="kpi-value">{{ overallStatusLabel() }}</div>
            <div class="kpi-label">Estado general</div>
          </div>
        </div>
        <div class="card kpi">
          <div class="kpi-icon" style="background: rgba(59,130,246,0.15); color:#60a5fa;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div>
            <div class="kpi-value">{{ avgLatency() }} ms</div>
            <div class="kpi-label">Latencia promedio</div>
          </div>
        </div>
        <div class="card kpi">
          <div class="kpi-icon" style="background: rgba(34,197,94,0.15); color:#4ade80;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div>
            <div class="kpi-value">{{ avgUptime() }}%</div>
            <div class="kpi-label">Uptime promedio (30d)</div>
          </div>
        </div>
        <div class="card kpi">
          <div class="kpi-icon" style="background: rgba(249,115,22,0.15); color:#fb923c;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" x2="12" y1="9" y2="13"/>
              <line x1="12" x2="12.01" y1="17" y2="17"/>
            </svg>
          </div>
          <div>
            <div class="kpi-value">{{ degradedCount() }}</div>
            <div class="kpi-label">Servicios degradados</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Servicios</h3>
          <span class="last-check">Última verificación: {{ formatDateTime(services()[0].lastCheck) }}</span>
        </div>
        <div class="table-container" role="region" tabindex="0" aria-label="Estado de servicios">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Estado</th>
                <th>Latencia</th>
                <th>Uptime (30d)</th>
                <th>Última verificación</th>
              </tr>
            </thead>
            <tbody>
              @for (service of services(); track service.name) {
                <tr>
                  <td class="service-name">{{ service.name }}</td>
                  <td>
                    <span class="status-badge" [ngClass]="statusClass(service.status)">{{ statusLabel(service.status) }}</span>
                  </td>
                  <td class="metric-cell" [class.warn]="service.latencyMs > 200">{{ service.latencyMs }} ms</td>
                  <td class="metric-cell">{{ service.uptimePercent }}%</td>
                  <td>{{ formatDateTime(service.lastCheck) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-page { max-width: 1100px; }
    .kpi-row { margin-bottom: 22px; }

    .page-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
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

    .kpi-value { font-size: 1.15rem; font-weight: 700; }
    .kpi-label { font-size: 0.8rem; color: var(--text-secondary); }

    .last-check {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .table-container { overflow-x: auto; }

    .admin-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }

    .admin-table th {
      text-align: left;
      color: var(--text-muted);
      font-weight: 600;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      padding: 12px 10px;
      border-bottom: 2px solid var(--border-soft);
      white-space: nowrap;
    }

    .admin-table td {
      padding: 14px 10px;
      border-bottom: 1px solid var(--border-soft);
      color: var(--text-secondary);
      vertical-align: middle;
    }

    .admin-table tr:last-child td { border-bottom: none; }
    .admin-table tr:hover td { background: var(--bg-hover); }

    .service-name {
      font-weight: 600;
      color: var(--text-primary);
    }

    .metric-cell {
      font-variant-numeric: tabular-nums;
      font-weight: 600;
      color: var(--text-primary);
    }

    .metric-cell.warn { color: #fb923c; }

    .status-badge {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 999px;
      white-space: nowrap;
    }

    .status-badge.healthy { background: rgba(34,197,94,0.15); color: #4ade80; }
    .status-badge.degraded { background: rgba(249,115,22,0.15); color: #fb923c; }
    .status-badge.down { background: rgba(239,68,68,0.15); color: #f87171; }

    .animate-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 700px) {
      .admin-table th:nth-child(5), .admin-table td:nth-child(5) { display: none; }
    }
  `]
})
export class SuperAdminHealthComponent {
  services = signal<ServiceStatus[]>(MOCK_SERVICES);
  refreshing = signal(false);

  overallStatus = computed<'HEALTHY' | 'DEGRADED' | 'DOWN'>(() => {
    const list = this.services();
    if (list.some(s => s.status === 'DOWN')) return 'DOWN';
    if (list.some(s => s.status === 'DEGRADED')) return 'DEGRADED';
    return 'HEALTHY';
  });

  avgLatency = computed(() => {
    const list = this.services();
    if (!list.length) return 0;
    return Math.round(list.reduce((sum, s) => sum + s.latencyMs, 0) / list.length);
  });

  avgUptime = computed(() => {
    const list = this.services();
    if (!list.length) return '100';
    const avg = list.reduce((sum, s) => sum + s.uptimePercent, 0) / list.length;
    return avg.toFixed(2);
  });

  degradedCount = computed(() =>
    this.services().filter(s => s.status !== 'HEALTHY').length
  );

  overallStatusLabel(): string {
    switch (this.overallStatus()) {
      case 'HEALTHY': return 'Saludable';
      case 'DEGRADED': return 'Degradado';
      case 'DOWN': return 'Caído';
      default: return '—';
    }
  }

  refresh(): void {
    this.refreshing.set(true);
    setTimeout(() => {
      this.services.update(list =>
        list.map(s => ({
          ...s,
          latencyMs: Math.max(8, s.latencyMs + Math.round((Math.random() - 0.5) * 30)),
          lastCheck: new Date().toISOString(),
        }))
      );
      this.refreshing.set(false);
    }, 600);
  }

  statusLabel(status: ServiceStatus['status']): string {
    switch (status) {
      case 'HEALTHY': return 'Saludable';
      case 'DEGRADED': return 'Degradado';
      case 'DOWN': return 'Caído';
      default: return status;
    }
  }

  statusClass(status: ServiceStatus['status']): string {
    switch (status) {
      case 'HEALTHY': return 'healthy';
      case 'DEGRADED': return 'degraded';
      case 'DOWN': return 'down';
      default: return '';
    }
  }

  formatDateTime(isoString?: string): string {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
