import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MockDataService } from '../../../data-access/mock/mock-data.service';

interface AuditEntry {
  id: string;
  actorId: string;
  action: string;
  targetType: 'USER' | 'GROUP' | 'TRIP' | 'SYSTEM' | 'AUTH';
  targetId?: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
  createdAt: string;
}

const MOCK_AUDIT: AuditEntry[] = [
  { id: 'A-9012', actorId: '1', action: 'Actualizó configuración global (sessionTimeoutMinutes)', targetType: 'SYSTEM', severity: 'INFO', createdAt: '2026-09-22T16:40:00Z' },
  { id: 'A-9011', actorId: '2', action: 'Cambió rol de usuario de USER a ADMIN', targetType: 'USER', targetId: '3', severity: 'WARN', createdAt: '2026-09-22T11:15:00Z' },
  { id: 'A-9010', actorId: '3', action: 'Resolvió ticket T-1037', targetType: 'SYSTEM', severity: 'INFO', createdAt: '2026-09-21T09:30:00Z' },
  { id: 'A-9009', actorId: '1', action: 'Habilitó modo mantenimiento', targetType: 'SYSTEM', severity: 'CRITICAL', createdAt: '2026-09-20T22:00:00Z' },
  { id: 'A-9008', actorId: '1', action: 'Deshabilitó modo mantenimiento', targetType: 'SYSTEM', severity: 'CRITICAL', createdAt: '2026-09-20T23:10:00Z' },
  { id: 'A-9007', actorId: '2', action: 'Eliminó grupo de prueba', targetType: 'GROUP', targetId: '99', severity: 'WARN', createdAt: '2026-09-19T14:20:00Z' },
  { id: 'A-9006', actorId: '1', action: 'Creó cuenta de administrador admin@kiva.app', targetType: 'USER', targetId: '2', severity: 'WARN', createdAt: '2026-09-18T10:00:00Z' },
  { id: 'A-9005', actorId: '4', action: 'Inicio de sesión correcto', targetType: 'AUTH', severity: 'INFO', createdAt: '2026-09-18T08:12:00Z' },
  { id: 'A-9004', actorId: '5', action: '5 intentos de inicio de sesión fallidos', targetType: 'AUTH', severity: 'WARN', createdAt: '2026-09-17T21:45:00Z' },
  { id: 'A-9003', actorId: '1', action: 'Exportó datos de auditoría', targetType: 'SYSTEM', severity: 'INFO', createdAt: '2026-09-16T12:00:00Z' },
  { id: 'A-9002', actorId: '2', action: 'Suspendió usuario sebastian@kiva.app', targetType: 'USER', targetId: '9', severity: 'WARN', createdAt: '2026-09-15T17:30:00Z' },
  { id: 'A-9001', actorId: '1', action: 'Desactivó registro de nuevos usuarios', targetType: 'SYSTEM', severity: 'CRITICAL', createdAt: '2026-09-14T09:00:00Z' },
];

@Component({
  selector: 'app-super-admin-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="admin-page">
      <div class="page-head">
        <div>
          <h1 class="page-title">Registro de Auditoría</h1>
          <p class="page-subtitle">Historal de acciones administrativas críticas</p>
        </div>
        <a routerLink="/super-admin" class="btn btn-outline">
          <svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Volver al panel
        </a>
      </div>

      <div class="card">
        <div class="filters-bar">
          <div class="search-box">
            <svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <circle cx="11" cy="11" r="7"/>
              <path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar por acción, ID..."
              [(ngModel)]="searchQuery"
              (input)="onSearch()"
              class="filter-input"
              aria-label="Buscar en auditoría"
            />
          </div>

          <div class="filter-group">
            <select [(ngModel)]="severityFilter" (change)="onFilterChange()" class="filter-select" aria-label="Filtrar por severidad">
              <option value="">Todas las severidades</option>
              <option value="CRITICAL">Crítica</option>
              <option value="WARN">Advertencia</option>
              <option value="INFO">Info</option>
            </select>

            <select [(ngModel)]="targetFilter" (change)="onFilterChange()" class="filter-select" aria-label="Filtrar por tipo de destino">
              <option value="">Todos los tipos</option>
              <option value="USER">Usuario</option>
              <option value="GROUP">Grupo</option>
              <option value="TRIP">Viaje</option>
              <option value="SYSTEM">Sistema</option>
              <option value="AUTH">Autenticación</option>
            </select>
          </div>
        </div>

        <div class="table-container" role="region" tabindex="0" aria-label="Registro de auditoría">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Actor</th>
                <th>Acción</th>
                <th>Tipo</th>
                <th>Severidad</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              @for (entry of filteredEntries(); track entry.id) {
                <tr>
                  <td class="audit-id-cell">{{ entry.id }}</td>
                  <td>
                    <div class="user-cell">
                      <div class="avatar avatar-sm" [style.background]="getActor(entry.actorId)?.avatarColor">{{ getActor(entry.actorId)?.initials }}</div>
                      <span class="actor-name">{{ getActor(entry.actorId)?.displayName || 'Sistema' }}</span>
                    </div>
                  </td>
                  <td class="action-cell">{{ entry.action }}</td>
                  <td>
                    <span class="type-badge">{{ targetTypeLabel(entry.targetType) }}</span>
                  </td>
                  <td>
                    <span class="severity-badge" [ngClass]="severityClass(entry.severity)">{{ severityLabel(entry.severity) }}</span>
                  </td>
                  <td>{{ formatDateTime(entry.createdAt) }}</td>
                </tr>
              }
            </tbody>
          </table>

          @if (filteredEntries().length === 0) {
            <div class="empty-state">
              <svg class="ui-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <p>No se encontraron eventos con los filtros actuales</p>
            </div>
          }
        </div>

        <div class="pagination">
          <span class="pagination-info">Mostrando {{ filteredEntries().length }} de {{ totalEntries() }} eventos</span>
          <div class="pagination-controls">
            <button class="btn btn-outline btn-sm" [disabled]="currentPage() === 1" (click)="prevPage()" type="button">Anterior</button>
            <button class="btn btn-outline btn-sm" [disabled]="currentPage() === totalPages()" (click)="nextPage()" type="button">Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-page { max-width: 1200px; }

    .filters-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border-soft);
      margin-bottom: 16px;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--bg-panel-2);
      border: 1px solid var(--border-soft);
      border-radius: 10px;
      padding: 8px 14px;
      flex: 1;
      min-width: 250px;
    }

    .search-box .ui-icon { opacity: 0.6; }

    .search-box input {
      background: transparent;
      border: none;
      padding: 0;
      width: 100%;
      color: var(--text-primary);
      font-size: 0.9rem;
    }

    .filter-group {
      display: flex;
      gap: 12px;
    }

    .filter-select {
      min-width: 160px;
      padding: 8px 36px 8px 12px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
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
      padding: 12px 10px;
      border-bottom: 1px solid var(--border-soft);
      color: var(--text-secondary);
      vertical-align: middle;
    }

    .admin-table tr:last-child td { border-bottom: none; }
    .admin-table tr:hover td { background: var(--bg-hover); }

    .audit-id-cell {
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: var(--text-primary);
      white-space: nowrap;
    }

    .user-cell { display: flex; align-items: center; gap: 8px; }
    .actor-name { font-weight: 600; color: var(--text-primary); white-space: nowrap; }

    .action-cell {
      max-width: 360px;
      min-width: 0;
      white-space: normal;
      line-height: 1.4;
    }

    .type-badge {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 999px;
      background: var(--bg-panel-2);
      color: var(--text-secondary);
      white-space: nowrap;
    }

    .severity-badge {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 999px;
      white-space: nowrap;
    }

    .severity-badge.info { background: rgba(59,130,246,0.15); color: #60a5fa; }
    .severity-badge.warn { background: rgba(249,115,22,0.15); color: #fb923c; }
    .severity-badge.critical { background: rgba(239,68,68,0.15); color: #f87171; }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 48px 24px;
      color: var(--text-muted);
      text-align: center;
    }

    .empty-state .ui-icon { opacity: 0.3; }

    .pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 16px;
      border-top: 1px solid var(--border-soft);
      margin-top: 16px;
    }

    .pagination-info { font-size: 0.8rem; color: var(--text-muted); }
    .pagination-controls { display: flex; gap: 8px; }

    @media (max-width: 900px) {
      .admin-table th:nth-child(4), .admin-table td:nth-child(4) { display: none; }
      .filter-group { flex-wrap: wrap; }
    }

    @media (max-width: 700px) {
      .admin-table th:nth-child(6), .admin-table td:nth-child(6) { display: none; }
    }
  `]
})
export class SuperAdminAuditComponent {
  private mockData = inject(MockDataService);

  entries = MOCK_AUDIT;

  searchQuery = '';
  severityFilter = '';
  targetFilter = '';
  currentPage = signal(1);
  pageSize = 8;

  totalEntries = computed(() => this.entries.length);

  filteredEntries = computed(() => {
    let list = this.entries;

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(e =>
        e.action.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q)
      );
    }

    if (this.severityFilter) {
      list = list.filter(e => e.severity === this.severityFilter);
    }

    if (this.targetFilter) {
      list = list.filter(e => e.targetType === this.targetFilter);
    }

    const start = (this.currentPage() - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.totalEntries() / this.pageSize));

  onSearch(): void {
    this.currentPage.set(1);
  }

  onFilterChange(): void {
    this.currentPage.set(1);
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  getActor(actorId: string) {
    return this.mockData.getUser(actorId);
  }

  formatDateTime(isoString: string): string {
    return new Date(isoString).toLocaleString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  severityLabel(severity: AuditEntry['severity']): string {
    switch (severity) {
      case 'INFO': return 'Info';
      case 'WARN': return 'Advertencia';
      case 'CRITICAL': return 'Crítica';
      default: return severity;
    }
  }

  severityClass(severity: AuditEntry['severity']): string {
    switch (severity) {
      case 'INFO': return 'info';
      case 'WARN': return 'warn';
      case 'CRITICAL': return 'critical';
      default: return '';
    }
  }

  targetTypeLabel(type: AuditEntry['targetType']): string {
    switch (type) {
      case 'USER': return 'Usuario';
      case 'GROUP': return 'Grupo';
      case 'TRIP': return 'Viaje';
      case 'SYSTEM': return 'Sistema';
      case 'AUTH': return 'Auth';
      default: return type;
    }
  }
}
