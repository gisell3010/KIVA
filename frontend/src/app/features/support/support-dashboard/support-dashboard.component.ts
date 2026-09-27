import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MockDataService } from '../../../data-access/mock/mock-data.service';
import { AuthService } from '../../../core/auth/auth.service';

interface MockTicket {
  id: string;
  subject: string;
  requesterId: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  updatedAt: string;
}

const MOCK_TICKETS: MockTicket[] = [
  { id: 'T-1042', subject: 'No puedo crear un grupo', requesterId: '4', status: 'OPEN', priority: 'HIGH', createdAt: '2026-09-20T10:00:00Z', updatedAt: '2026-09-22T14:30:00Z' },
  { id: 'T-1041', subject: 'Error al subir foto de perfil', requesterId: '5', status: 'IN_PROGRESS', priority: 'MEDIUM', createdAt: '2026-09-19T15:00:00Z', updatedAt: '2026-09-21T09:00:00Z' },
  { id: 'T-1040', subject: 'Solicitud de exportación de datos', requesterId: '6', status: 'OPEN', priority: 'LOW', createdAt: '2026-09-18T11:00:00Z', updatedAt: '2026-09-18T11:00:00Z' },
  { id: 'T-1039', subject: 'Votación no carga en móvil', requesterId: '7', status: 'RESOLVED', priority: 'MEDIUM', createdAt: '2026-09-17T08:00:00Z', updatedAt: '2026-09-19T16:45:00Z' },
  { id: 'T-1038', subject: 'No recibo notificaciones de invitación', requesterId: '8', status: 'OPEN', priority: 'HIGH', createdAt: '2026-09-16T13:20:00Z', updatedAt: '2026-09-20T10:10:00Z' },
  { id: 'T-1037', subject: 'Problema con el cálculo de gastos', requesterId: '9', status: 'RESOLVED', priority: 'HIGH', createdAt: '2026-09-15T09:00:00Z', updatedAt: '2026-09-17T12:00:00Z' },
];

@Component({
  selector: 'app-support-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="admin-page">
      <div class="page-head">
        <div>
          <h1 class="page-title">Panel de Soporte</h1>
          <p class="page-subtitle">Resumen de tickets y actividad de soporte</p>
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
          <div class="kpi-icon" style="background: rgba(239,68,68,0.15); color:#f87171;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
              <line x1="4" x2="4" y1="22" y2="15"/>
            </svg>
          </div>
          <div>
            <div class="kpi-value">{{ openTickets() }}</div>
            <div class="kpi-label">Tickets abiertos</div>
          </div>
        </div>
        <div class="card kpi">
          <div class="kpi-icon" style="background: rgba(249,115,22,0.15); color:#fb923c;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div>
            <div class="kpi-value">{{ inProgressTickets() }}</div>
            <div class="kpi-label">En progreso</div>
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
            <div class="kpi-value">{{ resolvedTickets() }}</div>
            <div class="kpi-label">Resueltos</div>
          </div>
        </div>
        <div class="card kpi">
          <div class="kpi-icon" style="background: rgba(59,130,246,0.15); color:#60a5fa;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <div class="kpi-value">{{ totalUsers() }}</div>
            <div class="kpi-label">Usuarios en plataforma</div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2">
        <div class="card">
          <div class="card-header">
            <h3>Tickets recientes</h3>
            <a routerLink="/soporte/tickets" class="link-see-all">Ver todos →</a>
          </div>
          <div class="ticket-list">
            @for (ticket of recentTickets(); track ticket.id) {
              <div class="ticket-row">
                <div class="ticket-info">
                  <span class="ticket-id">{{ ticket.id }}</span>
                  <span class="ticket-subject">{{ ticket.subject }}</span>
                </div>
                <span class="status-badge" [ngClass]="statusClass(ticket.status)">{{ statusLabel(ticket.status) }}</span>
                <span class="priority-badge" [ngClass]="priorityClass(ticket.priority)">{{ priorityLabel(ticket.priority) }}</span>
              </div>
            }
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Accesos rápidos</h3>
          </div>
          <div class="quick-links">
            <a routerLink="/soporte/tickets" class="quick-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                <line x1="4" x2="4" y1="22" y2="15"/>
              </svg>
              Gestionar tickets
            </a>
            <a routerLink="/soporte/usuarios" class="quick-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Consultar usuarios
            </a>
            <a routerLink="/admin" class="quick-link" *ngIf="authService.isAdmin()">
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

    .ticket-list {
      display: flex;
      flex-direction: column;
    }

    .ticket-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid var(--border-soft);
      font-size: 0.85rem;
    }

    .ticket-row:last-child { border-bottom: none; }

    .ticket-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      flex: 1;
    }

    .ticket-id {
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--text-muted);
      font-variant-numeric: tabular-nums;
    }

    .ticket-subject {
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
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
      border-color: var(--accent-blue);
      background: rgba(59,130,246,0.08);
    }

    .link-see-all {
      font-size: 0.8rem;
      color: var(--accent-cyan);
      font-weight: 600;
    }
  `]
})
export class SupportDashboardComponent {
  protected authService = inject(AuthService);
  private mockData = inject(MockDataService);

  tickets = MOCK_TICKETS;

  totalUsers = computed(() => this.mockData.users().length);
  openTickets = computed(() => this.tickets.filter(t => t.status === 'OPEN').length);
  inProgressTickets = computed(() => this.tickets.filter(t => t.status === 'IN_PROGRESS').length);
  resolvedTickets = computed(() => this.tickets.filter(t => t.status === 'RESOLVED').length);
  recentTickets = computed(() =>
    [...this.tickets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5)
  );

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
