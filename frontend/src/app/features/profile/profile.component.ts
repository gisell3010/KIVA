import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { UsersApiService } from '../../data-access/api/users-api.service';
import { TripsApiService } from '../../data-access/api/trips-api.service';
import { GroupsApiService } from '../../data-access/api/groups-api.service';
import { AuthSessionRead } from '../../shared/models/domain.models';
import { formatRelativeTime } from '../../shared/utils/date.utils';
import { ApiError } from '../../core/http/error.interceptor';
import { PrivateImageComponent } from '../../shared/components/private-image/private-image.component';

interface ProfileFormData {
  full_name: string;
  username: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PrivateImageComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly usersApi = inject(UsersApiService);
  private readonly tripsApi = inject(TripsApiService);
  private readonly groupsApi = inject(GroupsApiService);

  readonly currentUser = this.authService.user;

  readonly sessions = signal<AuthSessionRead[]>([]);
  readonly groupsCount = signal(0);
  readonly tripsCount = signal(0);

  readonly saving = signal(false);
  readonly saveSuccess = signal(false);
  readonly uploadingImage = signal(false);
  readonly imageError = signal<string | null>(null);

  readonly formData = signal<ProfileFormData>({
    full_name: '',
    username: ''
  });

  readonly formatRelativeTime = formatRelativeTime;

  currentSessionId: number | null = null;

  ngOnInit(): void {
    this.loadProfile();
    this.loadSessions();
    this.loadCounts();
  }

  loadProfile(): void {
    const user = this.currentUser();

    if (!user) {
      return;
    }

    this.formData.set({
      full_name: user.full_name,
      username: user.username
    });

    this.extractSessionId();
  }

  loadSessions(): void {
    this.usersApi.listSessions().subscribe({
      next: sessions => {
        this.sessions.set(sessions);
        this.extractSessionId();
      },
      error: () => {
        this.sessions.set([]);
      }
    });
  }

  loadCounts(): void {
    if (!this.currentUser()) {
      return;
    }

    this.groupsApi.list({
      page: 1,
      page_size: 1
    }).subscribe({
      next: page => {
        this.groupsCount.set(page.total);
      },
      error: () => {
        this.groupsCount.set(0);
      }
    });

    this.tripsApi.list({
      page: 1,
      page_size: 1
    }).subscribe({
      next: page => {
        this.tripsCount.set(page.total);
      },
      error: () => {
        this.tripsCount.set(0);
      }
    });
  }

  updateFormField(
    field: keyof ProfileFormData,
    value: string
  ): void {
    this.formData.update(data => ({
      ...data,
      [field]: value
    }));
  }

  saveProfile(): void {
    const data = this.formData();

    if (!data.full_name.trim() || !data.username.trim()) {
      this.imageError.set(
        'El nombre y el nombre de usuario son obligatorios.'
      );
      return;
    }

    this.saving.set(true);
    this.saveSuccess.set(false);
    this.imageError.set(null);

    this.usersApi.updateMe({
      full_name: data.full_name.trim(),
      username: data.username.trim()
    }).subscribe({
      next: user => {
        this.authService.updateUser(user);

        this.formData.set({
          full_name: user.full_name,
          username: user.username
        });

        this.saving.set(false);
        this.saveSuccess.set(true);

        setTimeout(() => {
          this.saveSuccess.set(false);
        }, 3000);
      },
      error: error => {
        this.saving.set(false);
        this.imageError.set(
          this.getErrorMessage(
            error,
            'Error al guardar el perfil.'
          )
        );
      }
    });
  }

  resetForm(): void {
    const user = this.currentUser();

    if (!user) {
      return;
    }

    this.formData.set({
      full_name: user.full_name,
      username: user.username
    });

    this.saveSuccess.set(false);
    this.imageError.set(null);
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.uploadImage(file);

    input.value = '';
  }

  uploadImage(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.imageError.set(
        'El archivo seleccionado debe ser una imagen.'
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.imageError.set(
        'La imagen no puede superar los 5 MB.'
      );
      return;
    }

    this.uploadingImage.set(true);
    this.imageError.set(null);

    this.usersApi.uploadProfileImage(file).subscribe({
      next: user => {
        this.authService.updateUser(user);
        this.uploadingImage.set(false);
      },
      error: error => {
        this.uploadingImage.set(false);
        this.imageError.set(
          this.getErrorMessage(
            error,
            'Error al subir la imagen.'
          )
        );
      }
    });
  }

  deleteImage(): void {
    this.imageError.set(null);

    this.usersApi.deleteProfileImage().subscribe({
      next: () => {
        const user = this.currentUser();

        if (!user) {
          return;
        }

        this.authService.updateUser({
          ...user,
          profile_image: null
        });
      },
      error: error => {
        this.imageError.set(
          this.getErrorMessage(
            error,
            'Error al eliminar la imagen.'
          )
        );
      }
    });
  }

  revokeSession(sessionId: number): void {
    this.imageError.set(null);

    this.usersApi.revokeSession(sessionId).subscribe({
      next: () => {
        this.sessions.update(sessions =>
          sessions.filter(session => session.id !== sessionId)
        );
      },
      error: error => {
        this.imageError.set(
          this.getErrorMessage(
            error,
            'Error al revocar la sesión.'
          )
        );
      }
    });
  }

  isCurrentSession(sessionId: number): boolean {
    return sessionId === this.currentSessionId;
  }

  roleBadgeClass(role?: string): string {
    switch (role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return 'badge-purple';

      case 'SUPPORT':
        return 'badge-green';

      case 'USER':
        return 'badge-blue';

      default:
        return 'badge-gray';
    }
  }

  roleLabel(role?: string): string {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Administrador';

      case 'ADMIN':
        return 'Administrador';

      case 'SUPPORT':
        return 'Soporte';

      case 'USER':
        return 'Usuario';

      default:
        return 'Usuario';
    }
  }

  private extractSessionId(): void {
    const token = this.authService.accessToken;

    if (!token) {
      this.currentSessionId = null;
      return;
    }

    try {
      const payload = token.split('.')[1];

      if (!payload) {
        this.currentSessionId = null;
        return;
      }

      const normalized = payload
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const padded = normalized.padEnd(
        Math.ceil(normalized.length / 4) * 4,
        '='
      );

      const decoded = atob(padded);
      const parsed = JSON.parse(decoded);
      const sessionId = Number(parsed.sid);

      this.currentSessionId = Number.isFinite(sessionId)
        ? sessionId
        : null;
    } catch {
      this.currentSessionId = null;
    }
  }

  private getErrorMessage(
    error: unknown,
    fallback: string
  ): string {
    if (error instanceof ApiError) {
      return error.message;
    }

    return fallback;
  }
}