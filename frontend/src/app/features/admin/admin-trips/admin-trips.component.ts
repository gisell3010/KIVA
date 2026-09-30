import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminApiService } from '../../../data-access/api/admin-api.service';
import { TripRead, TripStatus } from '../../../shared/models/domain.models';
import { formatDate } from '../../../shared/utils/date.utils';

@Component({
  selector: 'app-admin-trips',
  standalone: true,

  imports: [ CommonModule, FormsModule, RouterLink ],
  template: `
    <div class="admin-page">
      <div class="page-head">
        <div>
          <h1 class="page-title">
            Gestión de Viajes
          </h1>
          <p class="page-subtitle">
            Consulta de viajes registrados en KIVA
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
            placeholder="Buscar viaje por nombre"
            [(ngModel)]="searchQuery"
            (keyup.enter)="applyFilters()"
          />

          <select
            class="filter-select"
            [(ngModel)]="statusFilter"
            (change)="applyFilters()"
          >

            <option value="">
              Todos los estados
            </option>

            <option value="PLANNING">
              Planificando
            </option>

            <option value="CONFIRMED">
              Confirmado
            </option>

            <option value="COMPLETED">
              Finalizado
            </option>

            <option value="CANCELLED">
              Cancelado
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
            Cargando viajes...
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
                <th>Viaje</th>
                <th>Grupo</th>
                <th>Estado</th>
                <th>Fechas</th>
                <th>Miembros</th>
                <th>Destinos</th>
                <th>Seleccionados</th>
                <th>Creado</th>
              </tr>
            </thead>

            <tbody>

              @for (
                trip of trips();
                track trip.id
              ) {

                <tr>

                  <td>
                    {{ trip.id }}
                  </td>

                  <td>

                    <div class="trip-name">
                      {{ trip.name }}
                    </div>

                    <div class="trip-description">
                      {{
                        trip.description
                        || 'Sin descripción'
                      }}
                    </div>

                  </td>

                  <td>
                    {{ trip.group_name }}
                  </td>

                  <td>

                    <span
                      class="badge"
                      [ngClass]="
                        statusBadgeClass(
                          trip.status
                        )
                      "
                    >
                      {{
                        statusLabel(
                          trip.status
                        )
                      }}
                    </span>

                  </td>

                  <td>
                    {{ dateRange(trip) }}
                  </td>

                  <td>
                    {{ trip.members_count }}
                  </td>

                  <td>
                    {{ trip.destinations_count }}
                  </td>

                  <td>
                    {{
                      trip
                        .selected_destinations_count
                    }}
                  </td>

                  <td>
                    {{
                      formatDate(
                        trip.created_at
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
          && trips().length === 0
        ) {

          <div class="empty-state">
            <p>
              No se encontraron viajes.
            </p>
          </div>

        }

        <div class="pagination">

          <span class="pagination-info">
            Mostrando
            {{ trips().length }}
            de
            {{ totalTrips() }}
            viajes
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
      text-align: left;
      border-bottom:
        1px solid var(--border-soft);
    }

    .trip-name {
      font-weight: 600;
      color: var(--text-primary);
    }

    .trip-description {
      max-width: 300px;
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
export class AdminTripsComponent
  implements OnInit
{
  private readonly adminApi =
    inject(AdminApiService);

  readonly trips =
    signal<TripRead[]>([]);

  readonly totalTrips =
    signal(0);

  readonly currentPage =
    signal(1);

  readonly loading =
    signal(false);

  readonly error =
    signal<string | null>(null);

  readonly pageSize = 10;

  searchQuery = '';

  statusFilter:
    '' | TripStatus = '';

  readonly totalPages =
    computed(() =>
      Math.max(
        1,
        Math.ceil(
          this.totalTrips()
          / this.pageSize
        )
      )
    );

  readonly formatDate =
    formatDate;

  ngOnInit(): void {
    this.loadTrips();
  }

  loadTrips(): void {
    this.loading.set(true);

    this.adminApi
      .trips({
        page: this.currentPage(),
        page_size: this.pageSize,

        q:
          this.searchQuery.trim()
          || undefined,

        status:
          this.statusFilter
          || undefined
      })
      .subscribe({

        next: page => {
          this.trips.set(
            page.items
          );

          this.totalTrips.set(
            page.total
          );

          this.error.set(null);

          this.loading.set(false);
        },

        error: () => {
          this.error.set(
            'No se pudieron cargar los viajes.'
          );

          this.loading.set(false);
        }

      });
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadTrips();
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

    this.loadTrips();
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

    this.loadTrips();
  }

  dateRange(
    trip: TripRead
  ): string {
    if (
      !trip.start_date
      && !trip.end_date
    ) {
      return 'Sin fechas';
    }

    if (
      trip.start_date
      && trip.end_date
    ) {
      return (
        `${formatDate(
          trip.start_date
        )} – `
        +
        formatDate(
          trip.end_date
        )
      );
    }

    return formatDate(
      trip.start_date
      ?? trip.end_date!
    );
  }

  statusBadgeClass(
    status: TripStatus
  ): string {
    switch (status) {

      case 'PLANNING':
        return 'badge-orange';

      case 'CONFIRMED':
        return 'badge-blue';

      case 'COMPLETED':
        return 'badge-gray';

      case 'CANCELLED':
        return 'badge-red';
    }
  }

  statusLabel(
    status: TripStatus
  ): string {
    switch (status) {

      case 'PLANNING':
        return 'Planificando';

      case 'CONFIRMED':
        return 'Confirmado';

      case 'COMPLETED':
        return 'Finalizado';

      case 'CANCELLED':
        return 'Cancelado';
    }
  }
}