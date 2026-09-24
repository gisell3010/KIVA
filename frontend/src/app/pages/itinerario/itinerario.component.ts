import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockDataService } from '../../data-access/mock/mock-data.service';
import { Trip } from '../../shared/models/domain.models';

@Component({
  selector: 'app-itinerario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './itinerario.component.html',
  styleUrl: './itinerario.component.css'
})
export class ItinerarioComponent {
  private mockData = inject(MockDataService);

  trips = this.mockData.trips;
  groups = this.mockData.groups;

  selectedTripId = signal<string>(this.trips()[0]?.id || '');

  selectedTrip = computed(() => this.trips().find(t => t.id === this.selectedTripId()));

  itineraryDays = computed(() => {
    const trip = this.selectedTrip();
    if (!trip) return [];
    return this.mockData.getItineraryDays(trip.id);
  });

  activitiesByDay(dayId: string) {
    return this.mockData.getItineraryItems(dayId);
  }

  tripName(tripId: string): string {
    return this.trips().find(t => t.id === tripId)?.name || '';
  }

  groupName(groupId: string): string {
    return this.groups().find(g => g.id === groupId)?.name || '';
  }

  activityTypeIcon(type: string): string {
    switch (type) {
      case 'TRANSFER': return 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z';
      case 'ACCOMMODATION': return 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z';
      case 'MEAL': return 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6';
      case 'TOUR': return 'M21 12a9 9 0 1 0-9-9 9 9 0 0 0 9 9zM12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41';
      case 'LEISURE': return 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2';
      default: return 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z';
    }
  }

  activityTypeBadge(type: string): string {
    switch (type) {
      case 'TRANSFER': return 'badge-blue';
      case 'ACCOMMODATION': return 'badge-purple';
      case 'MEAL': return 'badge-orange';
      case 'TOUR': return 'badge-green';
      case 'LEISURE': return 'badge-pink';
      default: return 'badge-gray';
    }
  }

  activityTypeLabel(type: string): string {
    switch (type) {
      case 'TRANSFER': return 'Traslado';
      case 'ACCOMMODATION': return 'Alojamiento';
      case 'MEAL': return 'Comida';
      case 'TOUR': return 'Tour';
      case 'LEISURE': return 'Ocio';
      default: return 'Otro';
    }
  }

  formatMoney(v: number): string {
    if (!v) return 'Gratis';
    return v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  }
}