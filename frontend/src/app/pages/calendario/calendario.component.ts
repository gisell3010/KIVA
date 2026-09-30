import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarApiService } from '../../data-access/api/calendar-api.service';
import { CalendarEventRead } from '../../shared/models/domain.models';
import { formatDate, formatDateTime, toISODate } from '../../shared/utils/date.utils';
import { ApiError } from '../../core/http/error.interceptor';

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendario.component.html',
  styleUrl: './calendario.component.css'
})
export class CalendarioComponent implements OnInit {
  private readonly calendarApi = inject(CalendarApiService);

  readonly events = signal<CalendarEventRead[]>([]);

  readonly month = signal(new Date().getMonth());
  readonly year = signal(new Date().getFullYear());

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre'
  ];

  readonly weekDays = [
    'Lun',
    'Mar',
    'Mié',
    'Jue',
    'Vie',
    'Sáb',
    'Dom'
  ];

  readonly cells = computed(() => {
    const year = this.year();
    const month = this.month();

    const firstDay = new Date(
      year,
      month,
      1
    );

    const daysInMonth = new Date(
      year,
      month + 1,
      0
    ).getDate();

    let offset = firstDay.getDay() - 1;

    if (offset < 0) {
      offset = 6;
    }

    const cells: {
      numero: number | null;
      fechaISO: string | null;
      eventos: CalendarEventRead[];
    }[] = [];

    for (let i = 0; i < offset; i++) {
      cells.push({
        numero: null,
        fechaISO: null,
        eventos: []
      });
    }

    for (
      let day = 1;
      day <= daysInMonth;
      day++
    ) {
      const fechaISO = [
        year,
        String(month + 1).padStart(2, '0'),
        String(day).padStart(2, '0')
      ].join('-');

      const dayEvents = this.events().filter(
        event =>
          this.getEventDate(event) === fechaISO
      );

      cells.push({
        numero: day,
        fechaISO,
        eventos: dayEvents
      });
    }

    return cells;
  });

  readonly upcomingEvents = computed(() => {
    const today = toISODate(new Date());

    return [...this.events()]
      .filter(event => {
        const date = this.getEventDate(event);

        return date !== '' && date >= today;
      })
      .sort((a, b) => {
        const dateA = this.getEventDate(a);
        const dateB = this.getEventDate(b);

        return dateA.localeCompare(dateB);
      });
  });

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.loading.set(true);
    this.error.set(null);

    const start = new Date(
      this.year(),
      this.month(),
      1
    );

    const end = new Date(
      this.year(),
      this.month() + 1,
      0
    );

    const startStr = toISODate(start);
    const endStr = toISODate(end);

    this.calendarApi.list({
      start_date: startStr,
      end_date: endStr
    }).subscribe({
      next: events => {
        this.events.set(events);
        this.loading.set(false);
      },

      error: (err: unknown) => {
        this.events.set([]);

        if (err instanceof ApiError) {
          this.error.set(err.message);
        } else {
          this.error.set(
            'No se pudo cargar el calendario.'
          );
        }

        this.loading.set(false);
      }
    });
  }

  prevMonth(): void {
    let month = this.month() - 1;
    let year = this.year();

    if (month < 0) {
      month = 11;
      year -= 1;
    }

    this.month.set(month);
    this.year.set(year);

    this.loadEvents();
  }

  nextMonth(): void {
    let month = this.month() + 1;
    let year = this.year();

    if (month > 11) {
      month = 0;
      year += 1;
    }

    this.month.set(month);
    this.year.set(year);

    this.loadEvents();
  }

  eventTypeColor(
    type: CalendarEventRead['source_type']
  ): string {
    switch (type) {
      case 'RESERVATION':
        return 'evt-cyan';

      case 'ACTIVITY':
        return 'evt-green';

      case 'POLL':
        return 'evt-purple';

      case 'EXPENSE':
        return 'evt-orange';

      case 'TRIP':
        return 'evt-blue';

      default:
        return 'evt-gray';
    }
  }

  eventTypeLabel(
    type: CalendarEventRead['source_type']
  ): string {
    switch (type) {
      case 'RESERVATION':
        return 'Reserva';

      case 'ACTIVITY':
        return 'Actividad';

      case 'POLL':
        return 'Votación';

      case 'EXPENSE':
        return 'Gasto';

      case 'TRIP':
        return 'Viaje';

      default:
        return 'Evento';
    }
  }

  eventDateLabel(
    event: CalendarEventRead
  ): string {
    if (event.event_date) {
      const date = formatDate(
        event.event_date
      );

      if (event.start_time) {
        return `${date} · ${event.start_time}`;
      }

      return date;
    }

    if (event.deadline_at) {
      return formatDateTime(
        event.deadline_at
      );
    }

    return 'Sin fecha';
  }

  private getEventDate(
    event: CalendarEventRead
  ): string {
    if (event.event_date) {
      return event.event_date.split('T')[0];
    }

    if (event.deadline_at) {
      return event.deadline_at.split('T')[0];
    }

    return '';
  }
}