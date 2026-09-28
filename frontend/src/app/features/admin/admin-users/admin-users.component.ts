import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../../data-access/mock/mock-data.service';
import { User, UserRole, UUID } from '../../../shared/models/domain.models';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page">
      <div class="page-head">
        <div>
          <h1 class="page-title">Gestión de Usuarios</h1>
          <p class="page-subtitle">Administra los usuarios de la plataforma</p>
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

            <select [(ngModel)]="statusFilter" (change)="onFilterChange()" class="filter-select" aria-label="Filtrar por estado">
              <option value="">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="suspended">Suspendido</option>
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
                <th>Estado</th>
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
                  <td>
                    <span class="status-badge" [ngClass]="{ suspended: user.id === '9' }">
                      {{ user.id === '9' ? 'Suspendido' : 'Activo' }}
                    </span>
                  </td>
                  <td class="text-center">{{ getGroupCount(user.id) }}</td>
                  <td class="text-center">{{ getTripCount(user.id) }}</td>
                  <td>{{ formatDate(user.createdAt) }}</td>
                  <td>
                    <div class="action-buttons">
                      <button class="icon-btn" (click)="toggleUserStatus(user)" [attr.aria-label]="user.id === '9' ? 'Activar usuario' : 'Suspender usuario'" type="button">
                        <svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                          <path [attr.d]="user.id === '9' ? 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2' : 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2M9 12h6'"/>
                        </svg>
                      </button>
                      <button class="icon-btn" (click)="toggleUserRole(user)" [attr.aria-label]="user.role === 'ADMIN' ? 'Cambiar a usuario' : 'Cambiar a administrador'" type="button">
                        <svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                          <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2"/>
                        </svg>
                      </button>
                      <button class="icon-btn danger" (click)="confirmDeleteUser(user)" aria-label="Eliminar usuario" type="button">
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

      @if (showDeleteModal()) {
        <div class="modal-overlay" (click)="closeDeleteModal()">
          <div class="modal-box danger-modal" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title" (click)="$event.stopPropagation()">
            <h3 id="delete-modal-title">Eliminar usuario</h3>
            <p>¿Estás seguro de que quieres eliminar a <strong>{{ userToDelete()?.displayName }}</strong> ({{ userToDelete()?.email }})?</p>
            <p class="warning-text">Esta acción es irreversible. Se eliminarán todos sus datos: grupos, viajes, gastos, votaciones y reservas.</p>
            <div class="modal-actions">
              <button class="btn btn-ghost" (click)="closeDeleteModal()">Cancelar</button>
              <button class="btn btn-danger" (click)="deleteUser()">Eliminar permanentemente</button>
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

    .user-cell { display: flex; align-items: center; gap: 10px; }
    .user-name { font-weight: 600; color: var(--text-primary); font-size: 0.85rem; }

    .text-center { text-align: center; font-variant-numeric: tabular-nums; }

    .status-badge {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 999px;
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
    }

    .status-badge.suspended {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
    }

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

    @media (max-width: 900px) {
      .admin-table th:nth-child(5), .admin-table td:nth-child(5),
      .admin-table th:nth-child(6), .admin-table td:nth-child(6) {
        display: none;
      }
    }

    @media (max-width: 700px) {
      .admin-table th:nth-child(7), .admin-table td:nth-child(7) {
        display: none;
      }
    }
  `]
})
export class AdminUsersComponent {
  private mockData: MockDataService = inject(MockDataService);

  searchQuery = '';
  roleFilter = '';
  statusFilter = '';
  currentPage = signal(1);
  pageSize = 10;
  showDeleteModal = signal(false);
  userToDelete = signal<User | null>(null);

  allUsers = computed(() => this.mockData.users());
  totalUsers = computed(() => this.allUsers().length);

  filteredUsers = computed(() => {
    let users: User[] = this.allUsers();

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

    if (this.statusFilter) {
      if (this.statusFilter === 'active') {
        users = users.filter(u => u.id !== '9');
      } else if (this.statusFilter === 'suspended') {
        users = users.filter(u => u.id === '9');
      }
    }

    const start = (this.currentPage() - 1) * this.pageSize;
    return users.slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.allUsers().length / this.pageSize));

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

  getGroupCount(userId: UUID): number {
    return this.mockData.getGroupMembers(userId).length;
  }

  getTripCount(userId: UUID): number {
    return this.mockData.getTripMembers(userId).length;
  }

  toggleUserStatus(user: User): void {
    // In real app: call API to suspend/activate
    console.log('Toggle status for:', user.id, user.id === '9' ? 'activate' : 'suspend');
  }

  toggleUserRole(user: User): void {
    // In real app: call API to change role
    console.log('Toggle role for:', user.id, user.role === 'ADMIN' ? 'USER' : 'ADMIN');
  }

  confirmDeleteUser(user: User): void {
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'SUPPORT') return;
    this.userToDelete.set(user);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.userToDelete.set(null);
  }

  deleteUser(): void {
    // In real app: call API to delete
    console.log('Delete user:', this.userToDelete()?.id);
    this.closeDeleteModal();
  }

  formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  roleBadgeClass(role: UserRole): string {
    switch (role) {
      case 'SUPER_ADMIN': return 'badge-purple';
      case 'ADMIN': return 'badge-purple';
      case 'SUPPORT': return 'badge-green';
      case 'USER': return 'badge-blue';
      default: return 'badge-gray';
    }
  }

  roleLabel(role: UserRole): string {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Administrador';
      case 'ADMIN': return 'Administrador';
      case 'SUPPORT': return 'Soporte';
      case 'USER': return 'Usuario';
      default: return 'Usuario';
    }
  }
}