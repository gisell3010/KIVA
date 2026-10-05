import { Component, DestroyRef, signal, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UsersApiService } from '../../../data-access/api/users-api.service';
import { NotificationRead, UnreadCount } from '../../../shared/models/domain.models';
import { formatRelativeTime } from '../../../shared/utils/date.utils';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="notification-dropdown">
      <button
        type="button"
        class="icon-btn notification-trigger"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-label]="'Notificaciones (' + unreadCount().total + ' sin leer)'"
        (click)="toggle()"
      >
        <svg
          class="ui-icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>

        @if (unreadCount().total > 0) {
          <span class="notification-badge">
            {{ unreadCount().total > 9 ? '9+' : unreadCount().total }}
          </span>
        }
      </button>

      @if (isOpen()) {
        <div
          class="dropdown-panel"
          role="menu"
          (click)="$event.stopPropagation()"
        >
          <div class="dropdown-header">
            <h3>Notificaciones</h3>

            @if (unreadCount().total > 0) {
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                (click)="markAllAsRead()"
              >
                Marcar todas como leídas
              </button>
            }
          </div>

          <div
            class="dropdown-list"
            role="list"
          >
            @if (recentNotifications().length === 0) {
              <div
                class="empty-state"
                role="listitem"
              >
                <svg
                  class="ui-icon"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  aria-hidden="true"
                >
                  <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                </svg>

                <p>No hay notificaciones recientes</p>
              </div>
            } @else {
              @for (notification of recentNotifications(); track notification.id) {
                <div
                  class="notification-item"
                  [class.unread]="!notification.is_read"
                  role="listitem"
                >
                  <div class="notification-icon">
                    <svg
                      class="ui-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.75"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                    </svg>
                  </div>

                  <div class="notification-content">
                    <div class="notification-title">
                      {{ notification.title }}
                    </div>

                    <div class="notification-message">
                      {{ notification.message }}
                    </div>

                    <div class="notification-time">
                      {{ formatRelativeTime(notification.created_at) }}
                    </div>
                  </div>

                  @if (!notification.is_read) {
                    <button
                      type="button"
                      class="mark-read-btn"
                      aria-label="Marcar como leída"
                      (click)="markAsRead(notification.id)"
                    >
                      <svg
                        class="ui-icon"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        aria-hidden="true"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </button>
                  }
                </div>
              }
            }
          </div>

          <div class="dropdown-footer">
            <a
              routerLink="/notificaciones"
              class="btn btn-outline btn-full"
              (click)="close()"
            >
              Ver todas las notificaciones
            </a>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .notification-dropdown {
      position: relative;
    }

    .notification-trigger {
      position: relative;
    }

    .notification-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      border-radius: 999px;
      background: var(--accent-red);
      color: white;
      font-size: 0.65rem;
      font-weight: 700;
    }

    .dropdown-panel {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      z-index: 100;
      display: flex;
      flex-direction: column;
      width: 380px;
      max-height: 480px;
      overflow: hidden;
      border: 1px solid var(--border-soft);
      border-radius: var(--radius);
      background: var(--bg-card);
      box-shadow: var(--shadow-glow);
      animation: dropdownIn 0.15s ease;
    }

    @keyframes dropdownIn {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .dropdown-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border-soft);
    }

    .dropdown-header h3 {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 700;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 0.75rem;
    }

    .dropdown-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 10px;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .notification-item:hover {
      background: var(--bg-panel-2);
    }

    .notification-item.unread {
      background: rgba(59, 130, 246, 0.06);
    }

    .notification-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
    }

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-title {
      margin-bottom: 2px;
      color: var(--text-primary);
      font-size: 0.8rem;
      font-weight: 600;
    }

    .notification-message {
      margin-bottom: 4px;
      color: var(--text-secondary);
      font-size: 0.75rem;
      line-height: 1.4;
    }

    .notification-time {
      color: var(--text-muted);
      font-size: 0.65rem;
    }

    .mark-read-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
    }

    .mark-read-btn:hover {
      background: var(--bg-panel-2);
      color: var(--accent-green);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 32px 16px;
      color: var(--text-muted);
      text-align: center;
    }

    .empty-state .ui-icon {
      opacity: 0.4;
    }

    .empty-state p {
      margin: 0;
      font-size: 0.8rem;
    }

    .dropdown-footer {
      padding: 12px 16px;
      border-top: 1px solid var(--border-soft);
    }

    @media (max-width: 480px) {
      .dropdown-panel {
        right: -16px;
        width: calc(100vw - 32px);
      }
    }
  `]
})
export class NotificationDropdownComponent {
  private readonly usersApi = inject(UsersApiService);
  private readonly elementRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly isOpen = signal(false);
  readonly unreadCount = signal<UnreadCount>({ total: 0 });
  readonly recentNotifications = signal<NotificationRead[]>([]);

  readonly formatRelativeTime = formatRelativeTime;

  constructor() {
    // Mantiene actualizado el contador sin WebSockets ni recargas manuales.
    // El polling es deliberadamente liviano para el alcance académico de KIVA.
    timer(0, 60_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadUnreadCount());
  }

  toggle(): void {
    this.isOpen.update(value => !value);

    if (this.isOpen()) {
      this.loadNotifications();
    }
  }

  close(): void {
    this.isOpen.set(false);
  }

  markAsRead(id: number): void {
    this.usersApi.markAsRead(id).subscribe({
      next: () => {
        this.recentNotifications.update(notifications =>
          notifications.map(notification =>
            notification.id === id
              ? {
                  ...notification,
                  is_read: true
                }
              : notification
          )
        );

        this.loadUnreadCount();
      }
    });
  }

  markAllAsRead(): void {
    this.usersApi.markAllAsRead().subscribe({
      next: () => {
        this.recentNotifications.update(notifications =>
          notifications.map(notification => ({
            ...notification,
            is_read: true
          }))
        );

        this.unreadCount.set({
          total: 0
        });
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (
      this.isOpen() &&
      !this.elementRef.nativeElement.contains(event.target)
    ) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  private loadNotifications(): void {
    this.loadUnreadCount();

    this.usersApi.listNotifications({
      page: 1,
      page_size: 10
    }).subscribe({
      next: page => {
        this.recentNotifications.set(page.items);
      },

      error: () => {
        this.recentNotifications.set([]);
      }
    });
  }

  private loadUnreadCount(): void {
    this.usersApi.unreadCount().subscribe({
      next: count => {
        this.unreadCount.set(count);
      },

      error: () => {
        this.unreadCount.set({
          total: 0
        });
      }
    });
  }
}