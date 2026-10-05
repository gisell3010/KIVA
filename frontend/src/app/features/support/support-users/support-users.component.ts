import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminApiService } from '../../../data-access/api/admin-api.service';
import { GlobalRole, UserRead, UserStatus } from '../../../shared/models/domain.models';
import { formatDate } from '../../../shared/utils/date.utils';

@Component({
  selector: 'app-support-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
  ],
  template: `
    <div class="admin-page">
      <div class="page-head">
        <div>
          <h1 class="page-title">
            Consulta de Usuarios
          </h1>

          <p class="page-subtitle">
            Consulta cuentas, diagnostica incidencias y protege el acceso.
          </p>
        </div>

        <a
          routerLink="/soporte"
          class="btn btn-outline"
        >
          Volver al panel
        </a>
      </div>


      <div class="card">

        <div class="filters-bar">

          <input
            type="text"
            class="filter-input"
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

                      <div class="avatar avatar-sm">
                        {{ initials(user.full_name) }}
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
                    <span
                      class="badge"
                      [ngClass]="roleBadgeClass(user.role)"
                    >
                      {{ roleLabel(user.role) }}
                    </span>
                  </td>


                  <td>
                    <span
                      class="status-badge"
                      [class.suspended]="
                        user.status === 'SUSPENDED'
                      "
                    >
                      {{
                        user.status === 'ACTIVE'
                          ? 'Activo'
                          : 'Suspendido'
                      }}
                    </span>
                  </td>


                  <td>
                    {{ formatDate(user.created_at) }}
                  </td>


                  <td>
                    <button
                      type="button"
                      class="btn btn-outline btn-sm"
                      (click)="openUser(user)"
                    >
                      Ver detalle
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

          <span>
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


      @if (
        selectedUser();
        as user
      ) {

        <div
          class="modal-overlay"
          (click)="closeDetail()"
        >

          <div
            class="modal-box"
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-user-detail-title"
            (click)="$event.stopPropagation()"
          >

            <div class="modal-header">

              <h3 id="support-user-detail-title">
                Detalles del usuario
              </h3>

              <button
                type="button"
                class="icon-btn"
                aria-label="Cerrar"
                (click)="closeDetail()"
              >
                ×
              </button>

            </div>


            <div class="user-detail-header">

              <div class="avatar avatar-md">
                {{ initials(user.full_name) }}
              </div>

              <div>
                <div class="detail-name">
                  {{ user.full_name }}
                </div>

                <div class="detail-email">
                  {{ user.email }}
                </div>

                <div class="user-handle">
                  &#64;{{ user.username }}
                </div>
              </div>

            </div>


            <div class="detail-grid">

              <div>
                <span class="detail-label">
                  ID
                </span>

                <span class="detail-value">
                  {{ user.id }}
                </span>
              </div>


              <div>
                <span class="detail-label">
                  Rol
                </span>

                <span class="detail-value">
                  {{ roleLabel(user.role) }}
                </span>
              </div>


              <div>
                <span class="detail-label">
                  Estado
                </span>

                <span class="detail-value">
                  {{
                    user.status === 'ACTIVE'
                      ? 'Activo'
                      : 'Suspendido'
                  }}
                </span>
              </div>


              <div>
                <span class="detail-label">
                  Registrado
                </span>

                <span class="detail-value">
                  {{ formatDate(user.created_at) }}
                </span>
              </div>

            </div>


            <a class="btn btn-outline" routerLink="/soporte/diagnostico" [queryParams]="{ user: user.id }">Consultar grupos y viajes</a>
            <div class="modal-actions">

              <button
                type="button"
                class="btn btn-ghost"
                (click)="closeDetail()"
              >
                Cerrar
              </button>

            </div>

          </div>

        </div>

      }

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
      min-width: 160px;
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
      text-align: left;
      border-bottom:
        1px solid var(--border-soft);
    }

    .user-cell,
    .user-detail-header {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .user-name,
    .detail-name {
      font-weight: 600;
      color: var(--text-primary);
    }

    .user-handle,
    .detail-email {
      font-size: 0.75rem;
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
      justify-content: space-between;
      gap: 12px;
      margin-top: 16px;
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .detail-grid {
      display: grid;
      gap: 12px;
      margin: 18px 0;
    }

    .detail-label {
      display: block;
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    .detail-value {
      font-weight: 600;
    }

    .error-text {
      color: var(--accent-red);
    }
  `],
})
export class SupportUsersComponent
  implements OnInit
{
  private readonly adminApi =
    inject(AdminApiService);


  readonly users =
    signal<UserRead[]>([]);

  readonly selectedUser =
    signal<UserRead | null>(null);

  readonly totalUsers =
    signal(0);

  readonly currentPage =
    signal(1);

  readonly loading =
    signal(false);

  readonly error =
    signal<string | null>(null);

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
        ),
      ),
    );


  readonly formatDate =
    formatDate;


  ngOnInit(): void {
    this.loadUsers();
  }


  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    this.adminApi
      .supportUsers({
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
          || undefined,
      })
      .subscribe({

        next: page => {
          this.users.set(
            page.items,
          );

          this.totalUsers.set(
            page.total,
          );

          this.loading.set(false);
        },

        error: () => {
          this.error.set(
            'No se pudieron cargar los usuarios.',
          );

          this.loading.set(false);
        },

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
      page => page - 1,
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
      page => page + 1,
    );

    this.loadUsers();
  }


  openUser(
    user: UserRead,
  ): void {
    this.adminApi
      .supportUser(user.id)
      .subscribe({

        next: data => {
          this.selectedUser.set(
            data,
          );

          this.error.set(null);
        },

        error: () => {
          this.error.set(
            'No se pudo cargar el detalle del usuario.',
          );
        },

      });
  }


  closeDetail(): void {
    this.selectedUser.set(null);
  }


  initials(
    name: string,
  ): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(
        part =>
          part[0]
            ?.toUpperCase(),
      )
      .join('');
  }


  roleBadgeClass(
    role: GlobalRole,
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
    role: GlobalRole,
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