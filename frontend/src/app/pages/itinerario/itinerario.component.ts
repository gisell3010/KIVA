import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { allPages } from '../../core/http/all-pages';
import { CommonModule } from '@angular/common';
import { Component, OnInit, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiError } from '../../core/http/error.interceptor';
import { ActivitiesApiService } from '../../data-access/api/activities-api.service';
import { GroupsApiService } from '../../data-access/api/groups-api.service';
import { TripsApiService } from '../../data-access/api/trips-api.service';
import {
  ActivityCreate,
  ActivityRead,
  ActivityStatus,
  GroupRead,
  TripRead,
} from '../../shared/models/domain.models';
import { formatDate } from '../../shared/utils/date.utils';
import { formatMoney } from '../../shared/utils/money.utils';
import { isTripManager } from '../../shared/utils/permissions.utils';

interface ItineraryDay {
  date: string;
  dayNumber: number;
  activities: ActivityRead[];
}

@Component({
  selector: 'app-itinerario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './itinerario.component.html',
  styleUrl: './itinerario.component.css',
})
export class ItinerarioComponent implements OnInit {
  private readonly notificationDestroyRef = inject(DestroyRef);
  private readonly notificationRoute = inject(ActivatedRoute);
  private readonly activitiesApi = inject(ActivitiesApiService);
  private readonly tripsApi = inject(TripsApiService);
  private readonly groupsApi = inject(GroupsApiService);

  readonly trips = signal<TripRead[]>([]);
  readonly groups = signal<GroupRead[]>([]);
  readonly selectedTripId = signal<number | null>(null);
  readonly activities = signal<ActivityRead[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly form = signal<ActivityCreate>({
    title: '',
    description: null,
    location: null,
    activity_date: '',
    start_time: null,
    estimated_cost: null,
  });

  readonly selectedTrip = computed(
    () => this.trips().find((t) => t.id === this.selectedTripId()) ?? null,
  );
  readonly canManage = computed(() => isTripManager(this.selectedTrip()));
  readonly itineraryDays = computed<ItineraryDay[]>(() => {
    const groups = new Map<string, ActivityRead[]>();
    for (const activity of this.activities()) {
      const list = groups.get(activity.activity_date) ?? [];
      list.push(activity);
      groups.set(activity.activity_date, list);
    }
    return [...groups.keys()].sort().map((date, index) => ({
      date,
      dayNumber: index + 1,
      activities: [...(groups.get(date) ?? [])].sort((a, b) =>
        (a.start_time ?? '23:59').localeCompare(b.start_time ?? '23:59'),
      ),
    }));
  });
  readonly formatMoney = formatMoney;
  readonly formatDate = formatDate;

  ngOnInit(): void {
    this.notificationRoute.queryParamMap.pipe(takeUntilDestroyed(this.notificationDestroyRef)).subscribe(params => {
      const id = Number(params.get('trip'));
      if (id && id !== this.selectedTripId() && this.trips().some(trip => trip.id === id)) {
        this.selectedTripId.set(id); this.closeForm(); this.loadItinerary(id);
      }
    });
    this.loadGroups();
    this.loadTrips();
  }

  loadGroups(): void {
    allPages(page => this.groupsApi.list({ page, page_size: 100 })).subscribe({
      next: (p) => this.groups.set(p.items),
      error: () => this.groups.set([]),
    });
  }

  loadTrips(): void {
    allPages(page => this.tripsApi.list({ page, page_size: 100 })).subscribe({
      next: (p) => {
        this.trips.set(p.items);
        if (p.items.length && this.selectedTripId() === null) {
          this.selectedTripId.set((p.items.find(trip => trip.id === Number(this.notificationRoute.snapshot.queryParamMap.get('trip'))) ?? p.items[0]).id);
          this.loadItinerary((p.items.find(trip => trip.id === Number(this.notificationRoute.snapshot.queryParamMap.get('trip'))) ?? p.items[0]).id);
        }
      },
      error: () => this.fail('No se pudieron cargar los viajes.'),
    });
  }

  loadItinerary(tripId: number): void {
    this.loading.set(true);
    this.error.set(null);
    allPages(page => this.activitiesApi.list(tripId, { page, page_size: 100 })).subscribe({
      next: (p) => {
        this.activities.set(p.items);
        this.loading.set(false);
      },
      error: (e) => {
        this.activities.set([]);
        this.loading.set(false);
        this.failError(e, 'Error al cargar el itinerario.');
      },
    });
  }

  onTripSelect(event: Event): void {
    const id = Number((event.target as HTMLSelectElement).value);
    this.closeForm();
    if (!id) {
      this.selectedTripId.set(null);
      this.activities.set([]);
      return;
    }
    this.selectedTripId.set(id);
    this.loadItinerary(id);
  }

  openCreate(): void {
    const trip = this.selectedTrip();
    if (!trip) return;
    this.editingId.set(null);
    this.form.set({
      title: '',
      description: null,
      location: null,
      activity_date: trip.start_date ?? '',
      start_time: null,
      estimated_cost: null,
    });
    this.showForm.set(true);
  }

  openEdit(item: ActivityRead): void {
    if (!this.canManage()) return;
    this.editingId.set(item.id);
    this.form.set({
      title: item.title,
      description: item.description,
      location: item.location,
      activity_date: item.activity_date,
      start_time: item.start_time,
      estimated_cost: item.estimated_cost,
    });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  setField(field: keyof ActivityCreate, value: string): void {
    this.form.update((current) => ({
      ...current,
      [field]: ['description', 'location', 'start_time', 'estimated_cost'].includes(field)
        ? value || null
        : value,
    }));
  }

  saveActivity(): void {
    const tripId = this.selectedTripId();
    const data = this.form();
    if (!tripId || !data.title.trim() || !data.activity_date) return;

    this.saving.set(true);
    const payload: ActivityCreate = {
      ...data,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      location: data.location?.trim() || null,
      estimated_cost: data.estimated_cost ? String(data.estimated_cost) : null,
    };
    const request = this.editingId()
      ? this.activitiesApi.update(tripId, this.editingId()!, payload)
      : this.activitiesApi.create(tripId, payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.loadItinerary(tripId);
      },
      error: (e) => {
        this.saving.set(false);
        this.failError(e, 'No se pudo guardar la actividad.');
      },
    });
  }

  setStatus(item: ActivityRead, status: ActivityStatus): void {
    const tripId = this.selectedTripId();
    if (!tripId || !this.canManage()) return;
    this.activitiesApi.update(tripId, item.id, { status }).subscribe({
      next: () => this.loadItinerary(tripId),
      error: (e) => this.failError(e, 'No se pudo cambiar el estado.'),
    });
  }

  deleteActivity(item: ActivityRead): void {
    const tripId = this.selectedTripId();
    if (!tripId || !this.canManage() || !confirm(`¿Eliminar ${item.title}?`)) return;
    this.activitiesApi.delete(tripId, item.id).subscribe({
      next: () => this.loadItinerary(tripId),
      error: (e) => this.failError(e, 'No se pudo eliminar la actividad.'),
    });
  }

  groupName(id: number): string {
    return this.groups().find((g) => g.id === id)?.name || 'Grupo';
  }

  statusLabel(status: ActivityStatus): string {
    return { PROPOSED: 'Propuesta', APPROVED: 'Aprobada', CANCELLED: 'Cancelada' }[status];
  }

  private fail(message: string): void {
    this.error.set(message);
  }

  private failError(error: unknown, fallback: string): void {
    this.error.set(error instanceof ApiError ? error.message : fallback);
  }
}