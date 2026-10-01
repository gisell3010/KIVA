import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationsApiService } from '../../data-access/api/reservations-api.service';
import { CatalogsApiService } from '../../data-access/api/catalogs-api.service';
import { TripsApiService } from '../../data-access/api/trips-api.service';
import { GroupsApiService } from '../../data-access/api/groups-api.service';
import { TripRead, GroupRead, ReservationRead, CatalogRead } from '../../shared/models/domain.models';
import { formatMoney } from '../../shared/utils/money.utils';
import { formatDate } from '../../shared/utils/date.utils';
import { ApiError } from '../../core/http/error.interceptor';

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservas.component.html',
  styleUrl: './reservas.component.css'
})
export class ReservasComponent implements OnInit {
  private readonly reservationsApi = inject(ReservationsApiService);
  private readonly catalogsApi = inject(CatalogsApiService);
  private readonly tripsApi = inject(TripsApiService);
  private readonly groupsApi = inject(GroupsApiService);

  readonly trips = signal<TripRead[]>([]);
  readonly groups = signal<GroupRead[]>([]);
  readonly reservationTypes = signal<CatalogRead[]>([]);

  readonly selectedTripId = signal<number | null>(null);
  readonly reservations = signal<ReservationRead[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly formatMoney = formatMoney;

  ngOnInit(): void {
    this.loadGroups();
    this.loadReservationTypes();
    this.loadTrips();
  }

  loadGroups(): void {
    this.groupsApi.list({
      page: 1,
      page_size: 100
    }).subscribe({
      next: page => {
        this.groups.set(page.items);
      },

      error: () => {
        this.groups.set([]);
      }
    });
  }

  loadReservationTypes(): void {
    this.catalogsApi.reservationTypes().subscribe({
      next: types => {
        this.reservationTypes.set(types);
      },

      error: () => {
        this.reservationTypes.set([]);
      }
    });
  }

  loadTrips(): void {
    this.tripsApi.list({
      page: 1,
      page_size: 100
    }).subscribe({
      next: page => {
        this.trips.set(page.items);

        if (
          page.items.length > 0 &&
          this.selectedTripId() === null
        ) {
          const tripId = page.items[0].id;

          this.selectedTripId.set(tripId);
          this.loadReservations(tripId);
        }
      },

      error: () => {
        this.trips.set([]);
        this.selectedTripId.set(null);
        this.reservations.set([]);
      }
    });
  }

  loadReservations(tripId: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.reservationsApi.list(
      tripId,
      {
        page: 1,
        page_size: 100
      }
    ).subscribe({
      next: page => {
        this.reservations.set(page.items);
        this.loading.set(false);
      },

      error: (err: unknown) => {
        this.reservations.set([]);

        if (err instanceof ApiError) {
          this.error.set(err.message);
        } else {
          this.error.set('Error al cargar las reservas.');
        }

        this.loading.set(false);
      }
    });
  }

  onTripSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = select.value;

    if (value === '') {
      this.selectedTripId.set(null);
      this.reservations.set([]);
      this.error.set(null);
      return;
    }

    const tripId = Number(value);

    if (!Number.isFinite(tripId)) {
      this.selectedTripId.set(null);
      this.reservations.set([]);
      return;
    }

    this.selectedTripId.set(tripId);
    this.loadReservations(tripId);
  }

  tripName(tripId: number): string {
    return this.trips().find(
      trip => trip.id === tripId
    )?.name || 'Viaje';
  }

  groupName(groupId: number): string {
    return this.groups().find(
      group => group.id === groupId
    )?.name || 'Grupo';
  }

  typeLabel(typeId: number): string {
    return this.reservationTypes().find(
      type => type.id === typeId
    )?.name || `Tipo ${typeId}`;
  }

  reservationDate(value: string | null): string {
    if (!value) {
      return 'Sin fecha';
    }

    return formatDate(value);
  }

  statusBadge(status: string): string {
    switch (status) {
      case 'CONFIRMED':
        return 'badge-green';

      case 'PENDING':
        return 'badge-orange';

      case 'CANCELLED':
        return 'badge-red';

      default:
        return 'badge-gray';
    }
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmada';

      case 'PENDING':
        return 'Pendiente';

      case 'CANCELLED':
        return 'Cancelada';

      default:
        return status;
    }
  }
}