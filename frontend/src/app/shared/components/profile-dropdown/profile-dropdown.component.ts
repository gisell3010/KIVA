import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-profile-dropdown',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="profile-dropdown">
      <button
        type="button"
        class="avatar avatar-sm profile-trigger"
        style="background: var(--accent-blue)"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-label]="'Menú de usuario: ' + (currentUser()?.full_name || 'Usuario')"
        (click)="toggle()"
      >
        {{ userInitials() }}
      </button>

      @if (isOpen()) {
        <div
          class="dropdown-panel"
          role="menu"
          (click)="$event.stopPropagation()"
        >
          <div class="dropdown-user">
            <div
              class="avatar avatar-md"
              style="background: var(--accent-blue)"
            >
              {{ userInitials() }}
            </div>

            <div class="user-info">
              <div class="user-name">
                {{ currentUser()?.full_name }}
              </div>

              <div class="user-email">
                {{ currentUser()?.email }}
              </div>

              <span
                class="badge"
                [ngClass]="roleBadgeClass(currentUser()?.role)"
              >
                {{ roleLabel(currentUser()?.role) }}
              </span>
            </div>
          </div>

          <div class="dropdown-divider"></div>

          <a
            routerLink="/perfil"
            class="dropdown-item"
            role="menuitem"
            (click)="close()"
          >
            <svg
              class="ui-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              aria-hidden="true"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>

            Mi perfil
          </a>

          <a
            routerLink="/configuracion"
            class="dropdown-item"
            role="menuitem"
            (click)="close()"
          >
            <svg
              class="ui-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
            </svg>

            Configuración
          </a>

          @if (isSupport()) {
            <div class="dropdown-divider"></div>

            <a
              routerLink="/soporte"
              class="dropdown-item support-item"
              role="menuitem"
              (click)="close()"
            >
              Panel de soporte
            </a>
          }

          @if (isAdmin()) {
            <a
              routerLink="/admin"
              class="dropdown-item admin-item"
              role="menuitem"
              (click)="close()"
            >
              Panel de administración
            </a>
          }

          @if (isSuperAdmin()) {
            <a
              routerLink="/super-admin"
              class="dropdown-item admin-item"
              role="menuitem"
              (click)="close()"
            >
              Super administración
            </a>
          }

          @if (isAdmin()) {
            <a
              routerLink="/dashboard"
              class="dropdown-item"
              role="menuitem"
              (click)="close()"
            >
              Cambiar a espacio de usuario
            </a>
          }

          <div class="dropdown-divider"></div>

          <button
            type="button"
            class="dropdown-item danger"
            role="menuitem"
            (click)="logout()"
          >
            <svg
              class="ui-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>

            Cerrar sesión
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .profile-dropdown {
      position: relative;
    }

    .profile-trigger {
      cursor: pointer;
      border: 2px solid transparent;
      transition: border-color 0.15s ease;
    }

    .profile-trigger:hover {
      border-color: var(--accent-blue);
    }

    .profile-trigger:focus-visible {
      outline: none;
      border-color: var(--accent-blue);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
    }

    .avatar-md {
      width: 40px;
      height: 40px;
      font-size: 0.85rem;
    }

    .dropdown-panel {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      z-index: 100;
      width: 260px;
      overflow: hidden;
      border: 1px solid var(--border-soft);
      border-radius: var(--radius);
      background: var(--bg-card);
      box-shadow: var(--shadow-glow);
      animation: dropdownIn 0.15s ease;
    }

    @keyframes dropdownIn {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .dropdown-user {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
    }

    .user-info {
      flex: 1;
      min-width: 0;
    }

    .user-name {
      overflow: hidden;
      font-size: 0.9rem;
      font-weight: 600;
      white-space: nowrap;
      text-overflow: ellipsis;
      color: var(--text-primary);
    }

    .user-email {
      overflow: hidden;
      margin-top: 2px;
      font-size: 0.75rem;
      white-space: nowrap;
      text-overflow: ellipsis;
      color: var(--text-muted);
    }

    .dropdown-divider {
      height: 1px;
      margin: 4px 0;
      background: var(--border-soft);
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 16px;
      border: none;
      background: transparent;
      color: var(--text-primary);
      font-size: 0.85rem;
      font-weight: 500;
      text-align: left;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .dropdown-item:hover,
    .dropdown-item:focus-visible {
      outline: none;
      background: var(--bg-panel-2);
    }

    .admin-item {
      color: var(--accent-purple);
    }

    .support-item {
      color: var(--accent-green);
    }

    .danger {
      color: var(--accent-red);
    }

    .danger:hover {
      background: rgba(239, 68, 68, 0.1);
    }

    @media (max-width: 480px) {
      .dropdown-panel {
        right: -16px;
        width: calc(100vw - 32px);
      }
    }
  `]
})
export class ProfileDropdownComponent {
  private readonly authService = inject(AuthService);
  private readonly elementRef = inject(ElementRef);

  readonly isOpen = signal(false);
  readonly currentUser = this.authService.user;
  readonly isAdmin = this.authService.isAdmin;
  readonly isSupport = this.authService.isSupport;
  readonly isSuperAdmin = this.authService.isSuperAdmin;

  toggle(): void {
    this.isOpen.update(value => !value);
  }

  close(): void {
    this.isOpen.set(false);
  }

  logout(): void {
    void this.authService.logout();
    this.close();
  }

  userInitials(): string {
    const name = this.currentUser()?.full_name?.trim();

    if (!name) {
      return '?';
    }

    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('');
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (
      this.isOpen() &&
      !this.elementRef.nativeElement.contains(event.target)
    ) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }
}