import { Injectable, signal, computed, effect } from '@angular/core';
import { Notification, NotificationType, UUID } from '../../shared/models/domain.models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _notifications = signal<Notification[]>(this.generateMockNotifications());

  readonly notifications = this._notifications.asReadonly();
  readonly unreadCount = computed(() => this._notifications().filter(n => !n.readAt).length);
  readonly unreadNotifications = computed(() => this._notifications().filter(n => !n.readAt));
  readonly readNotifications = computed(() => this._notifications().filter(n => n.readAt));

  private generateMockNotifications(): Notification[] {
    const now = new Date();
    const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

    return [
      {
        id: '1' as UUID,
        userId: '2' as UUID,
        type: 'GROUP_INVITATION',
        title: 'Nueva invitación a grupo',
        message: 'Julián Pérez te invitó a unirse al grupo "Aventura en la Patagonia"',
        readAt: undefined,
        createdAt: daysAgo(1),
        actionUrl: '/grupos/1',
      },
      {
        id: '2' as UUID,
        userId: '2' as UUID,
        type: 'TRIP_INVITATION',
        title: 'Invitación a viaje',
        message: 'Fuiste invitado al viaje "Cartagena 2026" en el grupo "Playas del Caribe"',
        readAt: undefined,
        createdAt: daysAgo(2),
        actionUrl: '/trips/2',
      },
      {
        id: '3' as UUID,
        userId: '2' as UUID,
        type: 'VOTE',
        title: 'Votación abierta',
        message: 'Se abrió una nueva votación: "¿Dónde alojarnos en El Chaltén?"',
        readAt: daysAgo(3),
        createdAt: daysAgo(3),
        actionUrl: '/votaciones',
      },
      {
        id: '4' as UUID,
        userId: '2' as UUID,
        type: 'EXPENSE',
        title: 'Nuevo gasto registrado',
        message: 'Andrés Torres registró un gasto de $450.000 COP para "Equipo de camping"',
        readAt: daysAgo(4),
        createdAt: daysAgo(4),
        actionUrl: '/gastos',
      },
      {
        id: '5' as UUID,
        userId: '2' as UUID,
        type: 'RESERVATION',
        title: 'Reserva confirmada',
        message: 'Tu reserva de vuelo Bogotá → Cartagena ha sido confirmada',
        readAt: daysAgo(5),
        createdAt: daysAgo(5),
        actionUrl: '/reservas',
      },
      {
        id: '6' as UUID,
        userId: '2' as UUID,
        type: 'CALENDAR',
        title: 'Recordatorio de actividad',
        message: 'Mañana: Trekking Laguna de los Tres a las 07:30',
        readAt: daysAgo(6),
        createdAt: daysAgo(6),
        actionUrl: '/calendario',
      },
      {
        id: '7' as UUID,
        userId: '2' as UUID,
        type: 'SYSTEM',
        title: 'Actualización de la plataforma',
        message: 'KIVA v2.1.0 ya está disponible con mejoras en el itinerario',
        readAt: daysAgo(7),
        createdAt: daysAgo(7),
        actionUrl: '/settings',
      },
      {
        id: '8' as UUID,
        userId: '2' as UUID,
        type: 'TRIP_UPDATE',
        title: 'Actualización de viaje',
        message: 'El viaje "Ruta Europea" cambió su fecha de inicio al 02/03/2027',
        readAt: daysAgo(8),
        createdAt: daysAgo(8),
        actionUrl: '/trips/3',
      },
    ];
  }

  markAsRead(id: UUID): void {
    this._notifications.update(list =>
      list.map(n => (n.id === id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n))
    );
  }

  markAllAsRead(): void {
    const now = new Date().toISOString();
    this._notifications.update(list =>
      list.map(n => (n.readAt ? n : { ...n, readAt: now }))
    );
  }

  deleteNotification(id: UUID): void {
    this._notifications.update(list => list.filter(n => n.id !== id));
  }

  getNotificationsByType(type: NotificationType): Notification[] {
    return this._notifications().filter(n => n.type === type);
  }

  getRecentNotifications(limit = 10): Notification[] {
    return [...this._notifications()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
  }
}