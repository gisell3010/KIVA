import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SupportApiService } from '../../../data-access/api/support-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { SupportDashboardRead, SupportReportRead } from '../../../shared/models/domain.models';
import { supportStatusLabel, supportStatusClass } from '../../../shared/utils/support.utils';
import { formatRelativeTime } from '../../../shared/utils/date.utils';

@Component({
  selector: 'app-support-dashboard', standalone: true, imports: [CommonModule, RouterLink],
  template: `
    <div class="support-page">
      <div class="page-head"><div><p class="eyebrow">Atención a usuarios</p><h1 class="page-title">Panel de soporte</h1><p class="page-subtitle">Consulta la cola de atención y continúa los casos a tu cargo.</p></div><a routerLink="/dashboard" class="btn btn-outline">Espacio personal</a></div>
      @if (loading()) { <div class="card state-card" role="status">Cargando información de soporte…</div> }
      @else if (error()) { <div class="card state-card" role="alert"><p>{{ error() }}</p><button class="btn btn-outline" (click)="loadDashboard()">Reintentar</button></div> }
      @else { @if (dashboard(); as data) {
        <div class="kpi-grid">
          <a class="card kpi blue" routerLink="/soporte/reportes" [queryParams]="{estado:'OPEN'}"><span>Por atender</span><strong>{{ data.open_reports_count }}</strong><small>Reportes abiertos <span aria-hidden="true">→</span></small></a>
          <a class="card kpi amber" routerLink="/soporte/reportes" [queryParams]="{estado:'IN_REVIEW'}"><span>En revisión</span><strong>{{ data.in_review_reports_count }}</strong><small>Atención en curso <span aria-hidden="true">→</span></small></a>
          <a class="card kpi purple" routerLink="/soporte/reportes" [queryParams]="{estado:'ESCALATED'}"><span>En administración</span><strong>{{ data.escalated_reports_count }}</strong><small>Casos escalados <span aria-hidden="true">→</span></small></a>
          <a class="card kpi green" routerLink="/soporte/reportes" [queryParams]="{estado:'RESOLVED'}"><span>Resueltos</span><strong>{{ data.resolved_reports_count }}</strong><small>Solución enviada <span aria-hidden="true">→</span></small></a>
        </div>
        <div class="workspace-grid">
          <section class="card"><div class="section-head"><h2>Últimas solicitudes</h2><a routerLink="/soporte/reportes">Ver todas</a></div>
            @for (report of recent(); track report.id) { <a class="recent-case" routerLink="/soporte/reportes" [queryParams]="{reporte:report.id}"><div class="case-number">#{{ report.id }}</div><div class="case-copy"><strong>{{ report.subject }}</strong><span>{{ formatRelativeTime(report.created_at) }} · {{ report.assigned_to_user_id ? 'Con responsable' : 'Sin asignar' }}</span></div><span class="badge" [ngClass]="statusClass(report.status)">{{ statusLabel(report.status) }}</span></a> }
            @if (!recent().length) { <p class="empty-state">No hay solicitudes registradas.</p> }
          </section>
          <section class="card guide"><h2>Tu espacio de atención</h2><p class="queue-count"><strong>{{ data.unassigned_reports_count }}</strong> reportes sin asignar</p><a class="btn btn-primary" routerLink="/soporte/reportes">Abrir cola de reportes</a><a class="btn btn-outline" routerLink="/soporte/usuarios">Consultar una cuenta</a><div class="guide-copy"><h3>Antes de responder</h3><p>Lee el caso y revisa la cuenta o el viaje relacionado. Da pasos concretos y registra la solución.</p><h3>{{ auth.isAdmin() ? 'Casos escalados' : '¿Requiere otra intervención?' }}</h3><p>{{ auth.isAdmin() ? 'Revisa el motivo del escalamiento, toma el caso y comunica la decisión al usuario.' : 'Indica qué revisaste y envía el caso a administración. El usuario recibirá un aviso.' }}</p></div></section>
        </div>
      } }
    </div>
  `,
  styles: [`
    .support-page { max-width:1300px; margin:auto; }
    .eyebrow { margin:0 0 8px; color:var(--text-muted); font-size:.72rem; letter-spacing:.07em; text-transform:uppercase; }
    .kpi-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:16px; margin-bottom:22px; }
    .kpi { display:flex; flex-direction:column; gap:12px; border-top:3px solid var(--accent-blue); }
    .kpi.amber { border-top-color:var(--accent-orange); } .kpi.purple { border-top-color:var(--accent-purple); } .kpi.green { border-top-color:var(--accent-green); }
    .kpi > span { font-size:.8rem; color:var(--text-secondary); } .kpi strong { font-size:2rem; font-weight:650; line-height:1; } .kpi small { display:flex; justify-content:space-between; color:var(--text-muted); font-size:.73rem; }
    .workspace-grid { display:grid; grid-template-columns:minmax(0,1.8fr) minmax(270px,1fr); gap:20px; align-items:start; }
    .section-head { display:flex; justify-content:space-between; gap:12px; padding-bottom:15px; border-bottom:1px solid var(--border-soft); }
    h2 { font-size:.95rem; } .section-head a { font-size:.78rem; color:var(--accent-blue); }
    .recent-case { display:flex; align-items:center; gap:12px; padding:18px 0; border-bottom:1px solid var(--border-soft); } .recent-case:last-child { border:0; }
    .recent-case:hover strong { color:var(--accent-blue); } .case-number { min-width:42px; color:var(--text-muted); font-size:.75rem; }
    .case-copy { flex:1; min-width:0; } .case-copy strong { display:block; font-size:.85rem; overflow-wrap:anywhere; } .case-copy > span { display:block; color:var(--text-muted); font-size:.74rem; margin-top:6px; }
    .guide { display:flex; flex-direction:column; gap:12px; } .queue-count { color:var(--text-secondary); font-size:.82rem; } .queue-count strong { font-size:1.25rem; color:var(--text-primary); }
    .guide-copy { margin-top:8px; padding-top:16px; border-top:1px solid var(--border-soft); } h3 { font-size:.82rem; } .guide-copy p { color:var(--text-secondary); font-size:.8rem; line-height:1.6; }
    @media(max-width:1100px) { .kpi-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .workspace-grid { grid-template-columns:1fr; } }
    @media(max-width:520px) { .kpi-grid { gap:10px; } .kpi { padding:15px; } .recent-case { flex-wrap:wrap; } .case-copy { flex-basis:65%; } }
  `]
})
export class SupportDashboardComponent implements OnInit {
  private readonly api = inject(SupportApiService);
  readonly auth = inject(AuthService);
  readonly dashboard = signal<SupportDashboardRead | null>(null);
  readonly recent = signal<SupportReportRead[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly statusLabel = supportStatusLabel;
  readonly statusClass = supportStatusClass;
  readonly formatRelativeTime = formatRelativeTime;
  ngOnInit(): void { this.loadDashboard(); }
  loadDashboard(): void {
    this.loading.set(true); this.error.set('');
    forkJoin({ dashboard: this.api.dashboard(), recent: this.api.reports({ page_size: 6 }) }).subscribe({
      next: result => { this.dashboard.set(result.dashboard); this.recent.set(result.recent.items); this.loading.set(false); },
      error: () => { this.loading.set(false); this.error.set('No pudimos cargar el panel. Intenta de nuevo.'); }
    });
  }
}
