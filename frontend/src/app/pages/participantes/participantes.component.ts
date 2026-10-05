import { allPages } from '../../core/http/all-pages';
import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/http/error.interceptor';
import { GroupsApiService } from '../../data-access/api/groups-api.service';
import { TripsApiService } from '../../data-access/api/trips-api.service';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';
import { GroupMemberRead, TripMemberRead, TripRead } from '../../shared/models/domain.models';
import { isTripManager, isTripOwner } from '../../shared/utils/permissions.utils';

@Component({
  selector: 'app-participantes',
  standalone: true,
  imports: [CommonModule, FormsModule, UserAvatarComponent],
  templateUrl: './participantes.component.html',
  styleUrl: './participantes.component.css',
})
export class ParticipantesComponent implements OnInit {
  private readonly tripsApi = inject(TripsApiService);
  private readonly groupsApi = inject(GroupsApiService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly trips = signal<TripRead[]>([]);
  readonly selectedTripId = signal<number | null>(null);
  readonly members = signal<TripMemberRead[]>([]);
  readonly groupMembers = signal<GroupMemberRead[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showAdd = signal(false);
  readonly currentUser = this.auth.user;

  readonly selectedTrip = computed(
    () => this.trips().find((t) => t.id === this.selectedTripId()) ?? null,
  );
  readonly canManage = computed(() => isTripManager(this.selectedTrip()));
  readonly isOwner = computed(() => isTripOwner(this.selectedTrip()));
  readonly candidates = computed(() =>
    this.groupMembers().filter((g) => !this.members().some((m) => m.user_id === g.user_id)),
  );

  ngOnInit(): void {
    allPages(page => this.tripsApi.list({ page, page_size: 100 })).subscribe({
      next: (p) => {
        this.trips.set(p.items);
        const q = Number(this.route.snapshot.queryParamMap.get('trip'));
        const id = p.items.some((t) => t.id === q) ? q : (p.items[0]?.id ?? null);
        this.selectedTripId.set(id);
        if (id) this.load(id);
      },
      error: () => this.error.set('No se pudieron cargar los viajes.'),
    });
  }

  onTripSelect(e: Event): void {
    const id = Number((e.target as HTMLSelectElement).value);
    if (!id) {
      this.selectedTripId.set(null);
      this.members.set([]);
      return;
    }
    this.selectedTripId.set(id);
    this.load(id);
  }

  load(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    allPages(page => this.tripsApi.members(id, { page, page_size: 100 })).subscribe({
      next: (p) => {
        this.members.set(p.items);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.failError(e, 'No se pudieron cargar los participantes.');
      },
    });

    const trip = this.trips().find((t) => t.id === id);
    if (trip) {
      allPages(page => this.groupsApi.members(trip.group_id, { page, page_size: 100 })).subscribe({
        next: (p) => this.groupMembers.set(p.items),
        error: () => this.groupMembers.set([]),
      });
    }
  }

  add(member: GroupMemberRead, role: 'MEMBER' | 'ORGANIZER' = 'MEMBER'): void {
    const id = this.selectedTripId();
    if (!id || !this.canManage() || (role === 'ORGANIZER' && !this.isOwner())) return;
    this.tripsApi.addMember(id, { user_id: member.user_id, role }).subscribe({
      next: () => this.load(id),
      error: (e) => this.failError(e, 'No se pudo agregar el participante.'),
    });
  }

  changeRole(member: TripMemberRead, role: 'MEMBER' | 'ORGANIZER'): void {
    const id = this.selectedTripId();
    if (!id || !this.isOwner() || member.role === 'OWNER') return;
    this.tripsApi.updateMember(id, member.user_id, role).subscribe({
      next: () => this.load(id),
      error: (e) => this.failError(e, 'No se pudo cambiar el rol.'),
    });
  }

  remove(member: TripMemberRead): void {
    const id = this.selectedTripId();
    const me = this.currentUser()?.id;
    if (
      !id ||
      member.role === 'OWNER' ||
      !confirm(member.user_id === me ? '¿Salir de este viaje?' : `¿Retirar a ${member.full_name}?`)
    ) {
      return;
    }
    this.tripsApi.removeMember(id, member.user_id).subscribe({
      next: () => this.load(id),
      error: (e) =>
        this.failError(e, 'El participante tiene registros asociados o no tienes permiso.'),
    });
  }

  transfer(member: TripMemberRead): void {
    const id = this.selectedTripId();
    if (
      !id ||
      !this.isOwner() ||
      member.role === 'OWNER' ||
      !confirm(`¿Transferir la responsabilidad del viaje a ${member.full_name}? Tú continuarás como organizador.`)
    ) {
      return;
    }
    this.tripsApi.transferOwnership(id, member.user_id).subscribe({
      next: () => this.refreshTrips(id),
      error: (e) => this.failError(e, 'No se pudo transferir la responsabilidad del viaje.'),
    });
  }

  refreshTrips(id: number): void {
    allPages(page => this.tripsApi.list({ page, page_size: 100 })).subscribe({
      next: (p) => {
        this.trips.set(p.items);
        this.load(id);
      },
    });
  }

  canRemove(member: TripMemberRead): boolean {
    const me = this.currentUser()?.id;
    if (member.role === 'OWNER') return false;
    if (member.user_id === me) return true;
    if (this.isOwner()) return true;
    return this.selectedTrip()?.my_role === 'ORGANIZER' && member.role === 'MEMBER';
  }

  roleLabel(r: string): string {
    return r === 'OWNER' ? 'Responsable del viaje' : r === 'ORGANIZER' ? 'Organizador' : 'Participante';
  }

  private failError(e: unknown, f: string): void {
    this.error.set(e instanceof ApiError ? e.message : f);
  }
}