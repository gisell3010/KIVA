import { allPages } from '../../core/http/all-pages';
import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/http/error.interceptor';
import { CatalogsApiService } from '../../data-access/api/catalogs-api.service';
import { ExpensesApiService } from '../../data-access/api/expenses-api.service';
import { GroupsApiService } from '../../data-access/api/groups-api.service';
import { TripsApiService } from '../../data-access/api/trips-api.service';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';
import {CatalogRead, ExpenseBalanceRead, ExpenseCreate, ExpenseRead, GroupRead, TripMemberRead, TripRead} from '../../shared/models/domain.models';
import { formatDate } from '../../shared/utils/date.utils';
import { formatMoney } from '../../shared/utils/money.utils';
import { isTripManager } from '../../shared/utils/permissions.utils';

@Component({
  selector: 'app-gastos',
  standalone: true,
  imports: [CommonModule, FormsModule, UserAvatarComponent],
  templateUrl: './gastos.component.html',
  styleUrl: './gastos.component.css',
})
export class GastosComponent implements OnInit {
  private readonly expensesApi = inject(ExpensesApiService);
  private readonly catalogsApi = inject(CatalogsApiService);
  private readonly tripsApi = inject(TripsApiService);
  private readonly groupsApi = inject(GroupsApiService);
  private readonly auth = inject(AuthService);

  readonly trips = signal<TripRead[]>([]);
  readonly groups = signal<GroupRead[]>([]);
  readonly categories = signal<CatalogRead[]>([]);
  readonly members = signal<TripMemberRead[]>([]);
  readonly expenses = signal<ExpenseRead[]>([]);
  readonly balances = signal<ExpenseBalanceRead[]>([]);
  readonly selectedTripId = signal<number | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly form = signal({
    paid_by_user_id: 0,
    category_id: 0,
    title: '',
    amount: '',
    expense_date: '',
    participant_ids: [] as number[],
  });

  readonly selectedTrip = computed(
    () => this.trips().find((t) => t.id === this.selectedTripId()) ?? null,
  );
  readonly canManage = computed(() => isTripManager(this.selectedTrip()));
  readonly totalSpent = computed(() =>
    this.expenses().reduce((sum, e) => sum + Number(e.amount), 0),
  );
  readonly currentUser = this.auth.user;
  readonly formatMoney = formatMoney;
  readonly formatDate = formatDate;

  ngOnInit(): void {
    this.loadGroups();
    this.loadCategories();
    this.loadTrips();
  }

  loadGroups(): void {
    allPages(page => this.groupsApi.list({ page, page_size: 100 })).subscribe({
      next: (p) => this.groups.set(p.items),
      error: () => this.groups.set([]),
    });
  }

  loadCategories(): void {
    this.catalogsApi.expenseCategories().subscribe({
      next: (v) => this.categories.set(v),
      error: () => this.categories.set([]),
    });
  }

  loadTrips(): void {
    allPages(page => this.tripsApi.list({ page, page_size: 100 })).subscribe({
      next: (p) => {
        this.trips.set(p.items);
        if (p.items.length && !this.selectedTripId()) {
          this.selectedTripId.set(p.items[0].id);
          this.loadAll(p.items[0].id);
        }
      },
      error: () => this.fail('No se pudieron cargar los viajes.'),
    });
  }

  loadAll(tripId: number): void {
    this.loading.set(true);
    this.error.set(null);

    allPages(page => this.tripsApi.members(tripId, { page, page_size: 100 })).subscribe({
      next: (p) => this.members.set(p.items),
      error: () => this.members.set([]),
    });

    allPages(page => this.expensesApi.list(tripId, { page, page_size: 100 })).subscribe({
      next: (p) => {
        this.expenses.set(p.items);
        this.loading.set(false);
      },
      error: (e) => {
        this.expenses.set([]);
        this.loading.set(false);
        this.failError(e, 'Error al cargar los gastos.');
      },
    });

    this.expensesApi.balances(tripId).subscribe({
      next: (v) => this.balances.set(v),
      error: () => this.balances.set([]),
    });
  }

  onTripSelect(event: Event): void {
    const id = Number((event.target as HTMLSelectElement).value);
    this.closeForm();
    if (!id) {
      this.selectedTripId.set(null);
      this.expenses.set([]);
      this.members.set([]);
      this.balances.set([]);
      return;
    }
    this.selectedTripId.set(id);
    this.loadAll(id);
  }

  openCreate(): void {
    const trip = this.selectedTrip();
    const user = this.currentUser();
    if (!trip || !user) return;

    const ids = this.members().map((m) => m.user_id);
    this.editingId.set(null);
    this.form.set({
      paid_by_user_id: user.id,
      category_id: this.categories()[0]?.id ?? 0,
      title: '',
      amount: '',
      expense_date: this.todayLocal(),
      participant_ids: ids,
    });
    this.showForm.set(true);
  }

  openEdit(expense: ExpenseRead): void {
    const user = this.currentUser();
    if (!user || (!this.canManage() && expense.paid_by_user_id !== user.id)) return;
    const tripId = this.selectedTripId();
    if (!tripId) return;

    this.expensesApi.get(tripId, expense.id).subscribe({
      next: (detail) => {
        this.editingId.set(expense.id);
        this.form.set({
          paid_by_user_id: detail.paid_by_user_id,
          category_id: detail.category_id,
          title: detail.title,
          amount: String(detail.amount),
          expense_date: detail.expense_date,
          participant_ids: detail.splits.map((s) => s.user_id),
        });
        this.showForm.set(true);
      },
      error: (e) => this.failError(e, 'No se pudo abrir el gasto.'),
    });
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  setField(
    field: 'paid_by_user_id' | 'category_id' | 'title' | 'amount' | 'expense_date',
    value: string | number,
  ): void {
    this.form.update((c) => ({
      ...c,
      [field]: field === 'paid_by_user_id' || field === 'category_id' ? Number(value) : String(value),
    }));
  }

  toggleParticipant(userId: number): void {
    this.form.update((c) => ({
      ...c,
      participant_ids: c.participant_ids.includes(userId)
        ? c.participant_ids.filter((id) => id !== userId)
        : [...c.participant_ids, userId],
    }));
  }

  saveExpense(): void {
    const tripId = this.selectedTripId();
    const f = this.form();
    const amount = this.parseAmount(f.amount);
    if (!tripId || !f.title.trim() || !Number.isFinite(amount) || amount <= 0 || !f.category_id || !f.participant_ids.length) {
      return;
    }
    if (!this.canManage() && f.paid_by_user_id !== this.currentUser()?.id) {
      this.fail('Como participante solo puedes registrar un gasto pagado por ti.');
      return;
    }

    const cents = Math.round(amount * 100);
    const n = f.participant_ids.length;
    const base = Math.floor(cents / n);
    let remainder = cents - base * n;
    const splits = f.participant_ids.map((user_id) => {
      const value = base + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder -= 1;
      return { user_id, amount: (value / 100).toFixed(2) };
    });

    const payload: ExpenseCreate = {
      paid_by_user_id: f.paid_by_user_id,
      category_id: f.category_id,
      title: f.title.trim(),
      amount: amount.toFixed(2),
      expense_date: f.expense_date,
      splits,
    };

    this.saving.set(true);
    const req = this.editingId()
      ? this.expensesApi.update(tripId, this.editingId()!, payload)
      : this.expensesApi.create(tripId, payload);

    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.loadAll(tripId);
      },
      error: (e) => {
        this.saving.set(false);
        this.failError(e, 'No se pudo guardar el gasto.');
      },
    });
  }

  canEdit(expense: ExpenseRead): boolean {
    return this.canManage() || expense.paid_by_user_id === this.currentUser()?.id;
  }

  deleteExpense(expense: ExpenseRead): void {
    const tripId = this.selectedTripId();
    if (!tripId || !this.canEdit(expense) || !confirm(`¿Eliminar ${expense.title}?`)) return;
    this.expensesApi.delete(tripId, expense.id).subscribe({
      next: () => this.loadAll(tripId),
      error: (e) => this.failError(e, 'No se pudo eliminar el gasto.'),
    });
  }

  memberName(id: number): string {
    return this.members().find((m) => m.user_id === id)?.full_name || `Usuario ${id}`;
  }

  memberProfileImage(id: number): string | null {
    return this.members().find((member) => member.user_id === id)?.profile_image ?? null;
  }

  groupName(id: number): string {
    return this.groups().find((g) => g.id === id)?.name || 'Grupo';
  }

  categoryName(id: number): string {
    return this.categories().find((c) => c.id === id)?.name || 'Sin categoría';
  }

  balanceValue(v: string): number {
    return Number(v);
  }


  private parseAmount(value: string): number {
    const normalized = value
      .trim()
      .replace(/\s/g, '');

    if (!normalized) {
      return 0;
    }

    if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(normalized)) {
      return Number(
        normalized
          .replace(/\./g, '')
          .replace(',', '.')
      );
    }

    if (/^\d+(,\d{1,2})$/.test(normalized)) {
      return Number(normalized.replace(',', '.'));
    }

    return Number(normalized.replace(/,/g, ''));
  }

  private todayLocal(): string {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 10);
  }

  private fail(m: string): void {
    this.error.set(m);
  }

  private failError(e: unknown, f: string): void {
    this.error.set(e instanceof ApiError ? e.message : f);
  }
}