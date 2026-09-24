import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../notifications/notification.service';
import { Notification, NotificationType } from '../../../shared/models/domain.models';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './notifications-page.component.html',
  styleUrl: './notifications-page.component.css'
})
export class NotificationsPageComponent {
  private notificationService = inject(NotificationService);

  notifications = this.notificationService.notifications;
  unreadCount = this.notificationService.unreadCount;

  filteredNotifications = computed(() => this.notifications());

  markAsRead(id: string): void {
    this.notificationService.markAsRead(id);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  deleteNotification(id: string): void {
    this.notificationService.deleteNotification(id);
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

  typeLabel(type: NotificationType): string {
    switch (type) {
      case 'GROUP_INVITATION': return 'Invitación a grupo';
      case 'TRIP_INVITATION': return 'Invitación a viaje';
      case 'TRIP_UPDATE': return 'Actualización de viaje';
      case 'VOTE': return 'Votación';
      case 'EXPENSE': return 'Gasto';
      case 'RESERVATION': return 'Reserva';
      case 'CALENDAR': return 'Calendario';
      case 'SYSTEM': return 'Sistema';
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
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}