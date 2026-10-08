import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { allPages } from '../../core/http/all-pages';
import { CommonModule } from '@angular/common';
import { Component, OnInit, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/http/error.interceptor';
import { DestinationsApiService } from '../../data-access/api/destinations-api.service';
import { GroupsApiService } from '../../data-access/api/groups-api.service';
import { TripsApiService } from '../../data-access/api/trips-api.service';
import { PrivateImageComponent } from '../../shared/components/private-image/private-image.component';
import {
  DestinationCreate,
  DestinationPhotoRead,
  DestinationRead,
  GroupRead,
  TripRead,
} from '../../shared/models/domain.models';
import { isTripManager } from '../../shared/utils/permissions.utils';

@Component({
  selector: 'app-destinos',
  standalone: true,
  imports: [CommonModule, FormsModule, PrivateImageComponent],
  templateUrl: './destinos.component.html',
  styleUrl: './destinos.component.css',
})
export class DestinosComponent implements OnInit {
  private readonly notificationDestroyRef = inject(DestroyRef);
  private readonly notificationRoute = inject(ActivatedRoute);
  private readonly destinationsApi = inject(DestinationsApiService);
  private readonly tripsApi = inject(TripsApiService);
  private readonly groupsApi = inject(GroupsApiService);
  private readonly auth = inject(AuthService);

  readonly trips = signal<TripRead[]>([]);
  readonly groups = signal<GroupRead[]>([]);
  readonly destinations = signal<DestinationRead[]>([]);
  readonly photosCache = signal<Map<number, DestinationPhotoRead[]>>(new Map());
  readonly filterTrip = signal<number | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly uploadingDestinationId = signal<number | null>(null);
  readonly error = signal<string | null>(null);
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly form = signal<DestinationCreate>({ country: '', place_name: '', description: null });

  readonly currentUser = this.auth.user;
  readonly selectedTrip = computed(
    () => this.trips().find((t) => t.id === this.filterTrip()) ?? null,
  );
  readonly canManage = computed(() => isTripManager(this.selectedTrip()));

  ngOnInit(): void {
    this.notificationRoute.queryParamMap.pipe(takeUntilDestroyed(this.notificationDestroyRef)).subscribe(params => {
      const id = Number(params.get('trip'));
      if (id && id !== this.filterTrip() && this.trips().some(trip => trip.id === id)) {
        this.filterTrip.set(id); this.closeForm(); this.loadDestinations(id);
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
        if (p.items.length && this.filterTrip() === null) {
          this.filterTrip.set((p.items.find(trip => trip.id === Number(this.notificationRoute.snapshot.queryParamMap.get('trip'))) ?? p.items[0]).id);
          this.loadDestinations((p.items.find(trip => trip.id === Number(this.notificationRoute.snapshot.queryParamMap.get('trip'))) ?? p.items[0]).id);
        }
      },
      error: () => this.fail('No se pudieron cargar los viajes.'),
    });
  }

  loadDestinations(tripId: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.photosCache.set(new Map());
    allPages(page => this.destinationsApi.list(tripId, { page, page_size: 100 })).subscribe({
      next: (p) => {
        this.destinations.set(p.items);
        p.items.forEach((d) => this.loadPhotos(tripId, d.id));
        this.loading.set(false);
      },
      error: (e) => {
        this.destinations.set([]);
        this.loading.set(false);
        this.failError(e, 'Error al cargar los destinos.');
      },
    });
  }

  loadPhotos(tripId: number, destinationId: number): void {
    this.destinationsApi.photos(tripId, destinationId).subscribe({
      next: (photos) =>
        this.photosCache.update((current) => new Map(current).set(destinationId, photos)),
      error: () =>
        this.photosCache.update((current) => new Map(current).set(destinationId, [])),
    });
  }

  onTripSelect(event: Event): void {
    const id = Number((event.target as HTMLSelectElement).value);
    this.closeForm();
    if (!id) {
      this.filterTrip.set(null);
      this.destinations.set([]);
      return;
    }
    this.filterTrip.set(id);
    this.loadDestinations(id);
  }

  openCreate(): void {
    if (!this.filterTrip()) return;
    this.editingId.set(null);
    this.form.set({ country: '', place_name: '', description: null });
    this.showForm.set(true);
  }

  openEdit(item: DestinationRead): void {
    this.editingId.set(item.id);
    this.form.set({
      country: item.country,
      place_name: item.place_name,
      description: item.description,
    });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  setField(field: keyof DestinationCreate, value: string): void {
    this.form.update((current) => ({
      ...current,
      [field]: field === 'description' ? value.trim() || null : value,
    }));
  }

  saveDestination(): void {
    const tripId = this.filterTrip();
    const data = this.form();
    if (!tripId || !data.country.trim() || !data.place_name.trim()) return;

    this.saving.set(true);
    this.error.set(null);

    const payload: DestinationCreate = {
      country: data.country.trim(),
      place_name: data.place_name.trim(),
      description: data.description?.trim() || null,
    };
    const request = this.editingId()
      ? this.destinationsApi.update(tripId, this.editingId()!, payload)
      : this.destinationsApi.create(tripId, payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.loadDestinations(tripId);
      },
      error: (e) => {
        this.saving.set(false);
        this.failError(e, 'No se pudo guardar el destino.');
      },
    });
  }

  canEdit(item: DestinationRead): boolean {
    return (
      this.canManage() || (item.proposed_by_user_id === this.auth.user()?.id && !item.is_selected)
    );
  }

  toggleSelection(item: DestinationRead): void {
    const tripId = this.filterTrip();
    if (!tripId || !this.canManage()) return;
    this.destinationsApi.select(tripId, item.id, !item.is_selected).subscribe({
      next: () => this.loadDestinations(tripId),
      error: (e) => this.failError(e, 'No se pudo cambiar la selección.'),
    });
  }

  deleteDestination(item: DestinationRead): void {
    const tripId = this.filterTrip();
    if (!tripId || !this.canEdit(item) || !confirm(`¿Eliminar ${item.place_name}?`)) return;
    this.destinationsApi.delete(tripId, item.id).subscribe({
      next: () => this.loadDestinations(tripId),
      error: (e) => this.failError(e, 'No se pudo eliminar el destino.'),
    });
  }

  uploadPhoto(item: DestinationRead, event: Event): void {
    const tripId = this.filterTrip();
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!tripId || !file || this.uploadingDestinationId() !== null) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      this.fail('Selecciona una imagen válida de máximo 5 MB.');
      return;
    }
    this.uploadingDestinationId.set(item.id);
    this.error.set(null);
    this.destinationsApi.uploadPhoto(tripId, item.id, file).subscribe({
      next: () => { this.uploadingDestinationId.set(null); this.loadPhotos(tripId, item.id); },
      error: (e) => { this.uploadingDestinationId.set(null); this.failError(e, 'No se pudo subir la fotografía.'); },
    });
  }

  deletePhoto(item: DestinationRead, photo: DestinationPhotoRead): void {
    const tripId = this.filterTrip();
    const own = photo.uploaded_by_user_id === this.auth.user()?.id;
    if (!tripId || (!own && !this.canManage()) || !confirm('¿Eliminar esta fotografía?')) return;
    this.destinationsApi.deletePhoto(tripId, item.id, photo.id).subscribe({
      next: () => this.loadPhotos(tripId, item.id),
      error: (e) => this.failError(e, 'No se pudo eliminar la fotografía.'),
    });
  }

  getPhotos(id: number): DestinationPhotoRead[] {
    return this.photosCache().get(id) ?? [];
  }

  groupName(groupId: number): string {
    return this.groups().find((g) => g.id === groupId)?.name || 'Grupo';
  }

  roleLabel(role: string | null | undefined): string {
    return role === 'OWNER'
      ? 'Responsable del viaje'
      : role === 'ORGANIZER'
        ? 'Organizador'
        : 'Participante';
  }

  photoSrc(item: DestinationRead, photo: DestinationPhotoRead): string {
    return photo.image_url || `/trips/${item.trip_id}/destinations/${item.id}/photos/${photo.id}/file`;
  }

  private fail(message: string): void {
    this.error.set(message);
  }

  private failError(error: unknown, fallback: string): void {
    this.error.set(error instanceof ApiError ? error.message : fallback);
  }
}