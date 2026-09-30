import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivitiesApiService } from '../../data-access/api/activities-api.service';
import { TripsApiService } from '../../data-access/api/trips-api.service';
import { GroupsApiService } from '../../data-access/api/groups-api.service';
import { TripRead, ActivityRead, GroupRead } from '../../shared/models/domain.models';
import { formatMoney } from '../../shared/utils/money.utils';
import { formatDate } from '../../shared/utils/date.utils';
import { ApiError } from '../../core/http/error.interceptor';

interface ItineraryDay {
  date: string;
  dayNumber: number;
  activities: ActivityRead[];
}

@Component({
  selector: 'app-itinerario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './itinerario.component.html',
  styleUrl: './itinerario.component.css'
})
export class ItinerarioComponent implements OnInit {
  private readonly activitiesApi = inject(ActivitiesApiService);
  private readonly tripsApi = inject(TripsApiService);
  private readonly groupsApi = inject(GroupsApiService);

  readonly trips = signal<TripRead[]>([]);
  readonly groups = signal<GroupRead[]>([]);

  readonly selectedTripId = signal<number | null>(null);
  readonly itineraryDays = signal<ItineraryDay[]>([]);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly formatMoney = formatMoney;
  readonly formatDate = formatDate;

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
          this.selectedTripId() === null
        ) {
          const tripId = page.items[0].id;

          this.selectedTripId.set(tripId);
          this.loadItinerary(tripId);
        }
      },

      error: () => {
        this.trips.set([]);
        this.selectedTripId.set(null);
        this.itineraryDays.set([]);
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

  loadItinerary(tripId: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.activitiesApi.list(
      tripId,
      {
        page: 1,
        page_size: 100
      }
    ).subscribe({
      next: page => {
        const daysMap = new Map<string, ActivityRead[]>();

        for (const activity of page.items) {
          if (!activity.activity_date) {
            continue;
          }

          const date = activity.activity_date.split('T')[0];

          const activities = daysMap.get(date) ?? [];

          activities.push(activity);
          daysMap.set(date, activities);
        }

        const sortedDates = Array.from(
          daysMap.keys()
        ).sort();

        const days: ItineraryDay[] = sortedDates.map(
          (date, index) => {
            const activities = [
              ...(daysMap.get(date) ?? [])
            ].sort((a, b) => {
              const timeA = a.start_time ?? '23:59';
              const timeB = b.start_time ?? '23:59';

              return timeA.localeCompare(timeB);
            });

            return {
              date,
              dayNumber: index + 1,
              activities
            };
          }
        );

        this.itineraryDays.set(days);
        this.loading.set(false);
      },

      error: (err: unknown) => {
        this.itineraryDays.set([]);

        if (err instanceof ApiError) {
          this.error.set(err.message);
        } else {
          this.error.set(
            'Error al cargar el itinerario.'
          );
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
      this.itineraryDays.set([]);
      this.error.set(null);
      return;
    }

    const tripId = parseInt(value, 10);

    if (isNaN(tripId)) {
      this.selectedTripId.set(null);
      this.itineraryDays.set([]);
      return;
    }

    this.selectedTripId.set(tripId);
    this.loadItinerary(tripId);
  }

  groupName(groupId: number): string {
    return this.groups().find(
      group => group.id === groupId
    )?.name || 'Grupo';
  }

  activityLocation(location: string | null): string {
    return location?.trim() || 'Ubicación no especificada';
  }

  activityDescription(description: string | null): string {
    return description?.trim() || 'Sin descripción';
  }
}