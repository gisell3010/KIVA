import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MockDataService } from '../../../data-access/mock/mock-data.service';
import { Trip, TripStatus, TripMember, UUID } from '../../../shared/models/domain.models';

@Component({
  selector: 'app-admin-trips',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="admin-page">
      <div class="page-head">
        <div>
          <h1 class="page-title">Gestión de Viajes</h1>
          <p class="page-subtitle">Administra todos los viajes de la plataforma</p>
        </div>
        <a routerLink="/admin" class="btn btn-outline">
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
              placeholder="Buscar por nombre, descripción..."
              [(ngModel)]="searchQuery"
              (input)="onSearch()"
              class="filter-input"
              aria-label="Buscar viajes"
            />
          </div>

          <div class="filter-group">
            <select [(ngModel)]="statusFilter" (change)="onFilterChange()" class="filter-select" aria-label="Filtrar por estado">
              <option value="">Todos los estados</option>
              <option value="PLANNING">Planificando</option>
              <option value="CONFIRMED">Confirmado</option>
              <option value="IN_PROGRESS">En curso</option>
              <option value="COMPLETED">Finalizado</option>
            </select>
          </div>
        </div>

        <div class="table-container" role="region" tabindex="0" aria-label="Lista de viajes">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Viaje</th>
                <th>Grupo</th>
                <th>Estado</th>
                <th>Fechas</th>
                <th>Miembros</th>
                <th>Destinos</th>
                <th>Presupuesto</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (trip of filteredTrips(); track trip.id) {
                <tr>
                  <td>
                    <div>
                      <div class="trip-name">{{ trip.name }}</div>
                      <div class="trip-desc">{{ trip.description }}</div>
                    </div>
                  </td>
                  <td>{{ getGroupName(trip.groupId) }}</td>
                  <td>
                    <span class="badge" [ngClass]="statusBadge(trip.status)">{{ statusLabel(trip.status) }}</span>
                  </td>
                  <td>
                    <div class="date-range">
                      <span>{{ formatDate(trip.startDate) }}</span>
                      <span class="date-separator">–</span>
                      <span>{{ formatDate(trip.endDate) }}</span>
                    </div>
                    <div class="days-info">{{ getDaysUntil(trip.startDate) > 0 ? 'En ' + getDaysUntil(trip.startDate) + ' días' : getDaysUntil(trip.endDate) >= 0 ? 'En curso' : 'Finalizado' }}</div>
                  </td>
                  <td class="text-center">{{ getMemberCount(trip.id) }}</td>
                  <td class="text-center">{{ getDestinationCount(trip.id) }}</td>
                  <td>{{ formatMoney(trip.totalBudget) }}</td>
                  <td>{{ formatDate(trip.createdAt) }}</td>
                  <td>
                    <div class="action-buttons">
                      <a [routerLink]="['/admin/viajes', trip.id]" class="icon-btn" aria-label="Ver detalles del viaje" type="button">
                        <svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </a>
                      <button class="icon-btn" (click)="viewTripMembers(trip)" aria-label="Ver miembros" type="button">
                        <svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                      </button>
                      <button class="icon-btn danger" (click)="confirmDeleteTrip(trip)" aria-label="Eliminar viaje" type="button">
                        <svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          @if (filteredTrips().length === 0) {
            <div class="empty-state">
              <svg class="ui-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h6z"/>
              </svg>
              <p>No se encontraron viajes con los filtros actuales</p>
            </div>
          }
        </div>

        <div class="pagination">
          <span class="pagination-info">Mostrando {{ filteredTrips().length }} de {{ totalTrips() }} viajes</span>
          <div class="pagination-controls">
            <button class="btn btn-outline btn-sm" [disabled]="currentPage() === 1" (click)="prevPage()" type="button">Anterior</button>
            <button class="btn btn-outline btn-sm" [disabled]="currentPage() === totalPages()" (click)="nextPage()" type="button">Siguiente</button>
          </div>
        </div>
      </div>

      @if (showDeleteModal()) {
        <div class="modal-overlay" (click)="closeDeleteModal()">
          <div class="modal-box danger-modal" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title" (click)="$event.stopPropagation()">
            <h3 id="delete-modal-title">Eliminar viaje</h3>
            <p>¿Estás seguro de que quieres eliminar el viaje <strong>{{ tripToDelete()?.name }}</strong>?</p>
            <p class="warning-text">Esta acción es irreversible. Se eliminarán todos sus destinos, itinerarios, gastos, votaciones, reservas y miembros.</p>
            <div class="modal-actions">
              <button class="btn btn-ghost" (click)="closeDeleteModal()">Cancelar</button>
              <button class="btn btn-danger" (click)="deleteTrip()">Eliminar permanentemente</button>
            </div>
          </div>
        </div>
      }

      @if (showMembersModal()) {
        <div class="modal-overlay" (click)="closeMembersModal()">
          <div class="modal-box large-modal" role="dialog" aria-modal="true" aria-labelledby="members-modal-title" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 id="members-modal-title">Miembros de {{ selectedTripForMembers()?.name }}</h3>
              <button class="icon-btn" (click)="closeMembersModal()" aria-label="Cerrar" type="button">
                <svg class="ui-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="members-list">
              @for (member of tripMembers(); track member.id) {
                <div class="member-row">
                  <div class="user-cell">
                    <div class="avatar avatar-sm" [style.background]="getUser(member.userId)?.avatarColor">{{ getUser(member.userId)?.initials }}</div>
                    <div>
                      <div class="user-name">{{ getUser(member.userId)?.displayName }}</div>
                      <div class="user-email">{{ getUser(member.userId)?.email }}</div>
                    </div>
                  </div>
                  <span class="badge" [ngClass]="tripRoleBadgeClass(member.role)">{{ tripRoleLabel(member.role) }}</span>
                </div>
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

    .filter-group { display: flex; gap: 12px; }

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

    .trip-name { font-weight: 600; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-primary); }
    .trip-desc { font-size: 0.7rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .date-range { display: flex; align-items: center; gap: 4px; font-size: 0.8rem; }
    .date-separator { color: var(--text-muted); }
    .days-info { font-size: 0.7rem; color: var(--text-muted); margin-top: 2px; }

    .text-center { text-align: center; font-variant-numeric: tabular-nums; }

    .action-buttons { display: flex; gap: 4px; }

    .icon-btn.danger:hover { color: var(--accent-red); background: rgba(239, 68, 68, 0.1); }

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

    .danger-modal { border-color: rgba(239, 68, 68, 0.3); }

    .warning-text {
      font-size: 0.8rem;
      color: var(--accent-red);
      margin-top: 8px;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .members-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 400px;
      overflow-y: auto;
    }

    .member-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      background: var(--bg-panel-2);
      border-radius: 10px;
    }

    .large-modal { width: min(600px, 100%); }

    @media (max-width: 900px) {
      .admin-table th:nth-child(6), .admin-table td:nth-child(6) {
        display: none;
      }
    }

    @media (max-width: 700px) {
      .admin-table th:nth-child(7), .admin-table td:nth-child(7),
      .admin-table th:nth-child(8), .admin-table td:nth-child(8) {
        display: none;
      }
    }
  `]
})
export class AdminTripsComponent {
  private mockData = inject(MockDataService);

  searchQuery = '';
  statusFilter = '';
  currentPage = signal(1);
  pageSize = 10;
  showDeleteModal = signal(false);
  tripToDelete = signal<Trip | null>(null);
  showMembersModal = signal(false);
  selectedTripForMembers = signal<Trip | null>(null);
  tripMembers = signal<TripMember[]>([]);

  allTrips = computed(() => this.mockData.trips());
  groups = computed(() => this.mockData.groups());
  users = computed(() => this.mockData.users());
  totalTrips = computed(() => this.allTrips().length);

  filteredTrips = computed(() => {
    let trips = this.allTrips();

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      trips = trips.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    }

    if (this.statusFilter) {
      trips = trips.filter(t => t.status === this.statusFilter);
    }

    trips = trips.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    const start = (this.currentPage() - 1) * this.pageSize;
    return trips.slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.allTrips().length / this.pageSize));

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

  getGroupName(groupId: UUID): string {
    return this.groups().find(g => g.id === groupId)?.name || 'Grupo desconocido';
  }

  getUser(userId: UUID) {
    return this.users().find(u => u.id === userId);
  }

  getMemberCount(tripId: UUID): number {
    return this.mockData.getTripMembers(tripId).length;
  }

  getDestinationCount(tripId: UUID): number {
    return this.mockData.getTripDestinations(tripId).length;
  }

  viewTripMembers(trip: Trip): void {
    this.selectedTripForMembers.set(trip);
    this.tripMembers.set(this.mockData.getTripMembers(trip.id));
    this.showMembersModal.set(true);
  }

  closeMembersModal(): void {
    this.showMembersModal.set(false);
    this.selectedTripForMembers.set(null);
    this.tripMembers.set([]);
  }

  confirmDeleteTrip(trip: Trip): void {
    this.tripToDelete.set(trip);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.tripToDelete.set(null);
  }

  deleteTrip(): void {
    console.log('Delete trip:', this.tripToDelete()?.id);
    this.closeDeleteModal();
  }

  formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatMoney(v: number): string {
    return v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  }

  statusBadge(status: TripStatus): string {
    switch (status) {
      case 'PLANNING': return 'badge-orange';
      case 'CONFIRMED': return 'badge-blue';
      case 'IN_PROGRESS': return 'badge-green';
      case 'COMPLETED': return 'badge-gray';
    }
  }

  statusLabel(status: TripStatus): string {
    switch (status) {
      case 'PLANNING': return 'Planificando';
      case 'CONFIRMED': return 'Confirmado';
      case 'IN_PROGRESS': return 'En curso';
      case 'COMPLETED': return 'Finalizado';
    }
  }

  tripRoleBadgeClass(role: string): string {
    switch (role) {
      case 'OWNER': return 'badge-purple';
      case 'ORGANIZER': return 'badge-blue';
      case 'MEMBER': return 'badge-green';
      default: return 'badge-gray';
    }
  }

  tripRoleLabel(role: string): string {
    switch (role) {
      case 'OWNER': return 'Propietario';
      case 'ORGANIZER': return 'Organizador';
      case 'MEMBER': return 'Miembro';
      default: return role;
    }
  }

  getDaysUntil(startDate: string): number {
    const start = new Date(startDate);
    const now = new Date();
    const diff = start.getTime() - now.getTime();
    return Math.ceil(diff / 86400000);
  }
}