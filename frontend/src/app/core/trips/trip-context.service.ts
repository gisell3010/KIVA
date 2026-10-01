import {
  Injectable,
  computed,
  inject,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { TripsApiService } from '../../data-access/api/trips-api.service';
import { TripRead } from '../../shared/models/domain.models';

@Injectable({ providedIn: 'root' })
export class TripContextService {
  private readonly auth = inject(AuthService);
  private readonly api = inject(TripsApiService);

  private readonly selected = signal<{
    version: number;
    trip: TripRead;
  } | null>(null);

  private selection = 0;

  readonly trip = computed(() => {
    const value = this.selected();

    return this.auth.user()
      && value?.version === this.auth.sessionVersion
        ? value.trip
        : null;
  });

  readonly tripId = computed(() => this.trip()?.id ?? null);

  async select(id: number): Promise<TripRead> {
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error('Selecciona un viaje válido.');
    }

    const request = ++this.selection;
    const version = this.auth.sessionVersion;

    this.selected.set(null);

    const trip = await firstValueFrom(this.api.get(id));

    if (
      request !== this.selection
      || version !== this.auth.sessionVersion
    ) {
      throw new Error('La selección del viaje cambió.');
    }

    this.selected.set({ version, trip });
    return trip;
  }

  requireTripId(): number {
    const id = this.tripId();

    if (id === null) {
      throw new Error('Primero selecciona un viaje.');
    }

    return id;
  }

  clear(): void {
    ++this.selection;
    this.selected.set(null);
  }
}