import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockDataService } from '../../data-access/mock/mock-data.service';
import { Trip, Expense } from '../../shared/models/domain.models';

@Component({
  selector: 'app-gastos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gastos.component.html',
  styleUrl: './gastos.component.css'
})
export class GastosComponent {
  protected mockData = inject(MockDataService);

  trips = this.mockData.trips;
  groups = this.mockData.groups;

  selectedTripId = signal<string>(this.trips()[0]?.id || '');

  selectedTrip = computed(() => this.trips().find(t => t.id === this.selectedTripId()));

  expenses = computed(() => {
    const trip = this.selectedTrip();
    return trip ? this.mockData.getTripExpenses(trip.id) : [];
  });

  totalSpent = computed(() =>
    this.expenses().reduce((sum, g) => sum + g.amount, 0)
  );

  balancePerPerson = computed(() => {
    const trip = this.selectedTrip();
    if (!trip) return [];

    const tripMembers = this.mockData.getTripMembers(trip.id);
    const userIds = tripMembers.map(m => m.userId);

    const paid = new Map<string, number>();
    const owed = new Map<string, number>();
    userIds.forEach(id => { paid.set(id, 0); owed.set(id, 0); });

    for (const exp of this.expenses()) {
      paid.set(exp.paidById, (paid.get(exp.paidById) ?? 0) + exp.amount);
      const perPerson = exp.amount / exp.splitBetween.length;
      for (const id of exp.splitBetween) {
        owed.set(id, (owed.get(id) ?? 0) + perPerson);
      }
    }

    return userIds.map(id => {
      const user = this.mockData.getUser(id);
      const p = paid.get(id) ?? 0;
      const o = owed.get(id) ?? 0;
      return {
        user,
        paid: p,
        owed: o,
        balance: p - o
      };
    });
  });

  expenseCategoryIcon(cat: string): string {
    switch (cat) {
      case 'TRANSPORT': return 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z';
      case 'ACCOMMODATION': return 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z';
      case 'FOOD': return 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6';
      case 'ACTIVITIES': return 'M12 22a10 10 0 1 0-9-9 9 9 0 0 0 9 9zM12 2v2M12 20v2';
      default: return 'M3 3h18v18H3z';
    }
  }

  expenseCategoryBadge(cat: string): string {
    switch (cat) {
      case 'TRANSPORT': return 'badge-blue';
      case 'ACCOMMODATION': return 'badge-purple';
      case 'FOOD': return 'badge-orange';
      case 'ACTIVITIES': return 'badge-green';
      default: return 'badge-gray';
    }
  }

  expenseCategoryLabel(cat: string): string {
    switch (cat) {
      case 'TRANSPORT': return 'Transporte';
      case 'ACCOMMODATION': return 'Alojamiento';
      case 'FOOD': return 'Comida';
      case 'ACTIVITIES': return 'Actividades';
      default: return 'Otros';
    }
  }

  tripName(tripId: string): string {
    return this.trips().find(t => t.id === tripId)?.name || '';
  }

  groupName(groupId: string): string {
    return this.groups().find(g => g.id === groupId)?.name || '';
  }

  formatMoney(v: number): string {
    return v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  }
}