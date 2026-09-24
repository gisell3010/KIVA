import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockDataService } from '../../data-access/mock/mock-data.service';
import { TripDestination } from '../../shared/models/domain.models';

@Component({
  selector: 'app-destinos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './destinos.component.html',
  styleUrl: './destinos.component.css'
})
export class DestinosComponent {
  private mockData = inject(MockDataService);

  destinations = this.mockData.tripDestinations;
  trips = this.mockData.trips;
  groups = this.mockData.groups;

  filterTrip = signal<string | 'all'>('all');

  filteredDestinations = computed(() => {
    const f = this.filterTrip();
    if (f === 'all') return this.destinations();
    return this.destinations().filter(d => d.tripId === f);
  });

  maxVotes = computed(() => Math.max(...this.destinations().map(d => d.votes), 1));

  tripName(tripId: string): string {
    return this.trips().find(t => t.id === tripId)?.name || '';
  }

  groupName(groupId: string): string {
    return this.groups().find(g => g.id === groupId)?.name || '';
  }

  vote(id: string): void {
    this.destinations.update(list =>
      list.map(d => d.id === id ? { ...d, votes: d.votes + 1 } : d)
    );
  }

  formatMoney(v: number): string {
    return v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  }
}