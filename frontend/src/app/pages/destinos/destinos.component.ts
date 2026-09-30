import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DestinationsApiService } from '../../data-access/api/destinations-api.service';
import { TripsApiService } from '../../data-access/api/trips-api.service';
import { GroupsApiService } from '../../data-access/api/groups-api.service';
import { TripRead, DestinationRead, DestinationPhotoRead, GroupRead } from '../../shared/models/domain.models';
import { PrivateImageComponent } from '../../shared/components/private-image/private-image.component';
import { ApiError } from '../../core/http/error.interceptor';

@Component({
  selector: 'app-destinos',
  standalone: true,
  imports: [CommonModule, PrivateImageComponent],
  templateUrl: './destinos.component.html',
  styleUrl: './destinos.component.css'
})
export class DestinosComponent implements OnInit {
  private readonly destinationsApi = inject(DestinationsApiService);
  private readonly tripsApi = inject(TripsApiService);
  private readonly groupsApi = inject(GroupsApiService);

  readonly trips = signal<TripRead[]>([]);
  readonly groups = signal<GroupRead[]>([]);
  readonly destinations = signal<DestinationRead[]>([]);
  readonly photosCache = signal<Map<number, DestinationPhotoRead[]>>(new Map());

  readonly filterTrip = signal<number | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly filteredDestinations = computed(() => this.destinations());

  ngOnInit(): void {
    this.loadGroups();
    this.loadTrips();
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
          this.filterTrip() === null
        ) {
          const tripId = page.items[0].id;

          this.filterTrip.set(tripId);
          this.loadDestinations(tripId);
        }
      },

      error: () => {
        this.trips.set([]);
        this.filterTrip.set(null);
        this.destinations.set([]);
        this.photosCache.set(new Map());

        this.error.set(
          'No se pudieron cargar los viajes.'
        );
      }
    });
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

  loadDestinations(tripId: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.destinations.set([]);
    this.photosCache.set(new Map());

    this.destinationsApi.list(
      tripId,
      {
        page: 1,
        page_size: 100
      }
    ).subscribe({
      next: page => {
        this.destinations.set(page.items);

        for (const destination of page.items) {
          this.loadPhotos(
            tripId,
            destination.id
          );
        }

        this.loading.set(false);
      },

      error: (err: unknown) => {
        this.destinations.set([]);
        this.photosCache.set(new Map());

        if (err instanceof ApiError) {
          this.error.set(err.message);
        } else {
          this.error.set(
            'Error al cargar los destinos.'
          );
        }

        this.loading.set(false);
      }
    });
  }

  loadPhotos(
    tripId: number,
    destinationId: number
  ): void {
    this.destinationsApi
      .photos(
        tripId,
        destinationId
      )
      .subscribe({
        next: photos => {
          this.photosCache.update(current => {
            const updated = new Map(current);

            updated.set(
              destinationId,
              photos
            );

            return updated;
          });
        },

        error: () => {
          this.photosCache.update(current => {
            const updated = new Map(current);

            updated.set(
              destinationId,
              []
            );

            return updated;
          });
        }
      });
  }

  onTripSelect(event: Event): void {
    const select =
      event.target as HTMLSelectElement;

    const value = select.value;

    if (value === '') {
      this.filterTrip.set(null);
      this.destinations.set([]);
      this.photosCache.set(new Map());
      this.error.set(null);
      return;
    }

    const tripId = parseInt(
      value,
      10
    );

    if (isNaN(tripId)) {
      this.filterTrip.set(null);
      this.destinations.set([]);
      this.photosCache.set(new Map());
      return;
    }

    this.filterTrip.set(tripId);
    this.loadDestinations(tripId);
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

  getPhotos(
    destinationId: number
  ): DestinationPhotoRead[] {
    return this.photosCache().get(
      destinationId
    ) ?? [];
  }

  destinationDescription(
    description: string | null
  ): string {
    return description?.trim() ||
      'Sin descripción.';
  }
}