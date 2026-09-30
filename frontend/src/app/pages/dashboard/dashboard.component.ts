import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardApiService } from '../../data-access/api/dashboard-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { DashboardRead } from '../../shared/models/domain.models';
import { formatMoney } from '../../shared/utils/money.utils';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private readonly dashboardApi = inject(DashboardApiService);
  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.user;
  readonly dashboard = signal<DashboardRead | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly totalGroups = computed(() => this.dashboard()?.groups_count ?? 0);
  readonly totalParticipants = computed(() => this.dashboard()?.participants_count ?? 0);
  readonly totalExpenses = computed(() => this.dashboard()?.total_expenses ?? '0');
  readonly openPolls = computed(() => this.dashboard()?.open_polls_count ?? 0);
  readonly upcomingActivities = computed(() => this.dashboard()?.upcoming_activities_count ?? 0);
  readonly unreadNotifications = computed(() => this.dashboard()?.unread_notifications_count ?? 0);

  readonly formatMoney = formatMoney;

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    this.dashboardApi.get().subscribe({
      next: data => {
        this.dashboard.set(data);
        this.loading.set(false);
      },

      error: () => {
        this.dashboard.set(null);
        this.error.set('Error al cargar el panel.');
        this.loading.set(false);
      }
    });
  }
}