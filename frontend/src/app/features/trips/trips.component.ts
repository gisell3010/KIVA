import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiError } from '../../core/http/error.interceptor';
import { GroupsApiService } from '../../data-access/api/groups-api.service';
import { TripsApiService } from '../../data-access/api/trips-api.service';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { GroupRead, Page, TripRead, TripStatus, TripUpdate } from '../../shared/models/domain.models';
import { formatDate } from '../../shared/utils/date.utils';

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PaginationComponent],
  templateUrl: './trips.component.html',
  styleUrl: './trips.component.css',
})
export class TripsComponent implements OnInit {
  private readonly tripsApi = inject(TripsApiService);
  private readonly groupsApi = inject(GroupsApiService);

  readonly groups = signal<GroupRead[]>([]);
  readonly trips = signal<TripRead[]>([]);
  readonly selectedGroupId = signal<number | null>(null);
  readonly selectedStatus = signal<TripStatus | 'all'>('all');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly pageSize = signal(12);
  readonly total = signal(0);
  readonly showEdit = signal(false);
  readonly editing = signal<TripRead | null>(null);
  readonly saving = signal(false);
  readonly form = signal<TripUpdate>({});

  readonly paginationPage = computed<Page<TripRead>>(() => ({
    items: this.trips(),
    total: this.total(),
    page: this.page(),
    page_size: this.pageSize(),
  }));

  readonly formatDate = formatDate;

  ngOnInit(): void {
    this.groupsApi.list({ page: 1, page_size: 100 }).subscribe({
      next: (page) => this.groups.set(page.items),
      error: () => this.groups.set([]),
    });

    this.loadTrips();
  }

  loadTrips(): void {
    this.loading.set(true);
    this.error.set(null);

    this.tripsApi
      .list({
        page: this.page(),
        page_size: this.pageSize(),
        ...(this.selectedGroupId() ? { group_id: this.selectedGroupId()! } : {}),
        ...(this.selectedStatus() !== 'all' ? { status: this.selectedStatus() as TripStatus } : {}),
      })
      .subscribe({
        next: (page) => {
          this.trips.set(page.items);
          this.total.set(page.total);
          this.loading.set(false);
        },
        error: (error) => {
          this.trips.set([]);
          this.total.set(0);
          this.loading.set(false);
          this.error.set(
            error instanceof ApiError
              ? error.message
              : 'No se pudieron cargar los viajes.',
          );
        },
      });
  }

  onGroupFilterChange(event: Event): void {
    this.selectedGroupId.set(
      Number((event.target as HTMLSelectElement).value) || null,
    );
    this.page.set(1);
    this.loadTrips();
  }

  onStatusFilterChange(event: Event): void {
    this.selectedStatus.set(
      (event.target as HTMLSelectElement).value as TripStatus | 'all',
    );
    this.page.set(1);
    this.loadTrips();
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.loadTrips();
  }

  canEditTrip(trip: TripRead): boolean {
    return (
      trip.my_role === 'OWNER' &&
      (trip.status === 'PLANNING' || trip.status === 'CONFIRMED')
    );
  }

  openEdit(trip: TripRead): void {
    if (!this.canEditTrip(trip)) return;

    this.editing.set(trip);
    this.form.set({
      name: trip.name,
      description: trip.description,
      start_date: trip.start_date,
      end_date: trip.end_date,
      status: trip.status,
    });
    this.showEdit.set(true);
  }

  closeEdit(): void {
    this.showEdit.set(false);
    this.editing.set(null);
    this.form.set({});
  }

  setField(field: keyof TripUpdate, value: string): void {
    this.form.update((current) => ({
      ...current,
      [field]: ['description', 'start_date', 'end_date'].includes(field)
        ? value || null
        : value,
    }));
  }

  saveTrip(): void {
    const trip = this.editing();

    if (!trip || !this.canEditTrip(trip)) return;

    this.saving.set(true);
    this.error.set(null);

    this.tripsApi.update(trip.id, this.form()).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeEdit();
        this.loadTrips();
      },
      error: (error) => {
        this.saving.set(false);
        this.error.set(
          error instanceof ApiError
            ? error.message
            : 'No se pudo actualizar el viaje.',
        );
      },
    });
  }

  deleteTrip(trip: TripRead): void {
    if (
      trip.my_role !== 'OWNER' ||
      !confirm(`¿Eliminar el viaje ${trip.name}?`)
    ) {
      return;
    }

    this.error.set(null);

    this.tripsApi.delete(trip.id).subscribe({
      next: () => this.loadTrips(),
      error: (error) =>
        this.error.set(
          error instanceof ApiError
            ? error.message
            : 'No se pudo eliminar el viaje.',
        ),
    });
  }

  getGroupName(id: number): string {
    return this.groups().find((group) => group.id === id)?.name || 'Grupo';
  }

  statusLabel(status: TripStatus): string {
    return {
      PLANNING: 'Planificando',
      CONFIRMED: 'Confirmado',
      COMPLETED: 'Completado',
      CANCELLED: 'Cancelado',
    }[status];
  }

  roleLabel(role: string | null): string {
    return role === 'OWNER'
      ? 'Responsable del viaje'
      : role === 'ORGANIZER'
        ? 'Organizador'
        : 'Participante';
  }
}
