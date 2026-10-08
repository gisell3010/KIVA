import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { allPages } from '../../core/http/all-pages';
import { CommonModule } from '@angular/common';
import { Component, OnInit, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiError } from '../../core/http/error.interceptor';
import { DestinationsApiService } from '../../data-access/api/destinations-api.service';
import { GroupsApiService } from '../../data-access/api/groups-api.service';
import { PollsApiService } from '../../data-access/api/polls-api.service';
import { TripsApiService } from '../../data-access/api/trips-api.service';
import { PrivateImageComponent } from '../../shared/components/private-image/private-image.component';
import {
  DestinationPhotoRead,
  GroupRead,
  PollCreate,
  PollDetail,
  PollRead,
  PollResults,
  TripRead,
} from '../../shared/models/domain.models';
import { formatDate } from '../../shared/utils/date.utils';
import { isTripManager } from '../../shared/utils/permissions.utils';

@Component({
  selector: 'app-votaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, PrivateImageComponent],
  templateUrl: './votaciones.component.html',
  styleUrl: './votaciones.component.css',
})
export class VotacionesComponent implements OnInit {
  private readonly notificationDestroyRef = inject(DestroyRef);
  private readonly notificationRoute = inject(ActivatedRoute);
  private readonly pollsApi = inject(PollsApiService);
  private readonly destinationsApi = inject(DestinationsApiService);
  private readonly tripsApi = inject(TripsApiService);
  private readonly groupsApi = inject(GroupsApiService);

  readonly trips = signal<TripRead[]>([]);
  readonly groups = signal<GroupRead[]>([]);
  readonly polls = signal<PollRead[]>([]);
  readonly coverPhotoSrc = signal<string | null>(null);
  readonly coverDestinationLabel = signal('');
  readonly coverLoading = signal(false);

  readonly selectedTripId = signal<number | null>(null);
  readonly selectedPoll = signal<PollDetail | null>(null);
  readonly pollResults = signal<PollResults | null>(null);
  readonly selectedOptionIds = signal<number[]>([]);

  readonly loading = signal(false);
  readonly loadingPoll = signal(false);
  readonly voting = signal(false);
  readonly error = signal<string | null>(null);
  readonly showCreate = signal(false);
  readonly savingPoll = signal(false);
  readonly pollForm = signal({ question: '', closes_at: '', options: ['', ''] });

  readonly currentTrip = computed(
    () => this.trips().find((t) => t.id === this.selectedTripId()) ?? null
  );
  readonly canManage = computed(() => isTripManager(this.currentTrip()));

  readonly formatDate = formatDate;

  ngOnInit(): void {
    this.notificationRoute.queryParamMap.pipe(takeUntilDestroyed(this.notificationDestroyRef)).subscribe(params => {
      const id = Number(params.get('trip'));
      if (id && id !== this.selectedTripId() && this.trips().some(trip => trip.id === id)) {
        this.selectedTripId.set(id); this.closePoll(); this.loadPolls(); this.loadTripCover(id);
      }
    });
    this.loadTrips();
    this.loadGroups();
  }

  loadTrips(): void {
    allPages(page => this.tripsApi.list({ page, page_size: 100 }))
      .subscribe({
        next: (page) => {
          this.trips.set(page.items);

          if (page.items.length && this.selectedTripId() === null) {
            const firstTripId = (page.items.find(trip => trip.id === Number(this.notificationRoute.snapshot.queryParamMap.get('trip'))) ?? page.items[0]).id;
            this.selectedTripId.set(firstTripId);
            this.loadPolls();
            this.loadTripCover(firstTripId);
          }
        },
        error: () => {
          this.trips.set([]);
        },
      });
  }

  loadGroups(): void {
    allPages(page => this.groupsApi.list({ page, page_size: 100 }))
      .subscribe({
        next: (page) => {
          this.groups.set(page.items);
        },
        error: () => {
          this.groups.set([]);
        },
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

    allPages(page => this.pollsApi.list(tripId, { page, page_size: 100 }))
      .subscribe({
        next: (page) => {
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
        },
      });
  }

  onTripSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = select.value;

    this.closePoll();

    if (value === '') {
      this.selectedTripId.set(null);
      this.polls.set([]);
      this.coverPhotoSrc.set(null);
      this.coverDestinationLabel.set('');
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
    this.loadTripCover(tripId);
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
      results: this.pollsApi.results(tripId, pollId),
    }).subscribe({
      next: ({ detail, results }) => {
        this.selectedPoll.set(detail);
        this.pollResults.set(results);

        this.selectedOptionIds.set(
          results.options
            .filter((option) => option.selected_by_me)
            .map((option) => option.id)
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
      },
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

    this.selectedOptionIds.update((current) =>
      current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId]
    );
  }

  saveVotes(): void {
    const tripId = this.selectedTripId();
    const poll = this.selectedPoll();

    if (tripId === null || !poll || poll.status !== 'OPEN') {
      return;
    }

    this.voting.set(true);
    this.error.set(null);

    this.pollsApi.setVotes(tripId, poll.id, this.selectedOptionIds()).subscribe({
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
      },
    });
  }

  resultFor(optionId: number) {
    return (
      this.pollResults()?.options.find((option) => option.id === optionId) ?? null
    );
  }

  tripName(tripId: number): string {
    return this.trips().find((trip) => trip.id === tripId)?.name || 'Viaje';
  }

  groupName(groupId: number): string {
    return this.groups().find((group) => group.id === groupId)?.name || 'Grupo';
  }

  roleLabel(role: string | null | undefined): string {
    return role === 'OWNER'
      ? 'Responsable del viaje'
      : role === 'ORGANIZER'
        ? 'Organizador'
        : 'Participante';
  }

  private loadTripCover(tripId: number): void {
    this.coverLoading.set(true);
    this.coverPhotoSrc.set(null);
    this.coverDestinationLabel.set('');

    allPages(page => this.destinationsApi.list(tripId, { page, page_size: 100 }))
      .subscribe({
        next: (page) => {
          if (this.selectedTripId() !== tripId) return;

          const destinations = [...page.items].sort(
            (a, b) => Number(b.is_selected) - Number(a.is_selected),
          );

          if (!destinations.length) {
            this.coverLoading.set(false);
            return;
          }

          const requests = destinations.map((destination) =>
            this.destinationsApi
              .photos(tripId, destination.id)
              .pipe(catchError(() => of([] as DestinationPhotoRead[]))),
          );

          forkJoin(requests).subscribe({
            next: (photoLists) => {
              if (this.selectedTripId() !== tripId) return;

              const index = photoLists.findIndex((photos) => photos.length > 0);

              if (index >= 0) {
                const destination = destinations[index];
                const photo = photoLists[index][0];

                this.coverDestinationLabel.set(
                  `${destination.place_name}, ${destination.country}`,
                );
                this.coverPhotoSrc.set(
                  photo.image_url ||
                    `/trips/${tripId}/destinations/${destination.id}/photos/${photo.id}/file`,
                );
              } else {
                const destination = destinations[0];
                this.coverDestinationLabel.set(
                  `${destination.place_name}, ${destination.country}`,
                );
              }

              this.coverLoading.set(false);
            },
            error: () => {
              if (this.selectedTripId() === tripId) {
                this.coverLoading.set(false);
              }
            },
          });
        },
        error: () => {
          if (this.selectedTripId() === tripId) {
            this.coverLoading.set(false);
          }
        },
      });
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

  openCreatePoll(): void {
    if (!this.canManage()) return;
    this.pollForm.set({ question: '', closes_at: '', options: ['', ''] });
    this.showCreate.set(true);
  }

  closeCreatePoll(): void {
    this.showCreate.set(false);
  }

  setPollQuestion(value: string): void {
    this.pollForm.update((f) => ({ ...f, question: value }));
  }

  setPollDeadline(value: string): void {
    this.pollForm.update((f) => ({ ...f, closes_at: value }));
  }

  setPollOption(index: number, value: string): void {
    this.pollForm.update((f) => ({
      ...f,
      options: f.options.map((item, i) => (i === index ? value : item)),
    }));
  }

  addPollOption(): void {
    this.pollForm.update((f) => ({ ...f, options: [...f.options, ''] }));
  }

  removePollOption(index: number): void {
    if (this.pollForm().options.length <= 2) return;
    this.pollForm.update((f) => ({
      ...f,
      options: f.options.filter((_, i) => i !== index),
    }));
  }

  createPoll(): void {
    const tripId = this.selectedTripId();
    const form = this.pollForm();
    const options = form.options.map((v) => v.trim()).filter(Boolean);

    if (!tripId || !this.canManage() || !form.question.trim() || options.length < 2) {
      return;
    }

    const data: PollCreate = {
      question: form.question.trim(),
      closes_at: form.closes_at ? new Date(form.closes_at).toISOString() : null,
      options: options.map((option_text) => ({ option_text })),
    };

    this.savingPoll.set(true);
    this.pollsApi.create(tripId, data).subscribe({
      next: () => {
        this.savingPoll.set(false);
        this.closeCreatePoll();
        this.loadPolls();
      },
      error: (e) => {
        this.savingPoll.set(false);
        this.error.set(
          e instanceof ApiError ? e.message : 'No se pudo crear la votación.'
        );
      },
    });
  }

  closeManagedPoll(poll: PollRead): void {
    const tripId = this.selectedTripId();
    if (!tripId || !this.canManage() || poll.status !== 'OPEN') return;

    this.pollsApi.close(tripId, poll.id).subscribe({
      next: () => {
        this.closePoll();
        this.loadPolls();
      },
      error: (e) =>
        this.error.set(
          e instanceof ApiError ? e.message : 'No se pudo cerrar la votación.'
        ),
    });
  }

  deleteManagedPoll(poll: PollRead): void {
    const tripId = this.selectedTripId();
    if (!tripId || !this.canManage() || !confirm('¿Eliminar esta votación?')) return;

    this.pollsApi.delete(tripId, poll.id).subscribe({
      next: () => {
        this.closePoll();
        this.loadPolls();
      },
      error: (e) =>
        this.error.set(
          e instanceof ApiError ? e.message : 'No se pudo eliminar la votación.'
        ),
    });
  }

  private refreshResults(tripId: number, pollId: number): void {
    this.pollsApi.results(tripId, pollId).subscribe({
      next: (results) => {
        this.pollResults.set(results);

        this.selectedOptionIds.set(
          results.options
            .filter((option) => option.selected_by_me)
            .map((option) => option.id)
        );

        this.voting.set(false);
      },
      error: () => {
        this.voting.set(false);
        this.error.set(
          'Los votos se guardaron, pero no se pudieron actualizar los resultados.'
        );
      },
    });
  }
}