import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MockDataService } from '../../../data-access/mock/mock-data.service';

interface MockTicket {
  id: string;
  subject: string;
  description: string;
  requesterId: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  updatedAt: string;
}

const MOCK_TICKETS: MockTicket[] = [
  { id: 'T-1042', subject: 'No puedo crear un grupo', description: 'El botón "Crear grupo" no responde tras completar el formulario.', requesterId: '4', status: 'OPEN', priority: 'HIGH', createdAt: '2026-09-20T10:00:00Z', updatedAt: '2026-09-22T14:30:00Z' },
  { id: 'T-1041', subject: 'Error al subir foto de perfil', description: 'Aparece error de formato al intentar JPG de 2MB.', requesterId: '5', status: 'IN_PROGRESS', priority: 'MEDIUM', createdAt: '2026-09-19T15:00:00Z', updatedAt: '2026-09-21T09:00:00Z' },
  { id: 'T-1040', subject: 'Solicitud de exportación de datos', description: 'Usuario solicita exportación completa de sus datos (RGPD).', requesterId: '6', status: 'OPEN', priority: 'LOW', createdAt: '2026-09-18T11:00:00Z', updatedAt: '2026-09-18T11:00:00Z' },
  { id: 'T-1039', subject: 'Votación no carga en móvil', description: 'En iOS Safari la lista de opciones queda vacía.', requesterId: '7', status: 'RESOLVED', priority: 'MEDIUM', createdAt: '2026-09-17T08:00:00Z', updatedAt: '2026-09-19T16:45:00Z' },
  { id: 'T-1038', subject: 'No recibo notificaciones de invitación', description: 'Invitaciones a grupos no llegan al correo registrado.', requesterId: '8', status: 'OPEN', priority: 'HIGH', createdAt: '2026-09-16T13:20:00Z', updatedAt: '2026-09-20T10:10:00Z' },
  { id: 'T-1037', subject: 'Problema con el cálculo de gastos', description: 'El split de gastos no considera a un miembro nuevo.', requesterId: '9', status: 'RESOLVED', priority: 'HIGH', createdAt: '2026-09-15T09:00:00Z', updatedAt: '2026-09-17T12:00:00Z' },
  { id: 'T-1036', subject: 'Cómo cambio mi contraseña', description: 'Usuario necesita guía para restablecer contraseña.', requesterId: '4', status: 'RESOLVED', priority: 'LOW', createdAt: '2026-09-14T10:00:00Z', updatedAt: '2026-09-14T11:30:00Z' },
  { id: 'T-1035', subject: 'Reserva simulada no aparece', description: 'Reserva creada no se lista en la página de reservas.', requesterId: '5', status: 'IN_PROGRESS', priority: 'MEDIUM', createdAt: '2026-09-13T16:00:00Z', updatedAt: '2026-09-18T09:00:00Z' },
];

@Component({
  selector: 'app-support-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="admin-page">
      <div class="page-head">
        <div>
          <h1 class="page-title">Gestión de Tickets</h1>
          <p class="page-subtitle">Administra las solicitudes de soporte de los usuarios</p>
        </div>
        <a routerLink="/soporte" class="btn btn-outline">
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
              placeholder="Buscar por asunto, ID..."
              [(ngModel)]="searchQuery"
              (input)="onSearch()"
              class="filter-input"
              aria-label="Buscar tickets"
            />
          </div>

          <div class="filter-group">
            <select [(ngModel)]="statusFilter" (change)="onFilterChange()" class="filter-select" aria-label="Filtrar por estado">
              <option value="">Todos los estados</option>
              <option value="OPEN">Abierto</option>
              <option value="IN_PROGRESS">En progreso</option>
              <option value="RESOLVED">Resuelto</option>
            </select>

            <select [(ngModel)]="priorityFilter" (change)="onFilterChange()" class="filter-select" aria-label="Filtrar por prioridad">
              <option value="">Todas las prioridades</option>
              <option value="HIGH">Alta</option>
              <option value="MEDIUM">Media</option>
              <option value="LOW">Baja</option>
            </select>
          </div>
        </div>

        <div class="table-container" role="region" tabindex="0" aria-label="Lista de tickets">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Asunto</th>
                <th>Solicitante</th>
                <th>Estado</th>
                <th>Prioridad</th>
                <th>Creado</th>
                <th>Actualizado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (ticket of filteredTickets(); track ticket.id) {
                <tr>
                  <td class="ticket-id-cell">{{ ticket.id }}</td>
                  <td>
                    <div class="ticket-cell">
                      <div class="ticket-subject">{{ ticket.subject }}</div>
                      <div class="ticket-desc">{{ ticket.description }}</div>
                    </div>
                  </td>
                  <td>{{ getUserName(ticket.requesterId) }}</td>
                  <td>
                    <span class="status-badge" [ngClass]="statusClass(ticket.status)">{{ statusLabel(ticket.status) }}</span>
                  </td>
                  <td>
                    <span class="priority-badge" [ngClass]="priorityClass(ticket.priority)">{{ priorityLabel(ticket.priority) }}</span>
                  </td>
                  <td>{{ formatDate(ticket.createdAt) }}</td>
                  <td>{{ formatDate(ticket.updatedAt) }}</td>
                  <td>
                    <div class="action-buttons">
                      <button class="icon-btn" (click)="viewTicket(ticket)" aria-label="Ver detalle del ticket" type="button">
                        <svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      @if (ticket.status !== 'RESOLVED') {
                        <button class="icon-btn" (click)="advanceStatus(ticket)" [attr.aria-label]="ticket.status === 'OPEN' ? 'Marcar en progreso' : 'Marcar resuelto'" type="button">
                          <svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                          </svg>
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          @if (filteredTickets().length === 0) {
            <div class="empty-state">
              <svg class="ui-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                <line x1="4" x2="4" y1="22" y2="15"/>
              </svg>
              <p>No se encontraron tickets con los filtros actuales</p>
            </div>
          }
        </div>

        <div class="pagination">
          <span class="pagination-info">Mostrando {{ filteredTickets().length }} de {{ totalTickets() }} tickets</span>
          <div class="pagination-controls">
            <button class="btn btn-outline btn-sm" [disabled]="currentPage() === 1" (click)="prevPage()" type="button">Anterior</button>
            <button class="btn btn-outline btn-sm" [disabled]="currentPage() === totalPages()" (click)="nextPage()" type="button">Siguiente</button>
          </div>
        </div>
      </div>

      @if (selectedTicket()) {
        <div class="modal-overlay" (click)="closeDetail()">
          <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="ticket-detail-title" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 id="ticket-detail-title">{{ selectedTicket()?.id }} — {{ selectedTicket()?.subject }}</h3>
              <button class="icon-btn" (click)="closeDetail()" aria-label="Cerrar" type="button">
                <svg class="ui-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Solicitante</span>
                <span class="detail-value">{{ getUserName(selectedTicket()!.requesterId) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Estado</span>
                <span class="status-badge" [ngClass]="statusClass(selectedTicket()!.status)">{{ statusLabel(selectedTicket()!.status) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Prioridad</span>
                <span class="priority-badge" [ngClass]="priorityClass(selectedTicket()!.priority)">{{ priorityLabel(selectedTicket()!.priority) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Creado</span>
                <span class="detail-value">{{ formatDate(selectedTicket()!.createdAt) }}</span>
              </div>
            </div>
            <p class="detail-description">{{ selectedTicket()?.description }}</p>
            <div class="modal-actions">
              <button class="btn btn-ghost" (click)="closeDetail()">Cerrar</button>
              @if (selectedTicket()!.status !== 'RESOLVED') {
                <button class="btn btn-primary" (click)="advanceStatus(selectedTicket()!)">
                  {{ selectedTicket()!.status === 'OPEN' ? 'Tomar ticket' : 'Marcar resuelto' }}
                </button>
              }
            </div>
          </div>
        </div>
      }
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

    .ticket-id-cell {
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: var(--text-primary);
      white-space: nowrap;
    }

    .ticket-cell { max-width: 280px; min-width: 0; }
    .ticket-subject { font-weight: 600; color: var(--text-primary); }
    .ticket-desc {
      font-size: 0.72rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 2px;
    }

    .status-badge {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 999px;
      white-space: nowrap;
    }

    .status-badge.open { background: rgba(239,68,68,0.15); color: #f87171; }
    .status-badge.in-progress { background: rgba(249,115,22,0.15); color: #fb923c; }
    .status-badge.resolved { background: rgba(34,197,94,0.15); color: #4ade80; }

    .priority-badge {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 3px 6px;
      border-radius: 6px;
      white-space: nowrap;
    }

    .priority-badge.low { background: var(--bg-panel-2); color: var(--text-muted); }
    .priority-badge.medium { background: rgba(59,130,246,0.15); color: #60a5fa; }
    .priority-badge.high { background: rgba(239,68,68,0.15); color: #f87171; }

    .action-buttons { display: flex; gap: 4px; }

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

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px;
      background: var(--bg-panel-2);
      border-radius: 10px;
    }

    .detail-label {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-muted);
    }

    .detail-value {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .detail-description {
      font-size: 0.9rem;
      color: var(--text-secondary);
      line-height: 1.5;
      padding: 12px;
      background: var(--bg-panel-2);
      border-radius: 10px;
      margin-bottom: 16px;
    }

    @media (max-width: 900px) {
      .admin-table th:nth-child(7), .admin-table td:nth-child(7) { display: none; }
      .filter-group { flex-wrap: wrap; }
    }

    @media (max-width: 700px) {
      .admin-table th:nth-child(6), .admin-table td:nth-child(6) { display: none; }
      .detail-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class SupportTicketsComponent {
  private mockData = inject(MockDataService);

  tickets = signal<MockTicket[]>(MOCK_TICKETS);

  searchQuery = '';
  statusFilter = '';
  priorityFilter = '';
  currentPage = signal(1);
  pageSize = 8;
  selectedTicket = signal<MockTicket | null>(null);

  totalTickets = computed(() => this.tickets().length);

  filteredTickets = computed(() => {
    let list = this.tickets();

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(t =>
        t.subject.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    }

    if (this.statusFilter) {
      list = list.filter(t => t.status === this.statusFilter);
    }

    if (this.priorityFilter) {
      list = list.filter(t => t.priority === this.priorityFilter);
    }

    const start = (this.currentPage() - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.totalTickets() / this.pageSize));

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

  getUserName(userId: string): string {
    return this.mockData.getUser(userId)?.displayName || 'Desconocido';
  }

  viewTicket(ticket: MockTicket): void {
    this.selectedTicket.set(ticket);
  }

  closeDetail(): void {
    this.selectedTicket.set(null);
  }

  advanceStatus(ticket: MockTicket): void {
    this.tickets.update(list =>
      list.map(t => {
        if (t.id !== ticket.id) return t;
        const next = t.status === 'OPEN' ? 'IN_PROGRESS' : 'RESOLVED';
        return { ...t, status: next as MockTicket['status'], updatedAt: new Date().toISOString() };
      })
    );
    const updated = this.tickets().find(t => t.id === ticket.id);
    if (updated) {
      this.selectedTicket.set(updated);
    }
  }

  formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  statusLabel(status: MockTicket['status']): string {
    switch (status) {
      case 'OPEN': return 'Abierto';
      case 'IN_PROGRESS': return 'En progreso';
      case 'RESOLVED': return 'Resuelto';
      default: return status;
    }
  }

  statusClass(status: MockTicket['status']): string {
    switch (status) {
      case 'OPEN': return 'open';
      case 'IN_PROGRESS': return 'in-progress';
      case 'RESOLVED': return 'resolved';
      default: return '';
    }
  }

  priorityLabel(priority: MockTicket['priority']): string {
    switch (priority) {
      case 'LOW': return 'Baja';
      case 'MEDIUM': return 'Media';
      case 'HIGH': return 'Alta';
      default: return priority;
    }
  }

  priorityClass(priority: MockTicket['priority']): string {
    switch (priority) {
      case 'LOW': return 'low';
      case 'MEDIUM': return 'medium';
      case 'HIGH': return 'high';
      default: return '';
    }
  }
}
