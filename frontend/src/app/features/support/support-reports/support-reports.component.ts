import { Component, OnInit, DestroyRef, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SupportApiService } from '../../../data-access/api/support-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiError } from '../../../core/http/error.interceptor';
import { SupportCategory, SupportReportDetail, SupportReportRead, SupportStatus, SupportMessageRead, SupportReporterRead } from '../../../shared/models/domain.models';
import { supportStatuses, supportCategories, supportStatusLabel, supportCategoryLabel, supportStatusClass } from '../../../shared/utils/support.utils';
import { formatDateTime } from '../../../shared/utils/date.utils';

@Component({
  selector: 'app-support-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './support-reports.component.html',
  styleUrl: './support-reports.component.css'
})
export class SupportReportsComponent implements OnInit {
  private readonly api = inject(SupportApiService);
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private request?: Subscription;
  private detailRequest?: Subscription;
  readonly reports = signal<SupportReportRead[]>([]);
  readonly selected = signal<SupportReportDetail | null>(null);
  readonly messages = signal<SupportMessageRead[]>([]);
  readonly agents = signal<SupportReporterRead[]>([]);
  readonly loading = signal(false);
  readonly detailLoading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  query = '';
  statusFilter: SupportStatus | '' = '';
  categoryFilter: SupportCategory | '' = '';
  assignment = '';
  response = '';
  internal = false;
  reason = '';
  showEscalation = false;
  assigneeId: number | null = null;
  page = 1;
  total = 0;
  messagePage = 1;
  messageTotal = 0;
  readonly statuses = supportStatuses;
  readonly categories = supportCategories;
  readonly statusLabel = supportStatusLabel;
  readonly categoryLabel = supportCategoryLabel;
  readonly statusClass = supportStatusClass;
  readonly formatDateTime = formatDateTime;

  ngOnInit(): void {
    this.api.agents().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: agents => this.agents.set(agents), error: err => this.fail(err) });
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const status = params.get('estado') as SupportStatus;
      this.statusFilter = this.statuses.some(item => item.value === status) ? status : '';
      this.load(1);
      const id = Number(params.get('reporte'));
      if (Number.isInteger(id) && id > 0) this.openReport(id);
    });
  }

  load(page = 1): void {
    this.request?.unsubscribe();
    this.loading.set(true); this.error.set(''); this.page = page;
    this.request = this.api.reports({ page, page_size: 20, q: this.query.trim() || undefined,
      status: this.statusFilter || undefined, category: this.categoryFilter || undefined,
      assigned_to_me: this.assignment === 'mine' || undefined, unassigned: this.assignment === 'unassigned' || undefined
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => { this.reports.set(result.items); this.total = result.total; this.loading.set(false); },
      error: err => { this.loading.set(false); this.fail(err); }
    });
  }

  clearFilters(): void { this.query = ''; this.statusFilter = ''; this.categoryFilter = ''; this.assignment = ''; this.load(); }
  openReport(id: number): void {
    this.detailRequest?.unsubscribe();
    this.error.set(''); this.message.set(''); this.selected.set(null); this.detailLoading.set(true);
    this.detailRequest = this.api.report(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: report => {
        this.selected.set(report); this.response = ''; this.reason = ''; this.internal = false;
        this.showEscalation = false; this.assigneeId = report.assigned_to_user_id;
        this.detailLoading.set(false); this.loadMessages(1);
        setTimeout(() => document.getElementById('case-title')?.focus(), 0);
      }, error: err => { this.detailLoading.set(false); this.fail(err); }
    });
  }
  closeDetail(): void { if (!this.saving()) this.selected.set(null); }
  loadMessages(page: number): void {
    const id = this.selected()?.id; if (!id) return;
    this.api.messages(id, true, page).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => { if (this.selected()?.id !== id) return; this.messages.set(result.items); this.messagePage = page; this.messageTotal = result.total; },
      error: err => this.fail(err)
    });
  }
  canManage(report: SupportReportRead): boolean {
    return report.assigned_to_user_id === this.auth.currentUserId() && (report.status !== 'ESCALATED' || this.auth.isAdmin());
  }
  canTake(report: SupportReportRead): boolean {
    const assigneeActive = this.agents().some(agent => agent.id === report.assigned_to_user_id);
    return (!report.assigned_to_user_id || !assigneeActive) && !['RESOLVED', 'CLOSED'].includes(report.status) && (report.status !== 'ESCALATED' || this.auth.isAdmin());
  }
  eligibleAgents(report: SupportReportRead): SupportReporterRead[] { return this.agents().filter(agent => report.status !== 'ESCALATED' || agent.role !== 'SUPPORT'); }
  assigneeName(id: number | null): string { return this.agents().find(agent => agent.id === id)?.full_name ?? (id ? 'Cuenta no disponible' : 'Sin asignar'); }
  assignSelf(id: number): void { this.run(this.api.assignSelf(id), 'El reporte quedó a tu cargo.'); }
  assign(id: number): void { if (this.assigneeId) this.run(this.api.assign(id, this.assigneeId), 'Asignación actualizada.'); }
  escalate(id: number): void {
    if (this.reason.trim().length < 10) { this.error.set('Describe el motivo del escalamiento con al menos 10 caracteres.'); return; }
    this.run(this.api.escalate(id, this.reason.trim()), 'Administración recibió el caso.');
  }
  resolve(id: number): void {
    if (!this.response.trim()) { this.error.set('Escribe la solución que recibirá el usuario.'); return; }
    this.run(this.api.updateReport(id, { status: 'RESOLVED', response: this.response.trim() }), 'Solución enviada. El usuario puede responder si necesita continuar.');
  }
  changeStatus(id: number, status: SupportStatus): void { this.run(this.api.updateReport(id, { status }), status === 'CLOSED' ? 'Reporte cerrado.' : 'Reporte en revisión.'); }
  send(report: SupportReportRead): void {
    if (!this.response.trim() || this.saving()) { this.error.set('Escribe un mensaje antes de enviarlo.'); return; }
    this.saving.set(true); this.error.set('');
    this.api.reply(report.id, this.response.trim(), true, this.internal).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.saving.set(false); this.message.set(this.internal ? 'Nota interna guardada.' : 'Respuesta enviada.'); this.response = ''; this.loadMessages(this.messagePage); },
      error: err => { this.saving.set(false); this.fail(err); }
    });
  }
  private run(request: Observable<SupportReportDetail>, message: string): void {
    if (this.saving()) return;
    this.saving.set(true); this.error.set(''); this.message.set('');
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: report => { this.selected.set(report); this.response = ''; this.reason = ''; this.showEscalation = false; this.assigneeId = report.assigned_to_user_id; this.saving.set(false); this.message.set(message); this.loadMessages(this.messagePage); this.load(this.page); },
      error: err => { this.saving.set(false); this.fail(err); }
    });
  }
  private fail(error: unknown): void { this.error.set(error instanceof ApiError ? error.message : 'No pudimos completar la solicitud. Intenta de nuevo.'); }
}
