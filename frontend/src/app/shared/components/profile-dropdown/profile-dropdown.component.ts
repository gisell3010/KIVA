import { Component, signal, inject, HostListener, ElementRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthUser } from '../../../shared/models/domain.models';

@Component({
  selector: 'app-profile-dropdown',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="profile-dropdown" #dropdown>
      <button
        class="avatar avatar-sm profile-trigger"
        (click)="toggle()"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-label]="'Menú de usuario: ' + currentUser()?.displayName"
        type="button"
        [style.background]="currentUser()?.avatarColor"
      >
        {{ currentUser()?.initials }}
      </button>

      @if (isOpen()) {
        <div class="dropdown-panel" role="menu" (click)="$event.stopPropagation()">
          <div class="dropdown-user">
            <div class="avatar avatar-md" [style.background]="currentUser()?.avatarColor">
              {{ currentUser()?.initials }}
            </div>
            <div class="user-info">
              <div class="user-name">{{ currentUser()?.displayName }}</div>
              <div class="user-email">{{ currentUser()?.email }}</div>
              <span class="badge" [ngClass]="roleBadgeClass(currentUser()?.role)">
                {{ roleLabel(currentUser()?.role) }}
              </span>
            </div>
          </div>

          <div class="dropdown-divider"></div>

          <a routerLink="/perfil" class="dropdown-item" role="menuitem" (click)="close()">
            <svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Mi perfil
          </a>

          <a routerLink="/configuracion" class="dropdown-item" role="menuitem" (click)="close()">
            <svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
            </svg>
            Configuración
          </a>

          @if (isAdmin()) {
            <div class="dropdown-divider"></div>
            <a routerLink="/admin" class="dropdown-item admin-item" role="menuitem" (click)="close()">
              <svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2"/>
              </svg>
              Panel de administración
            </a>
            <a routerLink="/dashboard" class="dropdown-item" role="menuitem" (click)="close()">
              <svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                <path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>
                <path d="M9 22V12h6v10"/>
              </svg>
              Cambiar a espacio de usuario
            </a>
          }

          <div class="dropdown-divider"></div>

          <button class="dropdown-item danger" (click)="logout()" role="menuitem" type="button">
            <svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" x2="9" y1="12" y2="12"/>
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
      width: 260px;
      background: var(--bg-card);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius);
      box-shadow: var(--shadow-glow);
      overflow: hidden;
      z-index: 100;
      animation: dropdownIn 0.15s ease;
    }

    @keyframes dropdownIn {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
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
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-email {
      font-size: 0.75rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 2px;
    }

    .dropdown-divider {
      height: 1px;
      background: var(--border-soft);
      margin: 4px 0;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      color: var(--text-primary);
      font-size: 0.85rem;
      font-weight: 500;
      background: transparent;
      border: none;
      width: 100%;
      text-align: left;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .dropdown-item:hover {
      background: var(--bg-panel-2);
    }

    .dropdown-item:focus-visible {
      outline: none;
      background: var(--bg-panel-2);
    }

    .admin-item {
      color: var(--accent-purple);
    }

    .admin-item:hover {
      background: rgba(168, 85, 247, 0.1);
    }

    .danger {
      color: var(--accent-red);
    }

    .danger:hover {
      background: rgba(239, 68, 68, 0.1);
    }

    @media (max-width: 480px) {
      .dropdown-panel {
        width: calc(100vw - 32px);
        right: -16px;
      }
    }
  `]
})
export class ProfileDropdownComponent {
  private authService = inject(AuthService);
  private elementRef = inject(ElementRef);

  isOpen = signal(false);
  currentUser = this.authService.user;
  isAdmin = this.authService.isAdmin;

  toggle(): void {
    this.isOpen.update(v => !v);
  }

  close(): void {
    this.isOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
    this.close();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
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