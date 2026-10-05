import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminApiService } from '../../../data-access/api/admin-api.service';
import { GroupRead } from '../../../shared/models/domain.models';
import { formatDate } from '../../../shared/utils/date.utils';

@Component({
  selector: 'app-admin-groups',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="admin-page">
      <div class="page-head">
        <div>
          <h1 class="page-title">Grupos de la plataforma</h1>
          <p class="page-subtitle">
            Consulta global de grupos para supervisión administrativa.
          </p>
        </div>

        <a routerLink="/admin" class="btn btn-outline">
          Volver al panel
        </a>
      </div>

      <div class="card">
        <div class="filters-bar">
          <div class="search-field">
            <label for="admin-group-search">Buscar grupo</label>
            <input
              id="admin-group-search"
              type="search"
              class="filter-input"
              placeholder="Escribe parte del nombre del grupo"
              [(ngModel)]="searchQuery"
              (keyup.enter)="applySearch()"
            />
          </div>

          <button
            type="button"
            class="btn btn-outline"
            (click)="applySearch()"
          >
            Buscar
          </button>
        </div>

        @if (loading()) {
          <p class="status-message">Cargando grupos...</p>
        }

        @if (error()) {
          <p class="error-text" role="alert">{{ error() }}</p>
        }

        @if (!loading() && groups().length > 0) {
          <div class="table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Grupo</th>
                  <th>Miembros</th>
                  <th>Viajes</th>
                  <th>Creado</th>
                  <th>Consulta</th>
                </tr>
              </thead>

              <tbody>
                @for (group of groups(); track group.id) {
                  <tr>
                    <td>
                      <div class="group-name">{{ group.name }}</div>
                      <div class="group-description">
                        {{ group.description || 'Sin descripción' }}
                      </div>
                    </td>

                    <td>
                      <span class="metric-value">{{ group.members_count }}</span>
                    </td>

                    <td>
                      <span class="metric-value">{{ group.trips_count }}</span>
                    </td>

                    <td>{{ formatDate(group.created_at) }}</td>

                    <td>
                      @if (group.trips_count > 0) {
                        <a
                          routerLink="/admin/viajes"
                          [queryParams]="{ group_id: group.id, group_name: group.name }"
                          class="btn btn-outline btn-sm"
                        >
                          Ver viajes
                        </a>
                      } @else {
                        <span class="muted-text">Sin viajes</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        @if (!loading() && groups().length === 0) {
          <div class="empty-state">
            <strong>No se encontraron grupos</strong>
            <p>Prueba con otro nombre de búsqueda.</p>
          </div>
        }

        <div class="pagination">
          <span class="pagination-info">
            Mostrando {{ groups().length }} de {{ totalGroups() }} grupos
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
      max-width: 1200px;
    }

    .filters-bar {
      display: flex;
      align-items: flex-end;
      gap: 12px;
      margin-bottom: 20px;
    }

    .search-field {
      flex: 1;
      min-width: 0;
    }

    .filter-input {
      width: 100%;
    }

    .table-container {
      overflow-x: auto;
      border: 1px solid var(--border-soft);
      border-radius: 14px;
    }

    .admin-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }

    .admin-table th {
      padding: 11px 12px;
      text-align: left;
      color: var(--text-muted);
      background: var(--bg-panel-2);
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .admin-table td {
      padding: 14px 12px;
      text-align: left;
      vertical-align: middle;
      border-top: 1px solid var(--border-soft);
    }

    .admin-table tbody tr:hover {
      background: var(--bg-hover);
    }

    .group-name {
      font-weight: 700;
      color: var(--text-primary);
    }

    .group-description {
      max-width: 420px;
      margin-top: 4px;
      font-size: 0.76rem;
      line-height: 1.45;
      color: var(--text-muted);
    }

    .metric-value {
      display: inline-flex;
      min-width: 34px;
      justify-content: center;
      padding: 5px 9px;
      border-radius: 999px;
      background: var(--bg-panel-2);
      color: var(--text-secondary);
      font-weight: 700;
    }

    .muted-text,
    .status-message {
      color: var(--text-muted);
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

    @media (max-width: 700px) {
      .filters-bar,
      .pagination {
        flex-direction: column;
        align-items: stretch;
      }

      .filters-bar .btn {
        width: 100%;
        justify-content: center;
      }

      .pagination-controls {
        justify-content: space-between;
      }
    }
  `],
})
export class AdminGroupsComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);

  readonly groups = signal<GroupRead[]>([]);
  readonly totalGroups = signal(0);
  readonly currentPage = signal(1);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly pageSize = 10;

  searchQuery = '';

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalGroups() / this.pageSize)),
  );

  readonly formatDate = formatDate;

  ngOnInit(): void {
    this.loadGroups();
  }

  loadGroups(): void {
    this.loading.set(true);
    this.error.set(null);

    this.adminApi
      .groups({
        page: this.currentPage(),
        page_size: this.pageSize,
        q: this.searchQuery.trim() || undefined,
      })
      .subscribe({
        next: page => {
          this.groups.set(page.items);
          this.totalGroups.set(page.total);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudieron cargar los grupos.');
          this.loading.set(false);
        },
      });
  }

  applySearch(): void {
    this.currentPage.set(1);
    this.loadGroups();
  }

  prevPage(): void {
    if (this.currentPage() <= 1) return;
    this.currentPage.update(page => page - 1);
    this.loadGroups();
  }

  nextPage(): void {
    if (this.currentPage() >= this.totalPages()) return;
    this.currentPage.update(page => page + 1);
    this.loadGroups();
  }
}
