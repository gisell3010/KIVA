import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockDataService } from '../../data-access/mock/mock-data.service';
import { User } from '../../shared/models/domain.models';

interface UserWithGroups extends User {
  groups: string[];
  roles: string[];
}

@Component({
  selector: 'app-participantes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './participantes.component.html',
  styleUrl: './participantes.component.css'
})
export class ParticipantesComponent {
  protected mockData = inject(MockDataService);

  users = this.mockData.users;
  groups = this.mockData.groups;
  groupMembers = this.mockData.groupMembers;

  usersWithGroups = computed((): UserWithGroups[] => {
    return this.users().map(user => {
      const memberships = this.groupMembers().filter(m => m.userId === user.id);
      const groupNames = memberships.map(m => this.groups().find(g => g.id === m.groupId)?.name).filter(Boolean) as string[];
      const roles = memberships.map(m => m.role);
      return { ...user, groups: groupNames, roles };
    });
  });

  roleBadge(role: string): string {
    switch (role) {
      case 'OWNER': return 'badge-purple';
      case 'ORGANIZER': return 'badge-blue';
      case 'MEMBER': return 'badge-green';
      case 'SUPER_ADMIN': return 'badge-purple';
      case 'ADMIN': return 'badge-purple';
      case 'SUPPORT': return 'badge-green';
      case 'USER': return 'badge-blue';
      default: return 'badge-gray';
    }
  }

  roleLabel(role: string): string {
    switch (role) {
      case 'OWNER': return 'Propietario';
      case 'ORGANIZER': return 'Organizador';
      case 'MEMBER': return 'Miembro';
      case 'SUPER_ADMIN': return 'Super Administrador';
      case 'ADMIN': return 'Administrador';
      case 'SUPPORT': return 'Soporte';
      case 'USER': return 'Usuario';
      default: return role;
    }
  }
}