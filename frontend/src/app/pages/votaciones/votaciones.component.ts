import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { PollsApiService } from '../../data-access/api/polls-api.service';
import { TripsApiService } from '../../data-access/api/trips-api.service';
import { GroupsApiService } from '../../data-access/api/groups-api.service';
import { TripRead, GroupRead, PollRead, PollDetail, PollResults } from '../../shared/models/domain.models';
import { formatDate } from '../../shared/utils/date.utils';
import { ApiError } from '../../core/http/error.interceptor';

@Component({
  selector: 'app-votaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './votaciones.component.html',
  styleUrl: './votaciones.component.css'
})
export class VotacionesComponent implements OnInit {
  private readonly pollsApi = inject(PollsApiService);
  private readonly tripsApi = inject(TripsApiService);
  private readonly groupsApi = inject(GroupsApiService);

  readonly trips = signal<TripRead[]>([]);
  readonly groups = signal<GroupRead[]>([]);
  readonly polls = signal<PollRead[]>([]);

  readonly selectedTripId = signal<number | null>(null);
  readonly selectedPoll = signal<PollDetail | null>(null);
  readonly pollResults = signal<PollResults | null>(null);
  readonly selectedOptionIds = signal<number[]>([]);

  readonly loading = signal(false);
  readonly loadingPoll = signal(false);
  readonly voting = signal(false);
  readonly error = signal<string | null>(null);

  readonly formatDate = formatDate;

  ngOnInit(): void {
    this.loadTrips();
    this.loadGroups();
  }

  loadTrips(): void {
    this.tripsApi.list({
      page: 1,
      page_size: 100
    }).subscribe({
      next: page => {
        this.trips.set(page.items);
      },

      error: () => {
        this.trips.set([]);
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

  loadPolls(): void {
    const tripId = this.selectedTripId();

    if (tripId === null) {
      this.polls.set([]);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.pollsApi.list(
      tripId,
      {
        page: 1,
        page_size: 100
      }
    ).subscribe({
      next: page => {
        this.polls.set(page.items);
        this.loading.set(false);
      },

      error: (err: unknown) => {
        this.polls.set([]);

        if (err instanceof ApiError) {
          this.error.set(err.message);
        } else {
          this.error.set('Error al cargar las votaciones.');
        }

        this.loading.set(false);
      }
    });
  }

  onTripSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = select.value;

    this.closePoll();

    if (value === '') {
      this.selectedTripId.set(null);
      this.polls.set([]);
      this.error.set(null);
      return;
    }

    const tripId = parseInt(value, 10);

    if (isNaN(tripId)) {
      this.selectedTripId.set(null);
      this.polls.set([]);
      return;
    }

    this.selectedTripId.set(tripId);
    this.loadPolls();
  }

  openPoll(pollId: number): void {
    const tripId = this.selectedTripId();

    if (tripId === null) {
      return;
    }

    this.loadingPoll.set(true);
    this.error.set(null);

    forkJoin({
      detail: this.pollsApi.get(tripId, pollId),
      results: this.pollsApi.results(tripId, pollId)
    }).subscribe({
      next: ({ detail, results }) => {
        this.selectedPoll.set(detail);
        this.pollResults.set(results);

        this.selectedOptionIds.set(
          results.options
            .filter(option => option.selected_by_me)
            .map(option => option.id)
        );

        this.loadingPoll.set(false);
      },

      error: (err: unknown) => {
        this.selectedPoll.set(null);
        this.pollResults.set(null);
        this.selectedOptionIds.set([]);

        if (err instanceof ApiError) {
          this.error.set(err.message);
        } else {
          this.error.set('No se pudo cargar la votación.');
        }

        this.loadingPoll.set(false);
      }
    });
  }

  closePoll(): void {
    this.selectedPoll.set(null);
    this.pollResults.set(null);
    this.selectedOptionIds.set([]);
  }

  isSelected(optionId: number): boolean {
    return this.selectedOptionIds().includes(optionId);
  }

  toggleOption(optionId: number): void {
    const poll = this.selectedPoll();

    if (!poll || poll.status !== 'OPEN' || this.voting()) {
      return;
    }

    this.selectedOptionIds.update(current =>
      current.includes(optionId)
        ? current.filter(id => id !== optionId)
        : [...current, optionId]
    );
  }

  saveVotes(): void {
    const tripId = this.selectedTripId();
    const poll = this.selectedPoll();

    if (
      tripId === null ||
      !poll ||
      poll.status !== 'OPEN'
    ) {
      return;
    }

    this.voting.set(true);
    this.error.set(null);

    this.pollsApi.setVotes(
      tripId,
      poll.id,
      this.selectedOptionIds()
    ).subscribe({
      next: () => {
        this.refreshResults(tripId, poll.id);
      },

      error: (err: unknown) => {
        if (err instanceof ApiError) {
          this.error.set(err.message);
        } else {
          this.error.set('No se pudieron guardar los votos.');
        }

        this.voting.set(false);
      }
    });
  }

  resultFor(optionId: number) {
    return this.pollResults()
      ?.options
      .find(option => option.id === optionId) ?? null;
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

  statusBadge(status: string): string {
    switch (status) {
      case 'OPEN':
        return 'badge-green';

      case 'CLOSED':
        return 'badge-red';

      default:
        return 'badge-gray';
    }
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'OPEN':
        return 'Abierta';

      case 'CLOSED':
        return 'Cerrada';

      default:
        return status;
    }
  }

  private refreshResults(tripId: number, pollId: number): void {
    this.pollsApi.results(tripId, pollId).subscribe({
      next: results => {
        this.pollResults.set(results);

        this.selectedOptionIds.set(
          results.options
            .filter(option => option.selected_by_me)
            .map(option => option.id)
        );

        this.voting.set(false);
      },

      error: () => {
        this.voting.set(false);

        this.error.set(
          'Los votos se guardaron, pero no se pudieron actualizar los resultados.'
        );
      }
    });
  }
}