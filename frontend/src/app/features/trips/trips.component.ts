import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MockDataService } from '../../data-access/mock/mock-data.service';
import { Trip, TripStatus, TripMember, TripRole } from '../../shared/models/domain.models';

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './trips.component.html',
  styleUrl: './trips.component.css'
})
export class TripsComponent {
  private mockData = inject(MockDataService);

  trips = this.mockData.trips;
  groups = this.mockData.groups;
  users = this.mockData.users;
  tripMembers = this.mockData.tripMembers;

  selectedGroupId = signal<string | 'all'>('all');
  selectedStatus = signal<TripStatus | 'all'>('all');

  filteredTrips = computed(() => {
    let result = this.trips();

    if (this.selectedGroupId() !== 'all') {
      result = result.filter(t => t.groupId === this.selectedGroupId());
    }

    if (this.selectedStatus() !== 'all') {
      result = result.filter(t => t.status === this.selectedStatus());
    }

    return result.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  });

  userTrips = computed(() => {
    return this.trips().slice(0, 3);
  });

  statusOptions: { value: TripStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'PLANNING', label: 'Planificando' },
    { value: 'CONFIRMED', label: 'Confirmado' },
    { value: 'IN_PROGRESS', label: 'En curso' },
    { value: 'COMPLETED', label: 'Finalizado' },
  ];

  getGroupName(groupId: string): string {
    return this.groups().find(g => g.id === groupId)?.name || 'Grupo desconocido';
  }

  getGroupColor(groupId: string): string {
    return this.groups().find(g => g.id === groupId)?.colorTheme || '#3b82f6';
  }

  getMemberCount(tripId: string): number {
    return this.tripMembers().filter(m => m.tripId === tripId).length;
  }

  getUserRole(tripId: string, userId: string): TripRole | null {
    const member = this.tripMembers().find(m => m.tripId === tripId && m.userId === userId);
    return member?.role || null;
  }

  statusBadge(status: TripStatus): string {
    switch (status) {
      case 'PLANNING': return 'badge-orange';
      case 'CONFIRMED': return 'badge-blue';
      case 'IN_PROGRESS': return 'badge-green';
      case 'COMPLETED': return 'badge-gray';
    }
  }

  statusLabel(status: TripStatus): string {
    switch (status) {
      case 'PLANNING': return 'Planificando';
      case 'CONFIRMED': return 'Confirmado';
      case 'IN_PROGRESS': return 'En curso';
      case 'COMPLETED': return 'Finalizado';
    }
  }

  roleBadge(role: TripRole): string {
    switch (role) {
      case 'OWNER': return 'badge-purple';
      case 'ORGANIZER': return 'badge-blue';
      case 'MEMBER': return 'badge-green';
    }
  }

  roleLabel(role: TripRole): string {
    switch (role) {
      case 'OWNER': return 'Propietario';
      case 'ORGANIZER': return 'Organizador';
      case 'MEMBER': return 'Miembro';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatMoney(v: number): string {
    return v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  }

  getDaysUntil(startDate: string): number {
    const start = new Date(startDate);
    const now = new Date();
    const diff = start.getTime() - now.getTime();
    return Math.ceil(diff / 86400000);
  }
}