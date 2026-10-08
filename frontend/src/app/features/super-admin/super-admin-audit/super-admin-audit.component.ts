import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuditApiService } from '../../../data-access/api/audit-api.service';
import { AuditLogRead } from '../../../shared/models/domain.models';
import { formatDateTime } from '../../../shared/utils/date.utils';

interface AuditOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-super-admin-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="admin-page">
      <div class="page-head">
        <div>
          <h1 class="page-title">Registro de auditoría</h1>
          <p class="page-subtitle">
            Historial de operaciones relevantes realizadas en KIVA.
          </p>
        </div>

        <a routerLink="/super-admin" class="btn btn-outline">
          Volver al panel
        </a>
      </div>

      <div class="card audit-card">
        <div class="filter-heading">
          <div>
            <h2>Filtrar registros</h2>
            <p>
              Selecciona una acción o recurso y busca usuarios por nombre completo
              o nombre de usuario.
            </p>
          </div>
        </div>

        <div class="filters-bar">
          <div class="filter-field">
            <label for="audit-action">Acción</label>
            <select
              id="audit-action"
              [(ngModel)]="actionFilter"
              (change)="applyFilters()"
            >
              <option value="">Todas las acciones</option>
              @for (option of actionOptions; track option.value) {
                <option [value]="option.value">{{ option.label }}</option>
              }
            </select>
          </div>

          <div class="filter-field">
            <label for="audit-entity">Recurso</label>
            <select
              id="audit-entity"
              [(ngModel)]="entityFilter"
              (change)="applyFilters()"
            >
              <option value="">Todos los recursos</option>
              @for (option of entityOptions; track option.value) {
                <option [value]="option.value">{{ option.label }}</option>
              }
            </select>
          </div>

          <div class="filter-field filter-user">
            <label for="audit-user">Usuario</label>
            <input
              id="audit-user"
              type="search"
              placeholder="Ej. Alexa Ruiz o alexa_ruiz"
              [(ngModel)]="actorFilter"
              (keyup.enter)="applyFilters()"
            />
          </div>

          <div class="filter-actions">
            <button
              type="button"
              class="btn btn-primary"
              (click)="applyFilters()"
            >
              Aplicar filtros
            </button>

            <button
              type="button"
              class="btn btn-ghost"
              [disabled]="!hasActiveFilters()"
              (click)="clearFilters()"
            >
              Limpiar
            </button>
          </div>
        </div>

        @if (loading()) {
          <div class="status-message">Cargando auditoría...</div>
        }

        @if (error()) {
          <p class="error-text" role="alert">{{ error() }}</p>
        }

        @if (!loading() && entries().length > 0) {
          <div class="table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Registro</th>
                  <th>Usuario</th>
                  <th>Acción</th>
                  <th>Recurso afectado</th>
                  <th>Fecha</th>
                </tr>
              </thead>

              <tbody>
                @for (entry of entries(); track entry.id) {
                  <tr>
                    <td>
                      <span class="record-id">#{{ entry.id }}</span>
                    </td>

                    <td>
                      <div class="actor-name">{{ entry.actor_name ?? 'Sistema' }}</div>
                      @if (entry.actor_role) {
                        <span class="actor-role">{{ roleLabel(entry.actor_role) }}</span>
                      }
                    </td>

                    <td>
                      <div class="action-label">{{ actionLabel(entry.action) }}</div>
                      <code class="technical-code">{{ entry.action }}</code>
                    </td>

                    <td>
                      <div class="entity-label">{{ entityLabel(entry.entity) }}</div>
                      @if (entry.entity) {
                        <span class="entity-reference">
                          <code>{{ entry.entity }}</code>
                          @if (entry.entity_id) {
                            <span> · #{{ entry.entity_id }}</span>
                          }
                        </span>
                      }
                    </td>

                    <td class="date-cell">
                      {{ formatDateTime(entry.created_at) }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        @if (!loading() && entries().length === 0) {
          <div class="empty-state">
            <strong>No se encontraron registros</strong>
            <p>Prueba con otros filtros o limpia la búsqueda actual.</p>
          </div>
        }

        <div class="pagination">
          <span>
            Mostrando {{ entries().length }} de {{ totalEntries() }} registros
          </span>

          <div class="pagination-controls">
            <button
              type="button"
              class="btn btn-outline btn-sm"
              [disabled]="currentPage() <= 1 || loading()"
              (click)="prevPage()"
            >
              Anterior
            </button>

            <span>Página {{ currentPage() }} de {{ totalPages() }}</span>

            <button
              type="button"
              class="btn btn-outline btn-sm"
              [disabled]="currentPage() >= totalPages() || loading()"
              (click)="nextPage()"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-page {
      max-width: 1240px;
    }

    .audit-card {
      padding: 24px;
    }

    .filter-heading {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 18px;
    }

    .filter-heading h2 {
      margin: 0 0 5px;
      font-size: 1rem;
      color: var(--text-primary);
    }

    .filter-heading p {
      margin: 0;
      color: var(--text-muted);
      font-size: 0.8rem;
      line-height: 1.5;
    }

    .filters-bar {
      display: grid;
      grid-template-columns: minmax(180px, 0.8fr) minmax(200px, 0.9fr) minmax(240px, 1.2fr) auto;
      gap: 12px;
      align-items: end;
      padding: 16px;
      margin-bottom: 22px;
      border: 1px solid var(--border-soft);
      border-radius: 14px;
      background: var(--bg-panel-2);
    }

    .filter-field {
      min-width: 0;
    }

    .filter-field label {
      margin-bottom: 7px;
      font-size: 0.75rem;
    }

    .filter-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .filter-actions .btn {
      white-space: nowrap;
    }

    .table-container {
      overflow-x: auto;
      border: 1px solid var(--border-soft);
      border-radius: 14px;
    }

    .admin-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.84rem;
    }

    .admin-table th {
      padding: 11px 14px;
      color: var(--text-muted);
      background: var(--bg-panel-2);
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .admin-table td {
      padding: 14px;
      text-align: left;
      vertical-align: middle;
      border-top: 1px solid var(--border-soft);
    }

    .admin-table tbody tr {
      transition: background-color var(--transition-fast);
    }

    .admin-table tbody tr:hover {
      background: var(--bg-hover);
    }

    .record-id {
      display: inline-flex;
      align-items: center;
      min-width: 48px;
      padding: 5px 9px;
      border-radius: 999px;
      background: var(--bg-panel-2);
      color: var(--text-secondary);
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 0.74rem;
      font-weight: 600;
    }

    .actor-name,
    .action-label,
    .entity-label {
      color: var(--text-primary);
      font-weight: 600;
    }

    .actor-role,
    .entity-reference,
    .technical-code {
      display: block;
      margin-top: 4px;
      color: var(--text-muted);
      font-size: 0.72rem;
    }

    .technical-code,
    .entity-reference code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    .date-cell {
      min-width: 150px;
      white-space: nowrap;
      color: var(--text-secondary);
    }

    .status-message {
      padding: 16px 0;
      color: var(--text-secondary);
    }

    .empty-state {
      padding: 44px 18px;
      text-align: center;
      color: var(--text-secondary);
    }

    .empty-state strong {
      display: block;
      margin-bottom: 6px;
      color: var(--text-primary);
    }

    .empty-state p {
      margin: 0;
      color: var(--text-muted);
    }

    .pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: 18px;
      color: var(--text-secondary);
      font-size: 0.8rem;
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .error-text {
      color: var(--accent-red);
    }

    @media (max-width: 980px) {
      .filters-bar {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .filter-actions {
        grid-column: 1 / -1;
        justify-content: flex-end;
      }
    }

    @media (max-width: 640px) {
      .audit-card {
        padding: 16px;
      }

      .filters-bar {
        grid-template-columns: 1fr;
      }

      .filter-actions {
        grid-column: auto;
        flex-direction: column;
      }

      .filter-actions .btn {
        width: 100%;
        justify-content: center;
      }

      .pagination {
        flex-direction: column;
        align-items: stretch;
      }

      .pagination-controls {
        justify-content: space-between;
      }
    }
  `],
})
export class SuperAdminAuditComponent implements OnInit {
  private readonly auditApi = inject(AuditApiService);

  readonly entries = signal<AuditLogRead[]>([]);
  readonly totalEntries = signal(0);
  readonly currentPage = signal(1);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly pageSize = 10;

  actionFilter = '';
  entityFilter = '';
  actorFilter = '';

  readonly actionOptions: AuditOption[] = [
    { value: 'AUTH_LOGIN', label: 'Inicio de sesión' },
    { value: 'AUTH_LOGOUT_ALL', label: 'Cierre de todas las sesiones' },
    { value: 'AUTH_SESSION_REVOKE', label: 'Sesión revocada' },
    { value: 'AUTH_REFRESH_REUSE', label: 'Reutilización de sesión detectada' },
    { value: 'SUPPORT_REPORT_CREATED', label: 'Reporte de soporte creado' },
    { value: 'SUPPORT_REPORT_ASSIGNED', label: 'Reporte de soporte asignado' },
    { value: 'SUPPORT_REPORT_UPDATED', label: 'Reporte de soporte actualizado' },
    { value: 'SUPPORT_REPORT_ESCALATED', label: 'Reporte de soporte escalado' },
    { value: 'USER_REGISTER', label: 'Registro de usuario' },
    { value: 'USER_UPDATE', label: 'Actualización de perfil' },
    { value: 'USER_EMAIL_CHANGE', label: 'Cambio de correo' },
    { value: 'USER_PASSWORD_CHANGE', label: 'Cambio de contraseña' },
    { value: 'USER_IMAGE_UPDATE', label: 'Actualización de foto de perfil' },
    { value: 'USER_IMAGE_DELETE', label: 'Eliminación de foto de perfil' },
    { value: 'USER_ADMIN_UPDATE', label: 'Actualización administrativa de usuario' },
    { value: 'GROUP_CREATE', label: 'Creación de grupo' },
    { value: 'GROUP_UPDATE', label: 'Actualización de grupo' },
    { value: 'GROUP_MEMBER_ADD', label: 'Miembro añadido al grupo' },
    { value: 'GROUP_MEMBER_REMOVE', label: 'Miembro retirado del grupo' },
    { value: 'GROUP_OWNER_CHANGE', label: 'Transferencia de responsabilidad del grupo' },
    { value: 'GROUP_DELETE', label: 'Eliminación de grupo' },
    { value: 'TRIP_CREATE', label: 'Creación de viaje' },
    { value: 'TRIP_UPDATE', label: 'Actualización de viaje' },
    { value: 'TRIP_MEMBER_ADD', label: 'Participante añadido al viaje' },
    { value: 'TRIP_MEMBER_UPDATE', label: 'Cambio de rol en el viaje' },
    { value: 'TRIP_MEMBER_REMOVE', label: 'Participante retirado del viaje' },
    { value: 'TRIP_OWNER_CHANGE', label: 'Transferencia de responsabilidad del viaje' },
    { value: 'TRIP_DELETE', label: 'Eliminación de viaje' },
    { value: 'DESTINATION_CREATE', label: 'Propuesta de destino' },
    { value: 'DESTINATION_UPDATE', label: 'Actualización de destino' },
    { value: 'DESTINATION_SELECT', label: 'Selección de destino' },
    { value: 'DESTINATION_DELETE', label: 'Eliminación de destino' },
    { value: 'DESTINATION_PHOTO_UPLOAD', label: 'Carga de foto de destino' },
    { value: 'DESTINATION_PHOTO_DELETE', label: 'Eliminación de foto de destino' },
    { value: 'DESTINATION_PHOTOS_REORDER', label: 'Orden de fotos de destino actualizado' },
    { value: 'ACTIVITY_CREATE', label: 'Creación de actividad' },
    { value: 'ACTIVITY_UPDATE', label: 'Actualización de actividad' },
    { value: 'ACTIVITY_DELETE', label: 'Eliminación de actividad' },
    { value: 'EXPENSE_CREATE', label: 'Registro de gasto' },
    { value: 'EXPENSE_UPDATE', label: 'Actualización de gasto' },
    { value: 'EXPENSE_DELETE', label: 'Eliminación de gasto' },
    { value: 'POLL_CREATE', label: 'Creación de votación' },
    { value: 'POLL_UPDATE', label: 'Actualización de votación' },
    { value: 'POLL_CLOSE', label: 'Cierre de votación' },
    { value: 'POLL_DELETE', label: 'Eliminación de votación' },
    { value: 'POLL_OPTION_CREATE', label: 'Creación de opción de votación' },
    { value: 'POLL_OPTION_UPDATE', label: 'Actualización de opción de votación' },
    { value: 'POLL_OPTION_DELETE', label: 'Eliminación de opción de votación' },
    { value: 'POLL_VOTE_UPDATE', label: 'Actualización de voto' },
    { value: 'RESERVATION_CREATE', label: 'Creación de reserva' },
    { value: 'RESERVATION_UPDATE', label: 'Actualización de reserva' },
    { value: 'RESERVATION_DELETE', label: 'Eliminación de reserva' },
  ];

  readonly entityOptions: AuditOption[] = [
    { value: 'auth.users', label: 'Usuarios' },
    { value: 'auth.auth_sessions', label: 'Sesiones' },
    { value: 'app.travel_groups', label: 'Grupos' },
    { value: 'app.group_members', label: 'Miembros de grupos' },
    { value: 'app.trips', label: 'Viajes' },
    { value: 'app.trip_members', label: 'Participantes de viajes' },
    { value: 'app.destinations', label: 'Destinos' },
    { value: 'app.destination_photos', label: 'Fotos de destinos' },
    { value: 'app.activities', label: 'Actividades' },
    { value: 'app.expenses', label: 'Gastos' },
    { value: 'app.polls', label: 'Votaciones' },
    { value: 'app.poll_options', label: 'Opciones de votación' },
    { value: 'app.reservations', label: 'Reservas' },
  ];

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalEntries() / this.pageSize)),
  );

  readonly formatDateTime = formatDateTime;

  ngOnInit(): void {
    this.loadAudit();
  }

  loadAudit(): void {
    this.loading.set(true);
    this.error.set(null);

    this.auditApi
      .list({
        page: this.currentPage(),
        page_size: this.pageSize,
        action: this.actionFilter || undefined,
        entity: this.entityFilter || undefined,
        q: this.actorFilter.trim() || undefined,
      })
      .subscribe({
        next: page => {
          this.entries.set(page.items);
          this.totalEntries.set(page.total);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudo cargar el registro de auditoría.');
          this.loading.set(false);
        },
      });
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadAudit();
  }

  clearFilters(): void {
    this.actionFilter = '';
    this.entityFilter = '';
    this.actorFilter = '';
    this.currentPage.set(1);
    this.loadAudit();
  }

  hasActiveFilters(): boolean {
    return Boolean(
      this.actionFilter
      || this.entityFilter
      || this.actorFilter.trim(),
    );
  }

  prevPage(): void {
    if (this.currentPage() <= 1) return;
    this.currentPage.update(page => page - 1);
    this.loadAudit();
  }

  nextPage(): void {
    if (this.currentPage() >= this.totalPages()) return;
    this.currentPage.update(page => page + 1);
    this.loadAudit();
  }

  roleLabel(role: string | null): string {
    return ({
      SUPER_ADMIN: 'Superadministrador',
      ADMIN: 'Administrador',
      SUPPORT: 'Soporte',
      USER: 'Usuario',
    } as Record<string, string>)[role ?? ''] ?? '';
  }

  actionLabel(action: string): string {
    return this.actionOptions.find(option => option.value === action)?.label
      ?? action.replaceAll('_', ' ');
  }

  entityLabel(entity: string | null): string {
    if (!entity) return 'Sin recurso asociado';
    return this.entityOptions.find(option => option.value === entity)?.label
      ?? entity;
  }
}
