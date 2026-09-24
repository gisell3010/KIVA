import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockDataService } from '../../data-access/mock/mock-data.service';
import { CalendarEvent } from '../../shared/models/domain.models';

interface CeldaCalendario {
  numero: number | null;
  fechaISO: string | null;
  eventos: { titulo: string; tipo: string }[];
}

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendario.component.html',
  styleUrl: './calendario.component.css'
})
export class CalendarioComponent {
  private mockData = inject(MockDataService);

  month = signal(10); // 0-indexed, noviembre
  year = signal(2026);

  monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  weekDays = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

  cells = computed<CeldaCalendario[]>(() => {
    const y = this.year();
    const m = this.month();
    const firstDay = new Date(y, m, 1);
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    let offset = firstDay.getDay() - 1;
    if (offset < 0) offset = 6;

    const events = this.mockData.calendarEvents();
    const cells: CeldaCalendario[] = [];

    for (let i = 0; i < offset; i++) {
      cells.push({ numero: null, fechaISO: null, eventos: [] });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const fechaISO = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvents = events.filter(e => e.date === fechaISO).map(e => ({ titulo: e.title, tipo: e.type }));
      cells.push({ numero: d, fechaISO, eventos: dayEvents });
    }
    return cells;
  });

  prevMonth(): void {
    let m = this.month() - 1;
    let y = this.year();
    if (m < 0) { m = 11; y -= 1; }
    this.month.set(m);
    this.year.set(y);
  }

  nextMonth(): void {
    let m = this.month() + 1;
    let y = this.year();
    if (m > 11) { m = 0; y += 1; }
    this.month.set(m);
    this.year.set(y);
  }

  eventTypeColor(type: string): string {
    switch (type) {
      case 'RESERVATION': return 'evt-cyan';
      case 'ACTIVITY': return 'evt-green';
      case 'VOTING': return 'evt-purple';
      case 'PAYMENT': return 'evt-orange';
      default: return 'evt-gray';
    }
  }

  eventTypeLabel(type: string): string {
    switch (type) {
      case 'RESERVATION': return 'Reserva';
      case 'ACTIVITY': return 'Actividad';
      case 'VOTING': return 'Votación';
      case 'PAYMENT': return 'Pago';
      default: return type;
    }
  }

  upcomingEvents = computed(() =>
    [...this.mockData.calendarEvents()].sort((a, b) => a.date.localeCompare(b.date))
  );
}