import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../data-access/mock/mock-data.service';
import { Trip, Reservation, ReservationStatus } from '../../shared/models/domain.models';

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reservas.component.html',
  styleUrl: './reservas.component.css'
})
export class ReservasComponent {
  private mockData = inject(MockDataService);

  trips = this.mockData.trips;
  groups = this.mockData.groups;

  selectedTripId = signal<string>('all');

  filteredReservations = computed(() => {
    const tripId = this.selectedTripId();
    if (tripId === 'all') return this.mockData.reservations();
    return this.mockData.reservations().filter(r => r.tripId === tripId);
  });

  filterTypes = ['all', 'FLIGHT', 'HOTEL', 'ACTIVITY', 'TRANSPORT'] as const;
  filterType = signal<'all' | 'FLIGHT' | 'HOTEL' | 'ACTIVITY' | 'TRANSPORT'>('all');

  typeFilteredReservations = computed(() => {
    const type = this.filterType();
    const reservations = this.filteredReservations();
    if (type === 'all') return reservations;
    return reservations.filter(r => r.type === type);
  });

  tripName(tripId: string): string {
    return this.trips().find(t => t.id === tripId)?.name || '';
  }

  groupName(groupId: string): string {
    return this.groups().find(g => g.id === groupId)?.name || '';
  }

  statusBadge(status: ReservationStatus): string {
    switch (status) {
      case 'CONFIRMED': return 'badge-green';
      case 'PENDING': return 'badge-orange';
      default: return 'badge-cyan';
    }
  }

  statusLabel(status: ReservationStatus): string {
    switch (status) {
      case 'CONFIRMED': return 'Confirmada';
      case 'PENDING': return 'Pendiente';
      case 'SIMULATED': return 'Simulada';
      default: return status;
    }
  }

  typeLabel(type: string): string {
    switch (type) {
      case 'FLIGHT': return 'Vuelo';
      case 'HOTEL': return 'Hotel';
      case 'ACTIVITY': return 'Actividad';
      case 'TRANSPORT': return 'Transporte';
      default: return type;
    }
  }

  simulateConfirmation(id: string): void {
    this.mockData.reservations.update(list =>
      list.map(r => r.id === id ? { ...r, status: 'SIMULATED' as ReservationStatus } : r)
    );
  }

  formatMoney(v: number): string {
    return v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  }
}