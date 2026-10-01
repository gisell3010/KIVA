import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TripsApiService } from '../../data-access/api/trips-api.service';
import { GroupsApiService } from '../../data-access/api/groups-api.service';
import { Page, TripRead, TripStatus, TripRole, GroupRead } from '../../shared/models/domain.models';
import { formatDate } from '../../shared/utils/date.utils';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { ApiError } from '../../core/http/error.interceptor';

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PaginationComponent],
  templateUrl: './trips.component.html',
  styleUrl: './trips.component.css'
})
export class TripsComponent implements OnInit {
  private readonly tripsApi = inject(TripsApiService);
  private readonly groupsApi = inject(GroupsApiService);

  readonly trips = signal<TripRead[]>([]);
  readonly groups = signal<GroupRead[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly selectedGroupId = signal<number | null>(null);
  readonly selectedStatus = signal<TripStatus | 'all'>('all');

  readonly pagination = signal<Page<TripRead>>({
    items: [],
    total: 0,
    page: 1,
    page_size: 10
  });

  readonly statusOptions: {
    value: TripStatus | 'all';
    label: string;
  }[] = [
    {
      value: 'all',
      label: 'Todos los estados'
    },
    {
      value: 'PLANNING',
      label: 'Planificando'
    },
    {
      value: 'CONFIRMED',
      label: 'Confirmado'
    },
    {
      value: 'COMPLETED',
      label: 'Finalizado'
    },
    {
      value: 'CANCELLED',
      label: 'Cancelado'
    }
  ];

  ngOnInit(): void {
    this.loadGroups();
    this.loadTrips();
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

  loadTrips(): void {
    this.loading.set(true);
    this.error.set(null);

    const groupId = this.selectedGroupId();
    const status = this.selectedStatus();

    this.tripsApi.list({
      page: this.pagination().page,
      page_size: this.pagination().page_size,
      group_id: groupId ?? undefined
    }).subscribe({
      next: page => {
        const filteredTrips =
          status === 'all'
            ? page.items
            : page.items.filter(
                trip => trip.status === status
              );

        this.trips.set(filteredTrips);

        this.pagination.set({
          items: filteredTrips,
          total:
            status === 'all'
              ? page.total
              : filteredTrips.length,
          page: page.page,
          page_size: page.page_size
        });

        this.loading.set(false);
      },

      error: (err: unknown) => {
        this.trips.set([]);

        this.pagination.update(current => ({
          ...current,
          items: [],
          total: 0
        }));

        if (err instanceof ApiError) {
          this.error.set(err.message);
        } else {
          this.error.set(
            'Error al cargar los viajes.'
          );
        }

        this.loading.set(false);
      }
    });
  }

  onGroupFilterChange(
    groupId: number | null
  ): void {
    this.selectedGroupId.set(groupId);

    this.pagination.update(current => ({
      ...current,
      page: 1
    }));

    this.loadTrips();
  }

  onStatusFilterChange(
    status: TripStatus | 'all'
  ): void {
    this.selectedStatus.set(status);

    this.pagination.update(current => ({
      ...current,
      page: 1
    }));

    this.loadTrips();
  }

  onPageChange(page: number): void {
    this.pagination.update(current => ({
      ...current,
      page
    }));

    this.loadTrips();
  }

  getGroupName(groupId: number): string {
    return this.groups().find(
      group => group.id === groupId
    )?.name || 'Grupo desconocido';
  }

  getGroupColor(groupId: number): string {
    const colors = [
      '#3b82f6',
      '#8b5cf6',
      '#10b981',
      '#f59e0b',
      '#ef4444'
    ];

    return colors[
      Math.abs(groupId) % colors.length
    ];
  }

  tripDateRange(
    startDate: string | null,
    endDate: string | null
  ): string {
    if (!startDate && !endDate) {
      return 'Fechas por definir';
    }

    if (startDate && !endDate) {
      return `Desde ${formatDate(startDate)}`;
    }

    if (!startDate && endDate) {
      return `Hasta ${formatDate(endDate)}`;
    }

    return `${formatDate(startDate!)} - ${formatDate(endDate!)}`;
  }

  statusBadge(status: TripStatus): string {
    switch (status) {
      case 'PLANNING':
        return 'badge-orange';

      case 'CONFIRMED':
        return 'badge-blue';

      case 'COMPLETED':
        return 'badge-gray';

      case 'CANCELLED':
        return 'badge-red';

      default:
        return 'badge-gray';
    }
  }

  statusLabel(status: TripStatus): string {
    switch (status) {
      case 'PLANNING':
        return 'Planificando';

      case 'CONFIRMED':
        return 'Confirmado';

      case 'COMPLETED':
        return 'Finalizado';

      case 'CANCELLED':
        return 'Cancelado';

      default:
        return 'Desconocido';
    }
  }

  roleBadge(role: TripRole): string {
    switch (role) {
      case 'OWNER':
        return 'badge-purple';

      case 'ORGANIZER':
        return 'badge-blue';

      case 'MEMBER':
        return 'badge-green';

      default:
        return 'badge-gray';
    }
  }

  roleLabel(role: TripRole): string {
    switch (role) {
      case 'OWNER':
        return 'Propietario';

      case 'ORGANIZER':
        return 'Organizador';

      case 'MEMBER':
        return 'Miembro';

      default:
        return 'Miembro';
    }
  }
}