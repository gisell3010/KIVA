import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpensesApiService } from '../../data-access/api/expenses-api.service';
import { CatalogsApiService } from '../../data-access/api/catalogs-api.service';
import { TripsApiService } from '../../data-access/api/trips-api.service';
import { GroupsApiService } from '../../data-access/api/groups-api.service';
import { TripRead, GroupRead, ExpenseRead, ExpenseBalanceRead, CatalogRead } from '../../shared/models/domain.models';
import { formatMoney } from '../../shared/utils/money.utils';
import { formatDate } from '../../shared/utils/date.utils';
import { PrivateImageComponent } from '../../shared/components/private-image/private-image.component';
import { ApiError } from '../../core/http/error.interceptor';

@Component({
  selector: 'app-gastos',
  standalone: true,
  imports: [
    CommonModule,
    PrivateImageComponent
  ],
  templateUrl: './gastos.component.html',
  styleUrl: './gastos.component.css'
})
export class GastosComponent implements OnInit {
  private readonly expensesApi = inject(ExpensesApiService);
  private readonly catalogsApi = inject(CatalogsApiService);
  private readonly tripsApi = inject(TripsApiService);
  private readonly groupsApi = inject(GroupsApiService);

  readonly trips = signal<TripRead[]>([]);
  readonly groups = signal<GroupRead[]>([]);
  readonly categories = signal<CatalogRead[]>([]);

  readonly selectedTripId = signal<number | null>(null);
  readonly expenses = signal<ExpenseRead[]>([]);
  readonly balances = signal<ExpenseBalanceRead[]>([]);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly totalSpent = computed(() =>
    this.expenses().reduce(
      (sum, expense) => sum + Number(expense.amount || 0),
      0
    )
  );

  readonly formatMoney = formatMoney;
  readonly formatDate = formatDate;

  ngOnInit(): void {
    this.loadGroups();
    this.loadCategories();
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

  loadCategories(): void {
    this.catalogsApi.expenseCategories().subscribe({
      next: categories => {
        this.categories.set(categories);
      },

      error: () => {
        this.categories.set([]);
      }
    });
  }

  loadTrips(): void {
    this.tripsApi.list({
      page: 1,
      page_size: 100
    }).subscribe({
      next: page => {
        this.trips.set(page.items);

        if (
          page.items.length > 0 &&
          this.selectedTripId() === null
        ) {
          const tripId = page.items[0].id;

          this.selectedTripId.set(tripId);
          this.loadExpenses(tripId);
          this.loadBalances(tripId);
        }
      },

      error: () => {
        this.trips.set([]);
        this.selectedTripId.set(null);
        this.expenses.set([]);
        this.balances.set([]);
      }
    });
  }

  loadExpenses(tripId: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.expensesApi.list(
      tripId,
      {
        page: 1,
        page_size: 100
      }
    ).subscribe({
      next: page => {
        this.expenses.set(page.items);
        this.loading.set(false);
      },

      error: (err: unknown) => {
        this.expenses.set([]);

        if (err instanceof ApiError) {
          this.error.set(err.message);
        } else {
          this.error.set('Error al cargar los gastos.');
        }

        this.loading.set(false);
      }
    });
  }

  loadBalances(tripId: number): void {
    this.expensesApi.balances(tripId).subscribe({
      next: balances => {
        this.balances.set(balances);
      },

      error: () => {
        this.balances.set([]);
      }
    });
  }

  onTripSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = select.value;

    if (value === '') {
      this.selectedTripId.set(null);
      this.expenses.set([]);
      this.balances.set([]);
      this.error.set(null);
      return;
    }

    const tripId = Number(value);

    if (!Number.isFinite(tripId)) {
      this.selectedTripId.set(null);
      this.expenses.set([]);
      this.balances.set([]);
      return;
    }

    this.selectedTripId.set(tripId);
    this.loadExpenses(tripId);
    this.loadBalances(tripId);
  }

  groupName(groupId: number): string {
    return this.groups().find(
      group => group.id === groupId
    )?.name || 'Grupo';
  }

  categoryName(categoryId: number): string {
    return this.categories().find(
      category => category.id === categoryId
    )?.name || 'Otros';
  }

  expenseCategoryIcon(categoryId: number): string {
    switch (this.categoryName(categoryId).toLowerCase()) {
      case 'transporte':
        return 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z';

      case 'alojamiento':
        return 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z';

      case 'alimentación':
      case 'alimentacion':
        return 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6';

      case 'actividades':
        return 'M12 22a10 10 0 1 0-9-9 9 9 0 0 0 9 9zM12 2v2M12 20v2';

      default:
        return 'M3 3h18v18H3z';
    }
  }

  expenseCategoryBadge(categoryId: number): string {
    switch (this.categoryName(categoryId).toLowerCase()) {
      case 'transporte':
        return 'badge-blue';

      case 'alojamiento':
        return 'badge-purple';

      case 'alimentación':
      case 'alimentacion':
        return 'badge-orange';

      case 'actividades':
        return 'badge-green';

      default:
        return 'badge-gray';
    }
  }

  balanceValue(value: string): number {
    const amount = Number(value);

    return Number.isFinite(amount)
      ? amount
      : 0;
  }
}