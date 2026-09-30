import { Component, OnInit, computed, inject, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminApiService } from '../../../data-access/api/admin-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { GlobalRole, UserAdminUpdate, UserRead, UserStatus } from '../../../shared/models/domain.models';
import { formatDate } from '../../../shared/utils/date.utils';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="admin-page">
      <div class="page-head">
        <div>
          <h1 class="page-title">
            Gestión de Usuarios
          </h1>
          <p class="page-subtitle">
            Usuarios registrados en KIVA
          </p>
        </div>
        <a
          routerLink="/admin"
          class="btn btn-outline"
        >
          Volver al panel
        </a>

      </div>

      <div class="card">

        <div class="filters-bar">

          <input
            class="filter-input"
            type="text"
            placeholder="Buscar por nombre, usuario o email"
            [(ngModel)]="searchQuery"
            (keyup.enter)="applyFilters()"
          />

          <select
            class="filter-select"
            [(ngModel)]="roleFilter"
            (change)="applyFilters()"
          >

            <option value="">
              Todos los roles
            </option>

            <option value="SUPER_ADMIN">
              Super Administrador
            </option>

            <option value="ADMIN">
              Administrador
            </option>

            <option value="SUPPORT">
              Soporte
            </option>

            <option value="USER">
              Usuario
            </option>

          </select>

          <select
            class="filter-select"
            [(ngModel)]="statusFilter"
            (change)="applyFilters()"
          >

            <option value="">
              Todos los estados
            </option>

            <option value="ACTIVE">
              Activo
            </option>

            <option value="SUSPENDED">
              Suspendido
            </option>

          </select>

          <button
            type="button"
            class="btn btn-outline"
            (click)="applyFilters()"
          >
            Buscar
          </button>

        </div>

        @if (loading()) {
          <p>
            Cargando usuarios...
          </p>
        }

        @if (error()) {
          <p class="error-text">
            {{ error() }}
          </p>
        }

        <div class="table-container">

          <table class="admin-table">

            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Registrado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>

              @for (
                user of users();
                track user.id
              ) {

                <tr>

                  <td>

                    <div class="user-cell">

                      <div
                        class="avatar avatar-sm"
                      >
                        {{
                          initials(
                            user.full_name
                          )
                        }}
                      </div>

                      <div>

                        <div class="user-name">
                          {{ user.full_name }}
                        </div>

                        <div class="user-handle">
                          &#64;{{ user.username }}
                        </div>

                      </div>

                    </div>

                  </td>

                  <td>
                    {{ user.email }}
                  </td>

                  <td>

                    @if (auth.isSuperAdmin()) {

                      <select
                        class="filter-select role-select"
                        [ngModel]="user.role"
                        [disabled]="
                          savingUserId() === user.id
                        "
                        (ngModelChange)="
                          changeUserRole(
                            user,
                            $event
                          )
                        "
                      >

                        <option value="SUPER_ADMIN">
                          Super Administrador
                        </option>

                        <option value="ADMIN">
                          Administrador
                        </option>

                        <option value="SUPPORT">
                          Soporte
                        </option>

                        <option value="USER">
                          Usuario
                        </option>

                      </select>

                    } @else {

                      <span
                        class="badge"
                        [ngClass]="
                          roleBadgeClass(
                            user.role
                          )
                        "
                      >
                        {{
                          roleLabel(
                            user.role
                          )
                        }}
                      </span>

                    }

                  </td>

                  <td>

                    <span
                      class="status-badge"
                      [class.suspended]="
                        user.status ===
                        'SUSPENDED'
                      "
                    >
                      {{
                        user.status ===
                        'ACTIVE'
                          ? 'Activo'
                          : 'Suspendido'
                      }}
                    </span>

                  </td>

                  <td>
                    {{
                      formatDate(
                        user.created_at
                      )
                    }}
                  </td>

                  <td>

                    <button
                      type="button"
                      class="btn btn-outline btn-sm"
                      [disabled]="
                        !canChangeStatus(user)
                        ||
                        savingUserId()
                          === user.id
                      "
                      (click)="
                        toggleUserStatus(user)
                      "
                    >
                      {{
                        user.status ===
                        'ACTIVE'
                          ? 'Suspender'
                          : 'Activar'
                      }}
                    </button>

                  </td>

                </tr>
              }

            </tbody>

          </table>

        </div>

        @if (
          !loading()
          && users().length === 0
        ) {

          <div class="empty-state">
            <p>
              No se encontraron usuarios.
            </p>
          </div>

        }

        <div class="pagination">

          <span class="pagination-info">
            Mostrando
            {{ users().length }}
            de
            {{ totalUsers() }}
            usuarios
          </span>

          <div class="pagination-controls">

            <button
              type="button"
              class="btn btn-outline btn-sm"
              [disabled]="
                currentPage() <= 1
                || loading()
              "
              (click)="prevPage()"
            >
              Anterior
            </button>

            <span>
              Página
              {{ currentPage() }}
              de
              {{ totalPages() }}
            </span>

            <button
              type="button"
              class="btn btn-outline btn-sm"
              [disabled]="
                currentPage()
                  >= totalPages()
                || loading()
              "
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
      max-width: 1200px;
    }

    .filters-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 16px;
    }

    .filter-input {
      flex: 1;
      min-width: 240px;
    }

    .filter-select {
      min-width: 150px;
    }

    .role-select {
      min-width: 170px;
    }

    .table-container {
      overflow-x: auto;
    }

    .admin-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }

    .admin-table th,
    .admin-table td {
      padding: 12px 10px;
      border-bottom:
        1px solid var(--border-soft);
      text-align: left;
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .user-name {
      font-weight: 600;
      color: var(--text-primary);
    }

    .user-handle {
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    .status-badge {
      padding: 3px 8px;
      border-radius: 999px;
      background:
        rgba(34, 197, 94, 0.15);
      color: #4ade80;
    }

    .status-badge.suspended {
      background:
        rgba(239, 68, 68, 0.15);
      color: #f87171;
    }

    .pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: 16px;
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .error-text {
      color: var(--accent-red);
    }
  `]
})
export class AdminUsersComponent
  implements OnInit
{
  readonly auth =
    inject(AuthService);

  private readonly adminApi =
    inject(AdminApiService);

  readonly users =
    signal<UserRead[]>([]);

  readonly totalUsers =
    signal(0);

  readonly currentPage =
    signal(1);

  readonly loading =
    signal(false);

  readonly error =
    signal<string | null>(null);

  readonly savingUserId =
    signal<number | null>(null);

  readonly pageSize = 10;

  searchQuery = '';

  roleFilter:
    '' | GlobalRole = '';

  statusFilter:
    '' | UserStatus = '';

  readonly totalPages =
    computed(() =>
      Math.max(
        1,
        Math.ceil(
          this.totalUsers()
          / this.pageSize
        )
      )
    );

  readonly formatDate =
    formatDate;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);

    this.adminApi
      .users({
        page: this.currentPage(),
        page_size: this.pageSize,

        q:
          this.searchQuery.trim()
          || undefined,

        role:
          this.roleFilter
          || undefined,

        status:
          this.statusFilter
          || undefined
      })
      .subscribe({

        next: page => {
          this.users.set(
            page.items
          );

          this.totalUsers.set(
            page.total
          );

          this.error.set(null);

          this.loading.set(false);
        },

        error: () => {
          this.error.set(
            'No se pudieron cargar los usuarios.'
          );

          this.loading.set(false);
        }

      });
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadUsers();
  }

  prevPage(): void {
    if (
      this.currentPage() <= 1
    ) {
      return;
    }

    this.currentPage.update(
      page => page - 1
    );

    this.loadUsers();
  }

  nextPage(): void {
    if (
      this.currentPage()
      >= this.totalPages()
    ) {
      return;
    }

    this.currentPage.update(
      page => page + 1
    );

    this.loadUsers();
  }

  canChangeStatus(
    user: UserRead
  ): boolean {
    return (
      this.auth.isSuperAdmin()
      || user.role === 'USER'
    );
  }

  toggleUserStatus(
    user: UserRead
  ): void {
    if (
      !this.canChangeStatus(user)
    ) {
      return;
    }

    const status: UserStatus =
      user.status === 'ACTIVE'
        ? 'SUSPENDED'
        : 'ACTIVE';

    this.updateUser(
      user,
      { status }
    );
  }

  changeUserRole(
    user: UserRead,
    role: GlobalRole
  ): void {
    if (
      !this.auth.isSuperAdmin()
      || role === user.role
    ) {
      return;
    }

    this.updateUser(
      user,
      { role }
    );
  }

  private updateUser(
    user: UserRead,
    data: UserAdminUpdate
  ): void {
    this.savingUserId.set(
      user.id
    );

    this.adminApi
      .updateUser(
        user.id,
        data
      )
      .subscribe({

        next: updated => {

          this.users.update(
            items =>
              items.map(
                item =>
                  item.id === updated.id
                    ? updated
                    : item
              )
          );

          this.error.set(null);

          this.savingUserId.set(
            null
          );
        },

        error: () => {
          this.error.set(
            'No se pudo actualizar el usuario.'
          );

          this.savingUserId.set(
            null
          );

          this.loadUsers();
        }

      });
  }

  initials(
    name: string
  ): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(
        part =>
          part[0]
            ?.toUpperCase()
      )
      .join('');
  }

  roleBadgeClass(
    role: GlobalRole
  ): string {
    switch (role) {

      case 'SUPPORT':
        return 'badge-green';

      case 'USER':
        return 'badge-blue';

      default:
        return 'badge-purple';
    }
  }

  roleLabel(
    role: GlobalRole
  ): string {
    switch (role) {

      case 'SUPER_ADMIN':
        return 'Super Administrador';

      case 'ADMIN':
        return 'Administrador';

      case 'SUPPORT':
        return 'Soporte';

      case 'USER':
        return 'Usuario';
    }
  }
}