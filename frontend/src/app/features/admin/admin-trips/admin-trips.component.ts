import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminApiService } from '../../../data-access/api/admin-api.service';
import { TripRead, TripStatus } from '../../../shared/models/domain.models';
import { formatDate } from '../../../shared/utils/date.utils';

@Component({
  selector: 'app-admin-trips',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="admin-page">
      <div class="page-head">
        <div>
          <h1 class="page-title">Viajes de la plataforma</h1>
          <p class="page-subtitle">
            Consulta global de viajes para supervisión administrativa.
          </p>
        </div>

        <a routerLink="/admin" class="btn btn-outline">
          Volver al panel
        </a>
      </div>

      @if (groupFilterId()) {
        <div class="context-filter">
          <div>
            <span class="context-label">Filtrando por grupo</span>
            <strong>{{ groupFilterName() || ('Grupo #' + groupFilterId()) }}</strong>
          </div>

          <button type="button" class="btn btn-ghost btn-sm" (click)="clearGroupFilter()">
            Ver todos los viajes
          </button>
        </div>
      }

      <div class="card">
        <div class="filters-bar">
          <div class="search-field">
            <label for="admin-trip-search">Buscar viaje</label>
            <input
              id="admin-trip-search"
              type="search"
              class="filter-input"
              placeholder="Escribe parte del nombre del viaje"
              [(ngModel)]="searchQuery"
              (keyup.enter)="applyFilters()"
            />
          </div>

          <div class="status-field">
            <label for="admin-trip-status">Estado</label>
            <select
              id="admin-trip-status"
              class="filter-select"
              [(ngModel)]="statusFilter"
              (change)="applyFilters()"
            >
              <option value="">Todos los estados</option>
              <option value="PLANNING">Planificando</option>
              <option value="CONFIRMED">Confirmado</option>
              <option value="COMPLETED">Finalizado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>

          <button type="button" class="btn btn-outline" (click)="applyFilters()">
            Buscar
          </button>
        </div>

        @if (loading()) {
          <p class="status-message">Cargando viajes...</p>
        }

        @if (error()) {
          <p class="error-text" role="alert">{{ error() }}</p>
        }

        @if (!loading() && trips().length > 0) {
          <div class="table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Viaje</th>
                  <th>Grupo</th>
                  <th>Estado</th>
                  <th>Fechas</th>
                  <th>Participantes</th>
                  <th>Destinos</th>
                  <th>Creado</th>
                </tr>
              </thead>

              <tbody>
                @for (trip of trips(); track trip.id) {
                  <tr>
                    <td>
                      <div class="trip-name">{{ trip.name }}</div>
                      <div class="trip-description">
                        {{ trip.description || 'Sin descripción' }}
                      </div>
                    </td>

                    <td>{{ trip.group_name }}</td>

                    <td>
                      <span class="badge" [ngClass]="statusBadgeClass(trip.status)">
                        {{ statusLabel(trip.status) }}
                      </span>
                    </td>

                    <td>{{ dateRange(trip) }}</td>
                    <td>{{ trip.members_count }}</td>
                    <td>
                      {{ trip.destinations_count }}
                      @if (trip.selected_destinations_count > 0) {
                        <span class="selected-count">
                          · {{ trip.selected_destinations_count }} seleccionado(s)
                        </span>
                      }
                    </td>
                    <td>{{ formatDate(trip.created_at) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        @if (!loading() && trips().length === 0) {
          <div class="empty-state">
            <strong>No se encontraron viajes</strong>
            <p>Prueba con otro nombre, estado o grupo.</p>
          </div>
        }

        <div class="pagination">
          <span class="pagination-info">
            Mostrando {{ trips().length }} de {{ totalTrips() }} viajes
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

    .context-filter {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 12px 16px;
      margin-bottom: 16px;
      border: 1px solid rgba(59, 130, 246, 0.28);
      border-radius: 12px;
      background: rgba(59, 130, 246, 0.08);
    }

    .context-filter > div {
      display: flex;
      align-items: baseline;
      gap: 8px;
      min-width: 0;
    }

    .context-label {
      color: var(--text-muted);
      font-size: 0.76rem;
    }

    .context-filter strong {
      color: var(--text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .filters-bar {
      display: flex;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 20px;
    }

    .search-field {
      flex: 1 1 320px;
    }

    .status-field {
      flex: 0 1 190px;
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

    .trip-name {
      font-weight: 700;
      color: var(--text-primary);
    }

    .trip-description {
      max-width: 320px;
      margin-top: 4px;
      color: var(--text-muted);
      font-size: 0.75rem;
      line-height: 1.45;
    }

    .selected-count,
    .status-message {
      color: var(--text-muted);
      font-size: 0.75rem;
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
      .context-filter,
      .pagination {
        flex-direction: column;
        align-items: stretch;
      }

      .filters-bar {
        flex-direction: column;
        align-items: stretch;
      }

      .search-field,
      .status-field {
        flex-basis: auto;
      }

      .filters-bar .btn,
      .context-filter .btn {
        width: 100%;
        justify-content: center;
      }

      .pagination-controls {
        justify-content: space-between;
      }
    }
  `],
})
export class AdminTripsComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly trips = signal<TripRead[]>([]);
  readonly totalTrips = signal(0);
  readonly currentPage = signal(1);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly groupFilterId = signal<number | null>(null);
  readonly groupFilterName = signal('');
  readonly pageSize = 10;

  searchQuery = '';
  statusFilter: '' | TripStatus = '';

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalTrips() / this.pageSize)),
  );

  readonly formatDate = formatDate;

  ngOnInit(): void {
    const groupId = Number(this.route.snapshot.queryParamMap.get('group_id'));
    this.groupFilterId.set(Number.isInteger(groupId) && groupId > 0 ? groupId : null);
    this.groupFilterName.set(this.route.snapshot.queryParamMap.get('group_name')?.trim() ?? '');
    this.loadTrips();
  }

  loadTrips(): void {
    this.loading.set(true);
    this.error.set(null);

    this.adminApi
      .trips({
        page: this.currentPage(),
        page_size: this.pageSize,
        q: this.searchQuery.trim() || undefined,
        status: this.statusFilter || undefined,
        group_id: this.groupFilterId() || undefined,
      })
      .subscribe({
        next: page => {
          this.trips.set(page.items);
          this.totalTrips.set(page.total);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudieron cargar los viajes.');
          this.loading.set(false);
        },
      });
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadTrips();
  }

  clearGroupFilter(): void {
    this.groupFilterId.set(null);
    this.groupFilterName.set('');
    this.currentPage.set(1);
    void this.router.navigate(['/admin/viajes']);
    this.loadTrips();
  }

  prevPage(): void {
    if (this.currentPage() <= 1) return;
    this.currentPage.update(page => page - 1);
    this.loadTrips();
  }

  nextPage(): void {
    if (this.currentPage() >= this.totalPages()) return;
    this.currentPage.update(page => page + 1);
    this.loadTrips();
  }

  dateRange(trip: TripRead): string {
    if (!trip.start_date && !trip.end_date) return 'Sin fechas';

    if (trip.start_date && trip.end_date) {
      return `${formatDate(trip.start_date)} – ${formatDate(trip.end_date)}`;
    }

    return formatDate(trip.start_date ?? trip.end_date!);
  }

  statusBadgeClass(status: TripStatus): string {
    return {
      PLANNING: 'badge-orange',
      CONFIRMED: 'badge-blue',
      COMPLETED: 'badge-gray',
      CANCELLED: 'badge-red',
    }[status];
  }

  statusLabel(status: TripStatus): string {
    return {
      PLANNING: 'Planificando',
      CONFIRMED: 'Confirmado',
      COMPLETED: 'Finalizado',
      CANCELLED: 'Cancelado',
    }[status];
  }
}
