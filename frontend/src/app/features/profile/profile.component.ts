import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { MockDataService } from '../../data-access/mock/mock-data.service';
import { User } from '../../shared/models/domain.models';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  displayName: string;
  bio: string;
}

interface TravelPreferences {
  tripType: string;
  budgetRange: string;
  duration: string;
  accommodation: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  private authService = inject(AuthService);
  private mockData = inject(MockDataService);

  currentUser = this.authService.user;
  saving = signal(false);
  saveSuccess = signal(false);

  formData = signal<ProfileFormData>({
    firstName: '',
    lastName: '',
    displayName: '',
    bio: '',
  });

  travelPreferences = signal<TravelPreferences>({
    tripType: 'mixto',
    budgetRange: 'medio',
    duration: 'semana',
    accommodation: 'indiferente',
  });

  constructor() {
    effect(() => {
      const user = this.currentUser();
      if (user) {
        this.formData.set({
          firstName: user.firstName,
          lastName: user.lastName,
          displayName: user.displayName,
          bio: user.bio || '',
        });
      }
    });
  }

  groupsCount = computed(() => {
    const user = this.currentUser();
    if (!user) return 0;
    return this.mockData.groupMembers().filter(m => m.userId === user.id).length;
  });

  tripsCount = computed(() => {
    const user = this.currentUser();
    if (!user) return 0;
    return this.mockData.tripMembers().filter(m => m.userId === user.id).length;
  });

  expensesCount = computed(() => {
    const user = this.currentUser();
    if (!user) return 0;
    return this.mockData.expenses().filter(e => e.paidById === user.id).length;
  });

  recentActivity = computed(() => [
    { id: '1', title: 'Nuevo gasto registrado', description: 'Almuerzo regional - $85.000 COP', date: '2026-11-12T13:00:00Z', color: '#f97316', icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
    { id: '2', title: 'Votación completada', description: '¿Dónde alojarnos en El Chaltén?', date: '2026-09-25T23:59:00Z', color: '#a855f7', icon: 'M9 11l3 3L22 4' },
    { id: '3', title: 'Viaje confirmado', description: 'Caribe Colombiano 2026', date: '2025-09-15T10:00:00Z', color: '#22c55e', icon: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z' },
    { id: '4', title: 'Grupo creado', description: 'Amigos de la Universidad', date: '2025-08-01T10:00:00Z', color: '#3b82f6', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' },
  ]);

  updateFormField(field: keyof ProfileFormData, value: string): void {
    this.formData.update(d => ({ ...d, [field]: value }));
  }

  updateTravelPref(field: keyof TravelPreferences, value: string): void {
    this.travelPreferences.update(d => ({ ...d, [field]: value }));
  }

  saveProfile(): void {
    this.saving.set(true);
    this.saveSuccess.set(false);

    setTimeout(() => {
      const user = this.currentUser();
      if (user) {
        console.log('Saving profile:', this.formData());
      }
      this.saving.set(false);
      this.saveSuccess.set(true);
      setTimeout(() => this.saveSuccess.set(false), 3000);
    }, 800);
  }

  resetForm(): void {
    const user = this.currentUser();
    if (user) {
      this.formData.set({
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        bio: user.bio || '',
      });
    }
  }

  formatRelativeTime(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  roleBadgeClass(role?: string): string {
    switch (role) {
      case 'ADMIN': return 'badge-purple';
      case 'USER': return 'badge-blue';
      default: return 'badge-gray';
    }
  }

  roleLabel(role?: string): string {
    switch (role) {
      case 'ADMIN': return 'Administrador';
      case 'USER': return 'Usuario';
      default: return 'Usuario';
    }
  }
}