import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { GroupsApiService } from '../../../data-access/api/groups-api.service';
import { TripsApiService } from '../../../data-access/api/trips-api.service';
import { GroupRead, TripCreate } from '../../../shared/models/domain.models';
import { ApiError } from '../../../core/http/error.interceptor';

@Component({
  selector: 'app-trip-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './trip-create.component.html',
  styleUrl: './trip-create.component.css'
})
export class TripCreateComponent implements OnInit {
  private readonly groupsApi = inject(GroupsApiService);
  private readonly tripsApi = inject(TripsApiService);
  private readonly router = inject(Router);

  readonly groups = signal<GroupRead[]>([]);
  readonly loadingGroups = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  name = '';
  groupId: number | null = null;
  startDate = '';
  endDate = '';
  description = '';

  ngOnInit(): void {
    this.loadGroups();
  }

  loadGroups(): void {
    this.loadingGroups.set(true);
    this.error.set(null);

    this.groupsApi.list({
      page: 1,
      page_size: 100
    }).subscribe({
      next: page => {
        this.groups.set(page.items);
        this.loadingGroups.set(false);
      },

      error: () => {
        this.groups.set([]);
        this.loadingGroups.set(false);

        this.error.set(
          'No se pudieron cargar los grupos disponibles.'
        );
      }
    });
  }

  onSubmit(): void {
    this.error.set(null);

    const name = this.name.trim();
    const description = this.description.trim();

    if (!name) {
      this.error.set(
        'Ingresa un nombre para el viaje.'
      );
      return;
    }

    if (this.groupId === null) {
      this.error.set(
        'Selecciona un grupo.'
      );
      return;
    }

    if (
      this.startDate &&
      this.endDate &&
      this.endDate < this.startDate
    ) {
      this.error.set(
        'La fecha de fin no puede ser anterior a la fecha de inicio.'
      );
      return;
    }

    const data: TripCreate = {
      group_id: this.groupId,
      name,
      description: description || null,
      start_date: this.startDate || null,
      end_date: this.endDate || null
    };

    this.submitting.set(true);

    this.tripsApi.create(data).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/viajes']);
      },

      error: (err: unknown) => {
        this.submitting.set(false);

        if (err instanceof ApiError) {
          this.error.set(err.message);
          return;
        }

        this.error.set(
          'No se pudo crear el viaje.'
        );
      }
    });
  }
}