import { allPages } from '../../core/http/all-pages';
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/http/error.interceptor';
import { GroupsApiService } from '../../data-access/api/groups-api.service';
import { UsersApiService } from '../../data-access/api/users-api.service';
import {
  GroupCreate,
  GroupMemberRead,
  GroupRead,
  UserPublic,
} from '../../shared/models/domain.models';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';
import { formatDate } from '../../shared/utils/date.utils';

@Component({
  selector: 'app-grupos',
  standalone: true,
  imports: [CommonModule, FormsModule, UserAvatarComponent],
  templateUrl: './grupos.component.html',
  styleUrl: './grupos.component.css',
})
export class GruposComponent implements OnInit {
  private readonly groupsApi = inject(GroupsApiService);
  private readonly usersApi = inject(UsersApiService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  readonly groups = signal<GroupRead[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showCreate = signal(false);
  readonly showManage = signal(false);
  readonly selectedGroup = signal<GroupRead | null>(null);
  readonly members = signal<GroupMemberRead[]>([]);
  readonly userResults = signal<UserPublic[]>([]);
  readonly searchText = signal('');
  readonly searchingUsers = signal(false);
  readonly addingUserId = signal<number | null>(null);
  readonly form = signal<GroupCreate>({ name: '', description: null });
  readonly saving = signal(false);
  readonly currentUser = this.auth.user;
  readonly formatDate = formatDate;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
      }
    });
  }

  ngOnInit(): void {
    this.loadGroups();
  }

  loadGroups(): void {
    this.loading.set(true);
    allPages(page => this.groupsApi.list({ page, page_size: 100 })).subscribe({
      next: (p) => {
        this.groups.set(p.items);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.failError(e, 'Error al cargar los grupos.');
      },
    });
  }

  openCreateModal(): void {
    this.form.set({ name: '', description: null });
    this.showCreate.set(true);
  }

  closeCreateModal(): void {
    this.showCreate.set(false);
  }

  setForm(field: 'name' | 'description', value: string): void {
    this.form.update((f) => ({
      ...f,
      [field]: field === 'description' ? value.trim() || null : value,
    }));
  }

  createGroup(): void {
    const f = this.form();
    if (!f.name.trim()) return;
    this.saving.set(true);
    this.groupsApi
      .create({ name: f.name.trim(), description: f.description?.trim() || null })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.closeCreateModal();
          this.loadGroups();
        },
        error: (e) => {
          this.saving.set(false);
          this.failError(e, 'No se pudo crear el grupo.');
        },
      });
  }

  openManage(group: GroupRead): void {
    this.selectedGroup.set(group);
    this.form.set({ name: group.name, description: group.description });
    this.showManage.set(true);
    this.loadMembers(group.id);
  }

  closeManage(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }

    this.showManage.set(false);
    this.selectedGroup.set(null);
    this.members.set([]);
    this.userResults.set([]);
    this.searchText.set('');
    this.searchingUsers.set(false);
    this.addingUserId.set(null);
  }

  loadMembers(groupId: number): void {
    allPages(page => this.groupsApi.members(groupId, { page, page_size: 100 })).subscribe({
      next: (p) => this.members.set(p.items),
      error: (e) => this.failError(e, 'No se pudieron cargar los miembros.'),
    });
  }

  saveGroup(): void {
    const g = this.selectedGroup();
    const f = this.form();
    if (!g || g.my_role !== 'OWNER' || !f.name.trim()) return;
    this.saving.set(true);
    this.groupsApi
      .update(g.id, { name: f.name.trim(), description: f.description?.trim() || null })
      .subscribe({
        next: (updated) => {
          this.saving.set(false);
          this.selectedGroup.set(updated);
          this.loadGroups();
        },
        error: (e) => {
          this.saving.set(false);
          this.failError(e, 'No se pudo actualizar el grupo.');
        },
      });
  }

  onSearchTextChange(value: string): void {
    this.searchText.set(value);
    this.userResults.set([]);
    this.error.set(null);

    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }

    const query = value.trim();

    if (query.length < 3) {
      this.searchingUsers.set(false);
      return;
    }

    this.searchingUsers.set(true);
    this.searchTimer = setTimeout(() => this.searchUsers(query), 300);
  }

  private searchUsers(query: string): void {
    this.usersApi.search(query, { page: 1, page_size: 10 }).subscribe({
      next: (page) => {
        if (this.searchText().trim() !== query) {
          return;
        }

        this.userResults.set(
          page.items.filter(
            (user) => !this.members().some((member) => member.user_id === user.id),
          ),
        );
        this.searchingUsers.set(false);
      },
      error: (error) => {
        if (this.searchText().trim() !== query) {
          return;
        }

        this.userResults.set([]);
        this.searchingUsers.set(false);
        this.failError(error, 'No se pudo realizar la búsqueda.');
      },
    });
  }

  addMember(user: UserPublic): void {
    const group = this.selectedGroup();

    if (!group || group.my_role !== 'OWNER' || this.addingUserId()) {
      return;
    }

    this.addingUserId.set(user.id);
    this.error.set(null);

    this.groupsApi.addMember(group.id, user.id).subscribe({
      next: () => {
        this.addingUserId.set(null);
        this.userResults.set([]);
        this.searchText.set('');
        this.loadMembers(group.id);
        this.loadGroups();
      },
      error: (error) => {
        this.addingUserId.set(null);
        this.failError(error, 'No se pudo agregar a esta persona al grupo.');
      },
    });
  }

  removeMember(member: GroupMemberRead): void {
    const g = this.selectedGroup();
    if (
      !g ||
      g.my_role !== 'OWNER' ||
      member.role === 'OWNER' ||
      !confirm(`¿Retirar a ${member.full_name} del grupo?`)
    ) {
      return;
    }
    this.groupsApi.removeMember(g.id, member.user_id).subscribe({
      next: () => {
        this.loadMembers(g.id);
        this.loadGroups();
      },
      error: (e) => this.failError(e, 'No se pudo retirar el miembro.'),
    });
  }

  transfer(member: GroupMemberRead): void {
    const g = this.selectedGroup();
    if (
      !g ||
      g.my_role !== 'OWNER' ||
      member.role === 'OWNER' ||
      !confirm(`¿Transferir la responsabilidad del grupo a ${member.full_name}? Tú continuarás como miembro.`)
    ) {
      return;
    }
    this.groupsApi.transferOwnership(g.id, member.user_id).subscribe({
      next: () => {
        this.closeManage();
        this.loadGroups();
      },
      error: (e) => this.failError(e, 'No se pudo transferir la responsabilidad del grupo.'),
    });
  }

  leave(group: GroupRead): void {
    const user = this.currentUser();
    if (!user || group.my_role === 'OWNER' || !confirm(`¿Salir del grupo ${group.name}?`)) return;
    this.groupsApi.removeMember(group.id, user.id).subscribe({
      next: () => this.loadGroups(),
      error: (e) =>
        this.failError(e, 'No puedes salir mientras tengas participación en viajes del grupo.'),
    });
  }

  deleteGroup(): void {
    const g = this.selectedGroup();
    if (!g || g.my_role !== 'OWNER' || !confirm(`¿Eliminar el grupo ${g.name}?`)) return;
    this.groupsApi.delete(g.id).subscribe({
      next: () => {
        this.closeManage();
        this.loadGroups();
      },
      error: (e) => this.failError(e, 'El grupo no puede eliminarse mientras tenga viajes.'),
    });
  }

  roleLabel(role: string): string {
    return role === 'OWNER' ? 'Responsable del grupo' : 'Miembro';
  }

  private failError(e: unknown, f: string): void {
    this.error.set(e instanceof ApiError ? e.message : f);
  }
}