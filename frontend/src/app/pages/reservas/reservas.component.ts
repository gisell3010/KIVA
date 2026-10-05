import { allPages } from '../../core/http/all-pages';
import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiError } from '../../core/http/error.interceptor';
import { CatalogsApiService } from '../../data-access/api/catalogs-api.service';
import { GroupsApiService } from '../../data-access/api/groups-api.service';
import { ReservationsApiService } from '../../data-access/api/reservations-api.service';
import { TripsApiService } from '../../data-access/api/trips-api.service';
import {
  CatalogRead,
  GroupRead,
  ReservationCreate,
  ReservationRead,
  ReservationStatus,
  TripRead,
} from '../../shared/models/domain.models';
import { formatDate } from '../../shared/utils/date.utils';
import { formatMoney } from '../../shared/utils/money.utils';
import { isTripManager } from '../../shared/utils/permissions.utils';

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reservas.component.html',
  styleUrl: './reservas.component.css',
})
export class ReservasComponent implements OnInit {
  private readonly api = inject(ReservationsApiService);
  private readonly catalogs = inject(CatalogsApiService);
  private readonly tripsApi = inject(TripsApiService);
  private readonly groupsApi = inject(GroupsApiService);

  readonly trips = signal<TripRead[]>([]);
  readonly groups = signal<GroupRead[]>([]);
  readonly reservationTypes = signal<CatalogRead[]>([]);
  readonly selectedTripId = signal<number | null>(null);
  readonly reservations = signal<ReservationRead[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);

  readonly form = signal({
    type_id: 0,
    title: '',
    provider: '',
    reservation_date: '',
    amount: '',
    status: 'PENDING' as ReservationStatus,
  });

  readonly selectedTrip = computed(
    () => this.trips().find((t) => t.id === this.selectedTripId()) ?? null
  );
  readonly canManage = computed(() => isTripManager(this.selectedTrip()));
  readonly formatMoney = formatMoney;

  ngOnInit(): void {
    allPages(page => this.groupsApi.list({ page, page_size: 100 })).subscribe({
      next: (p) => this.groups.set(p.items),
    });

    this.catalogs.reservationTypes().subscribe({
      next: (v) => this.reservationTypes.set(v),
    });

    allPages(page => this.tripsApi.list({ page, page_size: 100 })).subscribe({
      next: (p) => {
        this.trips.set(p.items);
        if (p.items.length) {
          this.selectedTripId.set(p.items[0].id);
          this.loadReservations(p.items[0].id);
        }
      },
    });
  }

  loadReservations(id: number): void {
    this.loading.set(true);
    allPages(page => this.api.list(id, { page, page_size: 100 })).subscribe({
      next: (p) => {
        this.reservations.set(p.items);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.failError(e, 'Error al cargar las reservas.');
      },
    });
  }

  onTripSelect(e: Event): void {
    const id = Number((e.target as HTMLSelectElement).value);
    this.closeForm();

    if (!id) {
      this.selectedTripId.set(null);
      this.reservations.set([]);
      return;
    }

    this.selectedTripId.set(id);
    this.loadReservations(id);
  }

  openCreate(): void {
    if (!this.canManage()) return;

    this.editingId.set(null);
    this.form.set({
      type_id: this.reservationTypes()[0]?.id ?? 0,
      title: '',
      provider: '',
      reservation_date: '',
      amount: '',
      status: 'PENDING',
    });
    this.showForm.set(true);
  }

  openEdit(item: ReservationRead): void {
    if (!this.canManage()) return;

    this.editingId.set(item.id);
    this.form.set({
      type_id: item.type_id,
      title: item.title,
      provider: item.provider ?? '',
      reservation_date: item.reservation_date ?? '',
      amount: item.amount ?? '',
      status: item.status,
    });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  setField(field: string, value: string | number): void {
    this.form.update((f) => ({
      ...f,
      [field]: field === 'type_id' ? Number(value) : value,
    }));
  }

  save(): void {
    const tripId = this.selectedTripId();
    const f = this.form();

    if (!tripId || !this.canManage() || !f.type_id || !f.title.trim()) return;

    const base: ReservationCreate = {
      type_id: f.type_id,
      title: f.title.trim(),
      provider: f.provider.trim() || null,
      reservation_date: f.reservation_date || null,
      amount: f.amount ? String(f.amount) : null,
    };

    this.saving.set(true);

    const req = this.editingId()
      ? this.api.update(tripId, this.editingId()!, { ...base, status: f.status })
      : this.api.create(tripId, base);

    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.loadReservations(tripId);
      },
      error: (e) => {
        this.saving.set(false);
        this.failError(e, 'No se pudo guardar la reserva.');
      },
    });
  }

  delete(item: ReservationRead): void {
    const tripId = this.selectedTripId();

    if (!tripId || !this.canManage() || !confirm('¿Eliminar esta reserva?')) return;

    this.api.delete(tripId, item.id).subscribe({
      next: () => this.loadReservations(tripId),
      error: (e) => this.failError(e, 'No se pudo eliminar la reserva.'),
    });
  }

  groupName(id: number): string {
    return this.groups().find((g) => g.id === id)?.name || 'Grupo';
  }

  typeLabel(id: number): string {
    return this.reservationTypes().find((t) => t.id === id)?.name || 'Tipo';
  }

  reservationDate(v: string | null): string {
    return v ? formatDate(v) : 'Sin fecha';
  }

  statusLabel(s: ReservationStatus): string {
    return {
      PENDING: 'Pendiente',
      CONFIRMED: 'Confirmada',
      CANCELLED: 'Cancelada',
    }[s];
  }

  private failError(e: unknown, f: string): void {
    this.error.set(e instanceof ApiError ? e.message : f);
  }
}