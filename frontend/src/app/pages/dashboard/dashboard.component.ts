import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { MockDataService } from '../../data-access/mock/mock-data.service';
import { TripStatus } from '../../shared/models/domain.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private mockData = inject(MockDataService);

  currentUser = this.authService.user;

  groups = this.mockData.groups;
  users = this.mockData.users;
  trips = this.mockData.trips;

  totalGroups = computed(() => this.groups().length);
  totalParticipants = computed(() => this.users().length);
  totalExpenses = computed(() => this.mockData.expenses().reduce((sum, g) => sum + g.amount, 0));
  openPolls = computed(() => this.mockData.polls().filter(v => v.status === 'OPEN').length);

  upcomingEvents = computed(() =>
    [...this.mockData.calendarEvents()]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5)
  );

  recentGroups = computed(() => this.groups().slice(0, 3));

  statusBadge(status: TripStatus): string {
    switch (status) {
      case 'PLANNING': return 'badge-orange';
      case 'CONFIRMED': return 'badge-blue';
      case 'IN_PROGRESS': return 'badge-green';
      default: return 'badge-gray';
    }
  }

  statusLabel(status: TripStatus): string {
    switch (status) {
      case 'PLANNING': return 'Planificando';
      case 'CONFIRMED': return 'Confirmado';
      case 'IN_PROGRESS': return 'En curso';
      default: return 'Finalizado';
    }
  }

  eventTypeClass(type: string): string {
    switch (type) {
      case 'RESERVATION': return 'evt-cyan';
      case 'ACTIVITY': return 'evt-green';
      case 'VOTING': return 'evt-purple';
      case 'PAYMENT': return 'evt-orange';
      default: return 'evt-gray';
    }
  }

  eventTypeIcon(type: string): string {
    switch (type) {
      case 'RESERVATION': return 'M2 9.5V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2.5a2.5 2.5 0 0 0 0 5V17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2.5a2.5 2.5 0 0 0 0-5Z';
      case 'ACTIVITY': return 'M8 2v4M16 2v4M3 10h18';
      case 'VOTING': return 'M9 11l3 3L22 4';
      case 'PAYMENT': return 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6';
      default: return 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z';
    }
  }

  eventTypeLabel(type: string): string {
    switch (type) {
      case 'RESERVATION': return 'Reserva';
      case 'ACTIVITY': return 'Actividad';
      case 'VOTING': return 'Votación';
      case 'PAYMENT': return 'Pago';
      default: return 'Evento';
    }
  }

  formatMoney(v: number): string {
    return v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  }

  formatRelativeTime(date: string): string {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }
}