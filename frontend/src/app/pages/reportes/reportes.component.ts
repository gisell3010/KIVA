import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, OnInit, DestroyRef, signal, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { allPages } from '../../core/http/all-pages';
import { SupportMessageRead } from '../../shared/models/domain.models';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupportApiService } from '../../data-access/api/support-api.service';
import { TripsApiService } from '../../data-access/api/trips-api.service';
import { ApiError } from '../../core/http/error.interceptor';
import {
  SupportCategory,
  SupportReportRead,
  TripRead
} from '../../shared/models/domain.models';
import { formatDateTime } from '../../shared/utils/date.utils';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})
export class ReportesComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  readonly selected = signal<SupportReportRead | null>(null);
  readonly messages = signal<SupportMessageRead[]>([]);
  replyText = '';
  page = 1;
  total = 0;
  messagePage = 1;
  messageTotal = 0;
  private detailVersion = 0;
  private listVersion = 0;
  private readonly supportApi = inject(SupportApiService);
  private readonly tripsApi = inject(TripsApiService);

  readonly reports = signal<SupportReportRead[]>([]);
  readonly trips = signal<TripRead[]>([]);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal('');

  category: SupportCategory = 'TECHNICAL';
  tripId: number | null = null;
  subject = '';
  description = '';

  readonly categories: { value: SupportCategory; label: string }[] = [
    { value: 'ACCESS', label: 'Acceso' },
    { value: 'ACCOUNT', label: 'Cuenta' },
    { value: 'TRIP', label: 'Viaje' },
    { value: 'EXPENSE', label: 'Gastos' },
    { value: 'VOTING', label: 'Votaciones' },
    { value: 'RESERVATION', label: 'Reservas' },
    { value: 'TECHNICAL', label: 'Problema técnico' },
    { value: 'OTHER', label: 'Otro' }
  ];

  readonly formatDateTime = formatDateTime;

  ngOnInit(): void {
    this.loadTrips();
    this.loadReports();
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = Number(params.get('reporte'));
      if (Number.isInteger(id) && id > 0) this.openReport(id);
    });
  }

  loadTrips(): void {
    allPages(page => this.tripsApi.list({ page, page_size: 100 })).subscribe({
      next: page => this.trips.set(page.items),
      error: () => this.trips.set([])
    });
  }

  loadReports(page = this.page): void {
    const version = ++this.listVersion;
    this.page = page;
    this.loading.set(true);
    this.error.set(null);
    this.supportApi.myReports(page).subscribe({
      next: page => {
        if (version !== this.listVersion) return;
        this.total = page.total;
        this.reports.set(page.items);
        this.loading.set(false);
      },
      error: error => {
        this.loading.set(false);
        this.fail(error);
      }
    });
  }

  onTripSelect(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.tripId = value ? Number(value) : null;
  }

  submit(): void {
    const subject = this.subject.trim();
    const description = this.description.trim();

    if (!subject || !description) {
      this.error.set('Completa el asunto y la descripción del reporte.');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    this.message.set('');

    this.supportApi.createReport({
      category: this.category,
      trip_id: this.tripId,
      subject,
      description
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.subject = '';
        this.description = '';
        this.tripId = null;
        this.message.set('Tu reporte fue enviado a soporte.');
        this.loadReports();
      },
      error: error => {
        this.submitting.set(false);
        this.fail(error);
      }
    });
  }

  statusLabel(status: SupportReportRead['status']): string {
    const labels = {
      OPEN: 'Abierto',
      IN_REVIEW: 'En revisión',
      ESCALATED: 'Escalado',
      RESOLVED: 'Resuelto',
      CLOSED: 'Cerrado'
    };
    return labels[status];
  }

  categoryLabel(category: SupportCategory): string {
    return this.categories.find(item => item.value === category)?.label ?? category;
  }

  openReport(id: number): void {
    const version = ++this.detailVersion;
    this.error.set(null); this.messages.set([]);
    this.supportApi.myReport(id).subscribe({
      next: report => { if (version !== this.detailVersion) return; this.selected.set(report); this.replyText = ''; this.loadMessages(1); },
      error: error => this.fail(error)
    });
  }

  loadMessages(page: number): void {
    const report = this.selected(); if (!report) return;
    this.supportApi.messages(report.id, false, page).subscribe({
      next: result => { if (this.selected()?.id !== report.id) return; this.messages.set(result.items); this.messagePage = page; this.messageTotal = result.total; },
      error: error => this.fail(error)
    });
  }

  reply(): void {
    const report = this.selected();
    if (!report || !this.replyText.trim() || this.submitting()) return;
    this.submitting.set(true); this.error.set(null);
    this.supportApi.reply(report.id, this.replyText.trim()).subscribe({
      next: () => { this.submitting.set(false); this.message.set('Respuesta enviada al equipo.'); this.openReport(report.id); this.loadReports(); },
      error: error => { this.submitting.set(false); this.fail(error); }
    });
  }

  private fail(error: unknown): void {
    this.error.set(
      error instanceof ApiError
        ? error.message
        : 'No se pudo completar la operación.'
    );
  }
}
