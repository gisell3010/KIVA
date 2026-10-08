import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SupportApiService } from '../../../data-access/api/support-api.service';
import { GroupRead, TripRead, UserRead } from '../../../shared/models/domain.models';
import { ApiError } from '../../../core/http/error.interceptor';

@Component({
  selector: 'app-support-diagnostic', standalone: true, imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-head"><div><h1 class="page-title">Diagnóstico de viajes</h1><p class="page-subtitle">Consulta los registros relacionados con una incidencia.</p></div><a class="btn btn-outline" routerLink="/soporte/usuarios">Buscar otro usuario</a></div>
    @if (error()) { <div class="error-banner" role="alert">{{ error() }}</div> }
    @if (user(); as account) {
      <section class="card account"><div><h2>{{ account.full_name }}</h2><p>{{ account.email }} · {{ roleLabel(account.role) }} · {{ account.status === 'ACTIVE' ? 'Activa' : 'Suspendida' }}</p></div>
      </section>
      <div class="grid grid-cols-2 related">
        <section class="card"><h3>Grupos</h3>
          @for (group of groups(); track group.id) { <p>{{ group.name }} · {{ group.members_count }} miembros</p> }
          @if (!groups().length) { <p>No hay grupos asociados.</p> }
          <div class="context-actions"><button class="btn btn-sm btn-outline" [disabled]="groupPage <= 1" (click)="loadGroups(groupPage - 1)">Anterior</button><span>Página {{ groupPage }}</span><button class="btn btn-sm btn-outline" [disabled]="groupPage * 10 >= groupTotal" (click)="loadGroups(groupPage + 1)">Siguiente</button></div>
        </section>
        <section class="card"><h3>Viajes</h3>
          @for (trip of trips(); track trip.id) { <button class="trip-choice" [class.selected]="selectedTrip()?.id === trip.id" (click)="openTrip(trip)"><strong>{{ trip.name }}</strong><span>{{ trip.group_name }} · {{ tripLabel(trip.status) }}</span></button> }
          @if (!trips().length) { <p>No hay viajes asociados.</p> }
          <div class="context-actions"><button class="btn btn-sm btn-outline" [disabled]="tripPage <= 1" (click)="loadTrips(tripPage - 1)">Anterior</button><span>Página {{ tripPage }}</span><button class="btn btn-sm btn-outline" [disabled]="tripPage * 10 >= tripTotal" (click)="loadTrips(tripPage + 1)">Siguiente</button></div>
        </section>
      </div>
    } @else { <section class="card"><p>Selecciona una cuenta desde la consulta de usuarios para revisar una incidencia.</p></section> }
    @if (selectedTrip(); as trip) {
      <section class="card"><h2>{{ trip.name }}</h2><p>{{ trip.description }}</p>
        <div class="tabs" role="group" aria-label="Registros del viaje">@for (tab of sections; track tab.key) { <button class="btn btn-sm" [class.btn-primary]="section === tab.key" [class.btn-outline]="section !== tab.key" (click)="changeSection(tab.key)">{{ tab.label }}</button> }</div>
        @if (loading()) { <p role="status">Cargando registros...</p> }
        @for (row of rows(); track row.id) { <article class="record"><strong>{{ row.title }}</strong><p>{{ row.detail }}</p></article> }
        @if (!loading() && !rows().length) { <p>No hay registros en esta sección.</p> }
        <div class="context-actions"><button class="btn btn-sm btn-outline" [disabled]="page <= 1 || loading()" (click)="loadRows(page - 1)">Anterior</button><span>Página {{ page }} · {{ total }} registros</span><button class="btn btn-sm btn-outline" [disabled]="page * 20 >= total || loading()" (click)="loadRows(page + 1)">Siguiente</button></div>
      </section>
    }
  `,
  styles: [`
    .account { display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; }
    .related { margin:22px 0; } h2 { font-size:1.2rem; } p { color:var(--text-secondary); line-height:1.6; }
    .tabs { display:flex; gap:8px; flex-wrap:wrap; margin:20px 0; }
    .trip-choice { display:flex; flex-direction:column; gap:6px; text-align:left; width:100%; padding:14px; margin:12px 0; border:1px solid var(--border-soft); border-radius:10px; background:var(--bg-panel-2); color:var(--text-primary); cursor:pointer; }
    .trip-choice span { color:var(--text-secondary); } .trip-choice.selected { border-color:var(--border-focus); }
    .record { padding:16px 0; border-bottom:1px solid var(--border-soft); } .record:last-of-type { margin-bottom:18px; }
  `],
})
export class SupportDiagnosticComponent implements OnInit {
  private readonly api = inject(SupportApiService);
  private readonly route = inject(ActivatedRoute);
  readonly user = signal<UserRead | null>(null);
  readonly groups = signal<GroupRead[]>([]);
  readonly trips = signal<TripRead[]>([]);
  readonly selectedTrip = signal<TripRead | null>(null);
  readonly rows = signal<{ id: number; title: string; detail: string }[]>([]);
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);
  readonly sections = [{ key: 'participants', label: 'Participantes' }, { key: 'destinations', label: 'Destinos' }, { key: 'activities', label: 'Actividades' }, { key: 'expenses', label: 'Gastos' }, { key: 'splits', label: 'Repartos' }, { key: 'polls', label: 'Votaciones' }, { key: 'options', label: 'Resultados' }, { key: 'reservations', label: 'Reservas' }];
  section = 'participants'; page = 1; total = 0; groupPage = 1; tripPage = 1; groupTotal = 0; tripTotal = 0;
  readonly roleLabel = (role: string): string => ({ USER: 'Usuario', SUPPORT: 'Soporte', ADMIN: 'Administrador', SUPER_ADMIN: 'Superadministrador' }[role] ?? role);
  readonly tripLabel = (status: string): string => ({ PLANNING: 'En planificación', CONFIRMED: 'Confirmado', COMPLETED: 'Finalizado', CANCELLED: 'Cancelado' }[status] ?? status);
  private version = 0;
  ngOnInit(): void {
    const id = Number(this.route.snapshot.queryParamMap.get('user'));
    if (!Number.isInteger(id) || id <= 0) return;
    this.api.user(id).subscribe({ next: user => { this.user.set(user); this.loadGroups(1); this.loadTrips(1); }, error: e => this.fail(e) });
  }
  loadGroups(page: number): void {
    const id = this.user()?.id; if (!id) return;
    this.api.groups(id, page).subscribe({ next: result => { this.groups.set(result.items); this.groupPage = page; this.groupTotal = result.total; }, error: e => this.fail(e) });
  }
  loadTrips(page: number): void {
    const id = this.user()?.id; if (!id) return;
    this.api.trips(id, page).subscribe({ next: result => { this.trips.set(result.items); this.tripPage = page; this.tripTotal = result.total; }, error: e => this.fail(e) });
  }
  openTrip(trip: TripRead): void { this.selectedTrip.set(trip); this.section = 'participants'; this.loadRows(1); }
  changeSection(section: string): void { this.section = section; this.loadRows(1); }
  loadRows(page: number): void {
    const id = this.selectedTrip()?.id; if (!id) return;
    const version = ++this.version; this.loading.set(true); this.error.set(null); this.rows.set([]);
    this.api.diagnostic(id, this.section, page).subscribe({ next: result => { if (version !== this.version) return; this.rows.set(result.items); this.total = result.total; this.page = page; this.loading.set(false); }, error: e => { if (version !== this.version) return; this.loading.set(false); this.fail(e); } });
  }
  private fail(e: unknown): void { this.error.set(e instanceof ApiError ? e.message : 'No se pudo completar la consulta. Intenta nuevamente.'); }
}
