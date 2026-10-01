import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupsApiService } from '../../data-access/api/groups-api.service';
import { TripsApiService } from '../../data-access/api/trips-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { GroupRead, GroupMemberRead, GroupCreate } from '../../shared/models/domain.models';
import { formatDate } from '../../shared/utils/date.utils';
import { PrivateImageComponent } from '../../shared/components/private-image/private-image.component';
import { ApiError } from '../../core/http/error.interceptor';

@Component({
  selector: 'app-grupos',
  standalone: true,
  imports: [CommonModule, PrivateImageComponent],
  templateUrl: './grupos.component.html',
  styleUrl: './grupos.component.css'
})
export class GruposComponent implements OnInit {
  private groupsApi = inject(GroupsApiService);
  private tripsApi = inject(TripsApiService);
  private authService = inject(AuthService);

  groups = signal<GroupRead[]>([]);
  userGroups = signal<GroupRead[]>([]);
  otherGroups = signal<GroupRead[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  showModal = signal(false);
  newName = signal('');
  newDescription = signal('');

  groupMembersCache = new Map<number, GroupMemberRead[]>();
  groupTripsCache = new Map<number, number>();

  currentUser = this.authService.user;

  ngOnInit(): void {
    this.loadGroups();
  }

  loadGroups(): void {
    this.loading.set(true);
    this.error.set(null);

    this.groupsApi.list({ page: 1, page_size: 100 }).subscribe({
      next: (page) => {
        this.groups.set(page.items);
        this.splitGroups();
        this.loading.set(false);
      },
      error: (err) => {
        if (err instanceof ApiError) {
          this.error.set(err.message);
        } else {
          this.error.set('Error al cargar los grupos');
        }
        this.loading.set(false);
      },
    });
  }

  splitGroups(): void {
    const user = this.currentUser();
    if (!user) {
      this.userGroups.set([]);
      this.otherGroups.set(this.groups());
      return;
    }

    this.groupsApi.list({ page: 1, page_size: 100 }).subscribe({
      next: (page) => {
        const allGroups = page.items;
        const memberGroupIds = new Set<number>();

        for (const group of allGroups) {
          if (group.my_role) {
            memberGroupIds.add(group.id);
          }
        }

        this.userGroups.set(allGroups.filter(g => memberGroupIds.has(g.id)));
        this.otherGroups.set(allGroups.filter(g => !memberGroupIds.has(g.id)));

        for (const group of allGroups) {
          this.loadGroupDetails(group.id);
        }
      },
      error: () => {
        this.userGroups.set([]);
        this.otherGroups.set(this.groups());
      },
    });
  }

  loadGroupDetails(groupId: number): void {
    this.groupsApi.members(groupId, { page: 1, page_size: 100 }).subscribe({
      next: (page) => {
        this.groupMembersCache.set(groupId, page.items);
      },
    });

    this.tripsApi.list({ group_id: groupId, page: 1, page_size: 1 }).subscribe({
      next: (page) => {
        this.groupTripsCache.set(groupId, page.total);
      },
    });
  }

  getMemberCount(groupId: number): number {
    return this.groupMembersCache.get(groupId)?.length || 0;
  }

  getTripCount(groupId: number): number {
    return this.groupTripsCache.get(groupId) || 0;
  }

  getGroupMembers(groupId: number): GroupMemberRead[] {
    return this.groupMembersCache.get(groupId) || [];
  }

  getUserRole(groupId: number): string | null {
    const user = this.currentUser();
    if (!user) return null;
    const members = this.groupMembersCache.get(groupId);
    if (!members) return null;
    const member = members.find(m => m.user_id === user.id);
    return member?.role || null;
  }

  statusBadge(status: string): string {
    switch (status) {
      case 'PLANNING':
        return 'badge-orange';

      case 'CONFIRMED':
        return 'badge-blue';

      case 'COMPLETED':
        return 'badge-green';

      case 'CANCELLED':
        return 'badge-red';

      default:
        return 'badge-gray';
    }
  }

  roleBadge(role: string): string {
    switch (role) {
      case 'OWNER': return 'badge-purple';
      case 'MEMBER': return 'badge-blue';
      default: return 'badge-gray';
    }
  }

  roleLabel(role: string): string {
    switch (role) {
      case 'OWNER': return 'Propietario';
      case 'MEMBER': return 'Miembro';
      default: return role;
    }
  }

  formatDate = formatDate;

  openModal(): void {
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.newName.set('');
    this.newDescription.set('');
  }

  createGroup(): void {
    if (!this.newName().trim()) return;

    const data: GroupCreate = {
      name: this.newName().trim(),
      description: this.newDescription().trim() || null,
    };

    this.groupsApi.create(data).subscribe({
      next: (group) => {
        this.groups.update(list => [group, ...list]);
        this.splitGroups();
        this.closeModal();
      },
      error: (err) => {
        if (err instanceof ApiError) {
          this.error.set(err.message);
        } else {
          this.error.set('Error al crear el grupo');
        }
      },
    });
  }
}