import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersApiService } from '../../../data-access/api/users-api.service';
import { NotificationRead, UnreadCount, Pagination } from '../../../shared/models/domain.models';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { formatRelativeTime } from '../../../shared/utils/date.utils';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  templateUrl: './notifications-page.component.html',
  styleUrl: './notifications-page.component.css'
})
export class NotificationsPageComponent implements OnInit {
  private readonly usersApi = inject(UsersApiService);
  readonly notifications = signal<NotificationRead[]>([]);
  readonly unreadCount = signal<UnreadCount>({ total: 0 });
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly pagination = signal<Pagination>({page: 1, page_size: 20});
  readonly totalNotifications = signal(0);
  readonly totalPages = signal(0);
  readonly formatRelativeTime = formatRelativeTime;

  ngOnInit(): void {
    this.loadNotifications();
    this.loadUnreadCount();
  }

  loadNotifications(): void {
    this.loading.set(true);
    this.error.set(null);

    this.usersApi.listNotifications(this.pagination()).subscribe({
      next: page => {
        this.notifications.set(page.items);
        this.totalNotifications.set(page.total);

        this.totalPages.set(
          Math.ceil(page.total / page.page_size)
        );

        this.loading.set(false);
      },

      error: () => {
        this.notifications.set([]);
        this.totalNotifications.set(0);
        this.totalPages.set(0);

        this.error.set(
          'No se pudieron cargar las notificaciones.'
        );

        this.loading.set(false);
      }
    });
  }

  loadUnreadCount(): void {
    this.usersApi.unreadCount().subscribe({
      next: count => {
        this.unreadCount.set(count);
      },

      error: () => {
        this.unreadCount.set({ total: 0 });
      }
    });
  }

  markAsRead(id: number): void {
    this.error.set(null);

    this.usersApi.markAsRead(id).subscribe({
      next: () => {
        this.notifications.update(notifications =>
          notifications.map(notification =>
            notification.id === id
              ? { ...notification, is_read: true }
              : notification
          )
        );

        this.loadUnreadCount();
      },

      error: () => {
        this.error.set(
          'No se pudo marcar la notificación como leída.'
        );
      }
    });
  }

  markAllAsRead(): void {
    this.error.set(null);

    this.usersApi.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update(notifications =>
          notifications.map(notification => ({
            ...notification,
            is_read: true
          }))
        );

        this.unreadCount.set({ total: 0 });
      },

      error: () => {
        this.error.set(
          'No se pudieron marcar las notificaciones como leídas.'
        );
      }
    });
  }

  deleteNotification(id: number): void {
    this.error.set(null);

    this.usersApi.deleteNotification(id).subscribe({
      next: () => {
        this.notifications.update(notifications =>
          notifications.filter(notification => notification.id !== id)
        );

        this.totalNotifications.update(total =>
          Math.max(0, total - 1)
        );

        const pageSize = this.pagination().page_size || 20;

        this.totalPages.set(
          Math.ceil(this.totalNotifications() / pageSize)
        );

        this.loadUnreadCount();

        if (
          this.notifications().length === 0 &&
          (this.pagination().page || 1) > 1
        ) {
          this.pagination.update(pagination => ({
            ...pagination,
            page: (pagination.page || 1) - 1
          }));

          this.loadNotifications();
        }
      },

      error: () => {
        this.error.set(
          'No se pudo eliminar la notificación.'
        );
      }
    });
  }

  onPageChange(page: number): void {
    this.pagination.update(pagination => ({
      ...pagination,
      page
    }));

    this.loadNotifications();
  }
}