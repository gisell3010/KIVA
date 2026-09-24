import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockDataService } from '../../data-access/mock/mock-data.service';
import { AuthService } from '../../core/auth/auth.service';
import { Group } from '../../shared/models/domain.models';

@Component({
  selector: 'app-grupos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grupos.component.html',
  styleUrl: './grupos.component.css'
})
export class GruposComponent {
  private mockData = inject(MockDataService);
  private authService = inject(AuthService);

  groups = this.mockData.groups;
  currentUser = this.authService.user;

  showModal = signal(false);
  newName = signal('');
  newDescription = signal('');

  userGroups = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    const memberGroupIds = this.mockData.groupMembers()
      .filter(m => m.userId === user.id)
      .map(m => m.groupId);
    return this.groups().filter(g => memberGroupIds.includes(g.id));
  });

  otherGroups = computed(() => {
    const user = this.currentUser();
    if (!user) return this.groups();
    const memberGroupIds = this.mockData.groupMembers()
      .filter(m => m.userId === user.id)
      .map(m => m.groupId);
    return this.groups().filter(g => !memberGroupIds.includes(g.id));
  });

  userGroupTripCounts = computed(() => {
    const trips = this.mockData.trips();
    const counts = new Map<string, number>();
    for (const trip of trips) {
      counts.set(trip.groupId, (counts.get(trip.groupId) || 0) + 1);
    }
    return counts;
  });

  getMemberCount(groupId: string): number {
    return this.mockData.getGroupMembers(groupId).length;
  }

  getTripCount(groupId: string): number {
    return this.userGroupTripCounts().get(groupId) || 0;
  }

  getUserRole(groupId: string): string | null {
    const user = this.currentUser();
    if (!user) return null;
    const member = this.mockData.getGroupMembers(groupId).find(m => m.userId === user.id);
    return member?.role || null;
  }

  getGroupMembers(groupId: string) {
    return this.mockData.getGroupMembers(groupId);
  }

  getUser(userId: string) {
    return this.mockData.getUser(userId);
  }

  statusBadge(status: string): string {
    switch (status) {
      case 'PLANNING': return 'badge-orange';
      case 'CONFIRMED': return 'badge-blue';
      case 'IN_PROGRESS': return 'badge-green';
      default: return 'badge-gray';
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

  formatMoney(v: number): string {
    return v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  }

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
    const colors = ['#3b82f6', '#22c55e', '#a855f7', '#f97316', '#ec4899', '#06b6d4'];
    const newGroup: Group = {
      id: crypto.randomUUID(),
      name: this.newName(),
      description: this.newDescription() || 'Nuevo grupo de viaje creado en KIVA.',
      ownerId: this.currentUser()?.id || '1',
      colorTheme: colors[Math.floor(Math.random() * colors.length)],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.groups.set([newGroup, ...this.groups()]);
    this.closeModal();
  }
}