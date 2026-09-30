import { Component, ElementRef, HostListener, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { UsersApiService } from '../../../data-access/api/users-api.service';
import { GroupsApiService } from '../../../data-access/api/groups-api.service';
import { TripsApiService } from '../../../data-access/api/trips-api.service';
import { GroupRead, TripRead, UserPublic } from '../../../shared/models/domain.models';

interface SearchResult {
  type: 'grupo' | 'usuario' | 'viaje';
  id: string;
  title: string;
  subtitle: string;
  route: string;
  icon: string;
  iconBg: string;
  typeLabel: string;
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchComponent {
  private readonly usersApi = inject(UsersApiService);
  private readonly groupsApi = inject(GroupsApiService);
  private readonly tripsApi = inject(TripsApiService);
  private readonly elementRef = inject(ElementRef);

  readonly query = signal('');
  readonly isOpen = signal(false);

  readonly userResults = signal<UserPublic[]>([]);
  readonly groupResults = signal<GroupRead[]>([]);
  readonly tripResults = signal<TripRead[]>([]);

  readonly loading = signal(false);

  readonly results = computed<SearchResult[]>(() => {
    const q = this.query()
      .toLowerCase()
      .trim();

    if (q.length < 2) {
      return [];
    }

    const results: SearchResult[] = [];

    for (const user of this.userResults()) {
      if (
        user.full_name
          .toLowerCase()
          .includes(q) ||
        user.username
          .toLowerCase()
          .includes(q)
      ) {
        results.push({
          type: 'usuario',
          id: `usuario-${user.id}`,
          title: user.full_name,
          subtitle: `@${user.username}`,
          route: '/participantes',
          icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2',
          iconBg: 'rgba(59,130,246,0.15)',
          typeLabel: 'Participante'
        });
      }
    }

    for (const group of this.groupResults()) {
      if (
        group.name
          .toLowerCase()
          .includes(q) ||
        group.description
          ?.toLowerCase()
          .includes(q)
      ) {
        results.push({
          type: 'grupo',
          id: `grupo-${group.id}`,
          title: group.name,
          subtitle: group.description || '',
          route: '/grupos',
          icon: 'M3 20l7-14 4 8 3-5 4 11H3Z',
          iconBg: 'rgba(168,85,247,0.15)',
          typeLabel: 'Grupo'
        });
      }
    }

    for (const trip of this.tripResults()) {
      if (
        trip.name
          .toLowerCase()
          .includes(q) ||
        trip.description
          ?.toLowerCase()
          .includes(q)
      ) {
        results.push({
          type: 'viaje',
          id: `viaje-${trip.id}`,
          title: trip.name,
          subtitle: trip.description || trip.group_name,
          route: '/viajes',
          icon: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z',
          iconBg: 'rgba(34,197,94,0.15)',
          typeLabel: 'Viaje'
        });
      }
    }

    return results.slice(0, 8);
  });

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.query.set(value);
    this.isOpen.set(true);

    this.search(value.trim());
  }

  onFocus(): void {
    if (this.query().trim().length >= 2) {
      this.isOpen.set(true);
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.isOpen.set(false);

      (event.target as HTMLInputElement)
        .blur();
    }
  }

  clear(): void {
    this.query.set('');
    this.isOpen.set(false);

    this.userResults.set([]);
    this.groupResults.set([]);
    this.tripResults.set([]);
  }

  selectResult(): void {
    this.isOpen.set(false);
  }

  private search(query: string): void {
    if (query.length < 2) {
      this.userResults.set([]);
      this.groupResults.set([]);
      this.tripResults.set([]);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);

    forkJoin({
      users: this.usersApi.search(
        query,
        {
          page: 1,
          page_size: 5
        }
      ).pipe(
        catchError(() =>
          of({
            items: [] as UserPublic[],
            total: 0,
            page: 1,
            page_size: 5
          })
        )
      ),

      groups: this.groupsApi.list({
        page: 1,
        page_size: 100
      }).pipe(
        catchError(() =>
          of({
            items: [] as GroupRead[],
            total: 0,
            page: 1,
            page_size: 100
          })
        )
      ),

      trips: this.tripsApi.list({
        page: 1,
        page_size: 100
      }).pipe(
        catchError(() =>
          of({
            items: [] as TripRead[],
            total: 0,
            page: 1,
            page_size: 100
          })
        )
      )
    }).subscribe({
      next: ({ users, groups, trips }) => {
        if (
          this.query().trim() !== query
        ) {
          return;
        }

        this.userResults.set(users.items);
        this.groupResults.set(groups.items);
        this.tripResults.set(trips.items);
        this.loading.set(false);
      },

      error: () => {
        this.loading.set(false);
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (
      this.isOpen() &&
      !this.elementRef.nativeElement.contains(event.target)
    ) {
      this.isOpen.set(false);
    }
  }
}