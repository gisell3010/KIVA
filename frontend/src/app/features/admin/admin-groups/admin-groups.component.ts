import { Component, OnInit, computed, inject, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminApiService } from '../../../data-access/api/admin-api.service';
import { GroupRead } from '../../../shared/models/domain.models';
import { formatDate } from '../../../shared/utils/date.utils';

@Component({
  selector: 'app-admin-groups',
  standalone: true,
  imports: [ CommonModule, FormsModule, RouterLink ],
  template: `
    <div class="admin-page">
      <div class="page-head">
        <div>
          <h1 class="page-title">
            Gestión de Grupos
          </h1>
          <p class="page-subtitle">
            Consulta de grupos registrados en KIVA
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
            type="text"
            class="filter-input"
            placeholder="Buscar grupo por nombre"
            [(ngModel)]="searchQuery"
            (keyup.enter)="applySearch()"
          />

          <button
            type="button"
            class="btn btn-outline"
            (click)="applySearch()"
          >
            Buscar
          </button>

        </div>

        @if (loading()) {
          <p>
            Cargando grupos...
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
                <th>ID</th>
                <th>Grupo</th>
                <th>Miembros</th>
                <th>Viajes</th>
                <th>Mi relación</th>
                <th>Creado</th>
              </tr>
            </thead>

            <tbody>

              @for (
                group of groups();
                track group.id
              ) {

                <tr>

                  <td>
                    {{ group.id }}
                  </td>

                  <td>

                    <div class="group-name">
                      {{ group.name }}
                    </div>

                    <div class="group-description">
                      {{
                        group.description
                        || 'Sin descripción'
                      }}
                    </div>

                  </td>

                  <td>
                    {{ group.members_count }}
                  </td>

                  <td>
                    {{ group.trips_count }}
                  </td>

                  <td>
                    {{
                      group.my_role
                        ? roleLabel(
                            group.my_role
                          )
                        : 'Sin membresía'
                    }}
                  </td>

                  <td>
                    {{
                      formatDate(
                        group.created_at
                      )
                    }}
                  </td>

                </tr>

              }

            </tbody>

          </table>

        </div>

        @if (
          !loading()
          && groups().length === 0
        ) {

          <div class="empty-state">
            <p>
              No se encontraron grupos.
            </p>
          </div>

        }

        <div class="pagination">

          <span class="pagination-info">
            Mostrando
            {{ groups().length }}
            de
            {{ totalGroups() }}
            grupos
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
      gap: 12px;
      margin-bottom: 16px;
    }

    .filter-input {
      flex: 1;
      min-width: 240px;
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

    .group-name {
      font-weight: 600;
      color: var(--text-primary);
    }

    .group-description {
      max-width: 360px;
      margin-top: 3px;
      font-size: 0.75rem;
      color: var(--text-muted);
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

    @media (max-width: 700px) {
      .filters-bar,
      .pagination {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `]
})
export class AdminGroupsComponent
  implements OnInit
{
  private readonly adminApi =
    inject(AdminApiService);

  readonly groups =
    signal<GroupRead[]>([]);

  readonly totalGroups =
    signal(0);

  readonly currentPage =
    signal(1);

  readonly loading =
    signal(false);

  readonly error =
    signal<string | null>(null);

  readonly pageSize = 10;

  searchQuery = '';

  readonly totalPages =
    computed(() =>
      Math.max(
        1,
        Math.ceil(
          this.totalGroups()
          / this.pageSize
        )
      )
    );

  readonly formatDate =
    formatDate;

  ngOnInit(): void {
    this.loadGroups();
  }

  loadGroups(): void {
    this.loading.set(true);

    this.adminApi
      .groups({
        page: this.currentPage(),
        page_size: this.pageSize,
        q:
          this.searchQuery.trim()
          || undefined
      })
      .subscribe({

        next: page => {
          this.groups.set(
            page.items
          );

          this.totalGroups.set(
            page.total
          );

          this.error.set(null);

          this.loading.set(false);
        },

        error: () => {
          this.error.set(
            'No se pudieron cargar los grupos.'
          );

          this.loading.set(false);
        }

      });
  }

  applySearch(): void {
    this.currentPage.set(1);
    this.loadGroups();
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

    this.loadGroups();
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

    this.loadGroups();
  }

  roleLabel(
    role: GroupRead['my_role']
  ): string {
    switch (role) {

      case 'OWNER':
        return 'Propietario';

      case 'MEMBER':
        return 'Miembro';

      default:
        return 'Sin membresía';
    }
  }
}