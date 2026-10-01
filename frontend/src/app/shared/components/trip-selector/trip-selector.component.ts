import {
  Component,
  input,
  output,
  inject,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TripsApiService } from '../../../data-access/api/trips-api.service';
import { TripRead, Pagination } from '../../../shared/models/domain.models';

@Component({
  selector: 'app-trip-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="trip-selector">
      <label [for]="selectId()" class="sr-only">Seleccionar viaje</label>
      <select
        [id]="selectId()"
        [value]="selectedTripId()"
        (change)="onChange($event)"
        [disabled]="loading()"
        class="trip-select"
        aria-label="Seleccionar viaje"
      >
        <option value="">-- Seleccionar viaje --</option>
        @for (trip of trips(); track trip.id) {
          <option [value]="trip.id">{{ trip.name }} ({{ trip.group_name }})</option>
        }
      </select>
      @if (loading()) {
        <span class="loading-indicator" aria-hidden="true"></span>
      }
    </div>
  `,
  styles: [`
    .trip-selector {
      position: relative;
      display: inline-flex;
      align-items: center;
    }
    .trip-select {
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      padding: 8px 36px 8px 12px;
      background: var(--bg-input);
      border: 1px solid var(--border-soft);
      border-radius: 10px;
      color: var(--text-primary);
      font-size: 0.9rem;
      font-family: inherit;
      min-width: 280px;
      cursor: pointer;
    }
    .trip-select:focus {
      outline: none;
      border-color: var(--accent-blue);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }
    .trip-select:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .loading-indicator {
      position: absolute;
      right: 10px;
      width: 16px;
      height: 16px;
      border: 2px solid var(--border-soft);
      border-top-color: var(--accent-blue);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @media (max-width: 600px) {
      .trip-select { min-width: 200px; }
    }
  `]
})
export class TripSelectorComponent {
  private readonly tripsApi = inject(TripsApiService);

  readonly selectId = input('trip-select');
  readonly selectedTripId = input<number | null>(null);
  readonly groupId = input<number | null>(null);
  readonly tripChange = output<number | null>();

  loading = signal(false);

  trips = signal<TripRead[]>([]);

  constructor() {
    this.loadTrips();
  }

  private loadTrips(): void {
    this.loading.set(true);
    const groupId = this.groupId();
    this.tripsApi
      .list({ page: 1, page_size: 100, group_id: groupId ?? undefined })
      .subscribe({
        next: (page) => {
          this.trips.set(page.items);
          this.loading.set(false);
        },
        error: () => {
          this.trips.set([]);
          this.loading.set(false);
        },
      });
  }

  onChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const tripId = value ? Number(value) : null;
    this.tripChange.emit(tripId);
  }
}

import { signal } from '@angular/core';