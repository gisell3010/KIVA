import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MockDataService } from '../../../data-access/mock/mock-data.service';
import { User, GlobalRole } from '../../../shared/models/domain.models';

@Component({
  selector: 'app-support-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="admin-page">
      <div class="page-head">
        <div>
          <h1 class="page-title">Consulta de Usuarios</h1>
          <p class="page-subtitle">Vista de solo lectura para asistencia al usuario</p>
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
              placeholder="Buscar por nombre, email..."
              [(ngModel)]="searchQuery"
              (input)="onSearch()"
              class="filter-input"
              aria-label="Buscar usuarios"
            />
          </div>

          <div class="filter-group">
            <select [(ngModel)]="roleFilter" (change)="onFilterChange()" class="filter-select" aria-label="Filtrar por rol">
              <option value="">Todos los roles</option>
              <option value="SUPER_ADMIN">Super Administrador</option>
              <option value="ADMIN">Administrador</option>
              <option value="SUPPORT">Soporte</option>
              <option value="USER">Usuario</option>
            </select>
          </div>
        </div>

        <div class="table-container" role="region" tabindex="0" aria-label="Lista de usuarios">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Grupos</th>
                <th>Viajes</th>
                <th>Registrado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (user of filteredUsers(); track user.id) {
                <tr>
                  <td>
                    <div class="user-cell">
                      <div class="avatar avatar-sm" [style.background]="user.avatarColor">{{ user.initials }}</div>
                      <div class="user-name">{{ user.displayName }}</div>
                    </div>
                  </td>
                  <td>{{ user.email }}</td>
                  <td>
                    <span class="badge" [ngClass]="roleBadgeClass(user.role)">{{ roleLabel(user.role) }}</span>
                  </td>
                  <td class="text-center">{{ getGroupCount(user.id) }}</td>
                  <td class="text-center">{{ getTripCount(user.id) }}</td>
                  <td>{{ formatDate(user.createdAt) }}</td>
                  <td>
                    <div class="action-buttons">
                      <button class="icon-btn" (click)="viewUser(user)" aria-label="Ver detalles del usuario" type="button">
                        <svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          @if (filteredUsers().length === 0) {
            <div class="empty-state">
              <svg class="ui-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <p>No se encontraron usuarios con los filtros actuales</p>
            </div>
          }
        </div>

        <div class="pagination">
          <span class="pagination-info">Mostrando {{ filteredUsers().length }} de {{ totalUsers() }} usuarios</span>
          <div class="pagination-controls">
            <button class="btn btn-outline btn-sm" [disabled]="currentPage() === 1" (click)="prevPage()" type="button">Anterior</button>
            <button class="btn btn-outline btn-sm" [disabled]="currentPage() === totalPages()" (click)="nextPage()" type="button">Siguiente</button>
          </div>
        </div>
      </div>

      @if (selectedUser()) {
        <div class="modal-overlay" (click)="closeDetail()">
          <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="user-detail-title" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 id="user-detail-title">Detalles del usuario</h3>
              <button class="icon-btn" (click)="closeDetail()" aria-label="Cerrar" type="button">
                <svg class="ui-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div class="user-detail-header">
              <div class="avatar avatar-md" [style.background]="selectedUser()!.avatarColor">{{ selectedUser()!.initials }}</div>
              <div>
                <div class="detail-name">{{ selectedUser()!.displayName }}</div>
                <div class="detail-email">{{ selectedUser()!.email }}</div>
                <span class="badge" [ngClass]="roleBadgeClass(selectedUser()!.role)">{{ roleLabel(selectedUser()!.role) }}</span>
              </div>
            </div>

            @if (selectedUser()!.bio) {
              <p class="detail-bio">{{ selectedUser()!.bio }}</p>
            }

            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Grupos</span>
                <span class="detail-value">{{ getGroupCount(selectedUser()!.id) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Viajes</span>
                <span class="detail-value">{{ getTripCount(selectedUser()!.id) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Zona horaria</span>
                <span class="detail-value">{{ selectedUser()!.timezone }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Registrado</span>
                <span class="detail-value">{{ formatDate(selectedUser()!.createdAt) }}</span>
              </div>
            </div>

            <div class="modal-actions">
              <button class="btn btn-ghost" (click)="closeDetail()">Cerrar</button>
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

    .filter-select {
      min-width: 180px;
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

    .user-cell { display: flex; align-items: center; gap: 10px; }
    .user-name { font-weight: 600; color: var(--text-primary); font-size: 0.85rem; }
    .text-center { text-align: center; font-variant-numeric: tabular-nums; }
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
      margin-bottom: 16px;
    }

    .user-detail-header {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 12px;
    }

    .avatar-md {
      width: 48px;
      height: 48px;
      font-size: 0.95rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
    }

    .detail-name { font-size: 1rem; font-weight: 700; color: var(--text-primary); }
    .detail-email { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 6px; }

    .detail-bio {
      font-size: 0.85rem;
      color: var(--text-secondary);
      line-height: 1.5;
      padding: 12px;
      background: var(--bg-panel-2);
      border-radius: 10px;
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
      font-variant-numeric: tabular-nums;
    }

    @media (max-width: 900px) {
      .admin-table th:nth-child(5), .admin-table td:nth-child(5) { display: none; }
    }

    @media (max-width: 700px) {
      .admin-table th:nth-child(6), .admin-table td:nth-child(6) { display: none; }
      .detail-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class SupportUsersComponent {
  private mockData = inject(MockDataService);

  searchQuery = '';
  roleFilter = '';
  currentPage = signal(1);
  pageSize = 10;
  selectedUser = signal<User | null>(null);

  allUsers = computed(() => this.mockData.users());
  totalUsers = computed(() => this.allUsers().length);

  filteredUsers = computed(() => {
    let users = this.allUsers();

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      users = users.filter(u =>
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }

    if (this.roleFilter) {
      users = users.filter(u => u.role === this.roleFilter);
    }

    const start = (this.currentPage() - 1) * this.pageSize;
    return users.slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.totalUsers() / this.pageSize));

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

  getGroupCount(userId: string): number {
    return this.mockData.getGroupMembers(userId).length;
  }

  getTripCount(userId: string): number {
    return this.mockData.getTripMembers(userId).length;
  }

  viewUser(user: User): void {
    this.selectedUser.set(user);
  }

  closeDetail(): void {
    this.selectedUser.set(null);
  }

  formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  roleBadgeClass(role: GlobalRole): string {
    switch (role) {
      case 'SUPER_ADMIN': return 'badge-purple';
      case 'ADMIN': return 'badge-purple';
      case 'SUPPORT': return 'badge-green';
      case 'USER': return 'badge-blue';
      default: return 'badge-gray';
    }
  }

  roleLabel(role: GlobalRole): string {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Administrador';
      case 'ADMIN': return 'Administrador';
      case 'SUPPORT': return 'Soporte';
      case 'USER': return 'Usuario';
      default: return 'Usuario';
    }
  }
}
