import { Component, signal, computed, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../features/notifications/notification.service';
import { Notification, NotificationType } from '../../../shared/models/domain.models';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-dropdown" #dropdown>
      <button
        class="icon-btn notification-trigger"
        (click)="toggle()"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-label]="'Notificaciones (' + unreadCount() + ' sin leer)'"
        type="button"
      >
        <svg class="ui-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.7 21a2 2 0 0 1-3.4 0"/>
        </svg>
        @if (unreadCount() > 0) {
          <span class="notification-badge">{{ unreadCount() > 9 ? '9+' : unreadCount() }}</span>
        }
      </button>

      @if (isOpen()) {
        <div class="dropdown-panel" role="menu" (click)="$event.stopPropagation()">
          <div class="dropdown-header">
            <h3>Notificaciones</h3>
            @if (unreadCount() > 0) {
              <button class="btn btn-ghost btn-sm" (click)="markAllAsRead()">Marcar todas como leídas</button>
            }
          </div>

          <div class="dropdown-list" role="list">
            @if (recentNotifications().length === 0) {
              <div class="empty-state" role="listitem">
                <svg class="ui-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                  <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.7 21a2 2 0 0 1-3.4 0"/>
                </svg>
                <p>No hay notificaciones recientes</p>
              </div>
            } @else {
              @for (notification of recentNotifications(); track notification.id) {
                <div class="notification-item" [class.unread]="!notification.readAt" role="listitem">
                  <div class="notification-icon" [ngClass]="typeIconClass(notification.type)">
                    <svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                      <path [attr.d]="typeIconPath(notification.type)"/>
                    </svg>
                  </div>
                  <div class="notification-content">
                    <div class="notification-title">{{ notification.title }}</div>
                    <div class="notification-message">{{ notification.message }}</div>
                    <div class="notification-time">{{ formatRelativeTime(notification.createdAt) }}</div>
                  </div>
                  @if (!notification.readAt) {
                    <button class="mark-read-btn" (click)="markAsRead(notification.id)" aria-label="Marcar como leída">
                      <svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <path d="M20 6 9 17l-5-5"/>
                      </svg>
                    </button>
                  }
                </div>
              }
            }
          </div>

          <div class="dropdown-footer">
            <a routerLink="/notificaciones" class="btn btn-outline btn-full" (click)="close()">Ver todas las notificaciones</a>
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
      min-width: 18px;
      height: 18px;
      background: var(--accent-red);
      color: white;
      font-size: 0.65rem;
      font-weight: 700;
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
    }

    .dropdown-panel {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 380px;
      max-height: 480px;
      background: var(--bg-card);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius);
      box-shadow: var(--shadow-glow);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      z-index: 100;
      animation: dropdownIn 0.15s ease;
    }

    @keyframes dropdownIn {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .dropdown-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border-soft);
    }

    .dropdown-header h3 {
      font-size: 0.95rem;
      font-weight: 700;
      margin: 0;
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
      transition: background 0.15s ease;
      cursor: pointer;
    }

    .notification-item:hover {
      background: var(--bg-panel-2);
    }

    .notification-item.unread {
      background: rgba(59, 130, 246, 0.06);
    }

    .notification-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .notification-icon.group { background: rgba(59,130,246,0.15); color: #60a5fa; }
    .notification-icon.trip { background: rgba(34,197,94,0.15); color: #4ade80; }
    .notification-icon.vote { background: rgba(168,85,247,0.15); color: #c084fc; }
    .notification-icon.expense { background: rgba(249,115,22,0.15); color: #fb923c; }
    .notification-icon.reservation { background: rgba(34,211,238,0.15); color: #22d3ee; }
    .notification-icon.calendar { background: rgba(236,72,153,0.15); color: #f472b6; }
    .notification-icon.system { background: rgba(148,163,184,0.15); color: #94a3b8; }

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-title {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 2px;
    }

    .notification-message {
      font-size: 0.75rem;
      color: var(--text-secondary);
      line-height: 1.4;
      margin-bottom: 4px;
    }

    .notification-time {
      font-size: 0.65rem;
      color: var(--text-muted);
    }

    .mark-read-btn {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      background: transparent;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      cursor: pointer;
      flex-shrink: 0;
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
      border-top: 1px solid var(--border-soft);
      padding: 12px 16px;
    }

    @media (max-width: 480px) {
      .dropdown-panel {
        width: calc(100vw - 32px);
        right: -16px;
      }
    }
  `]
})
export class NotificationDropdownComponent {
  private notificationService = inject(NotificationService);
  private elementRef = inject(ElementRef);

  isOpen = signal(false);
  unreadCount = this.notificationService.unreadCount;
  recentNotifications = this.notificationService.getRecentNotifications.bind(this.notificationService);

  toggle(): void {
    this.isOpen.update(v => !v);
  }

  close(): void {
    this.isOpen.set(false);
  }

  markAsRead(id: string): void {
    this.notificationService.markAsRead(id);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  typeIconClass(type: NotificationType): string {
    switch (type) {
      case 'GROUP_INVITATION': return 'group';
      case 'TRIP_INVITATION': return 'trip';
      case 'TRIP_UPDATE': return 'trip';
      case 'VOTE': return 'vote';
      case 'EXPENSE': return 'expense';
      case 'RESERVATION': return 'reservation';
      case 'CALENDAR': return 'calendar';
      case 'SYSTEM': return 'system';
    }
  }

  typeIconPath(type: NotificationType): string {
    switch (type) {
      case 'GROUP_INVITATION': return 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2';
      case 'TRIP_INVITATION': return 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z';
      case 'TRIP_UPDATE': return 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z';
      case 'VOTE': return 'M9 11l3 3L22 4';
      case 'EXPENSE': return 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6';
      case 'RESERVATION': return 'M2 9.5V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2.5a2.5 2.5 0 0 0 0 5V17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2.5a2.5 2.5 0 0 0 0-5Z';
      case 'CALENDAR': return 'M8 2v4M16 2v4M3 10h18';
      case 'SYSTEM': return 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2';
    }
  }

  formatRelativeTime(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }
}