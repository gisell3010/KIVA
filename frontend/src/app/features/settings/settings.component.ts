import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ThemeService, ThemeMode } from '../../core/theme/theme.service';
import { AuthService } from '../../core/auth/auth.service';
import { UsersApiService } from '../../data-access/api/users-api.service';

interface ThemeOption {
  value: ThemeMode;
  label: string;
  description: string;
  icon: {
    viewBox: string;
    path: string;
  };
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="settings-page">
      <div class="page-head">
        <div>
          <h1 class="page-title">Configuración</h1>
          <p class="page-subtitle">
            Personaliza tu experiencia en KIVA
          </p>
        </div>
      </div>

      <div class="settings-grid">
        <section class="card settings-section">
          <h2 class="section-title">Apariencia</h2>
          <p class="section-description">
            Elige cómo se ve KIVA en tu dispositivo
          </p>

          <div class="setting-group">
            <label class="setting-label">Tema</label>

            <div
              class="theme-options"
              role="radiogroup"
              aria-label="Seleccionar tema"
            >
              @for (theme of themes(); track theme.value) {
                <label
                  class="theme-option"
                  [class.active]="currentTheme() === theme.value"
                >
                  <input
                    type="radio"
                    name="theme"
                    [value]="theme.value"
                    [checked]="currentTheme() === theme.value"
                    (change)="setTheme(theme.value)"
                  />

                  <div class="theme-option-content">
                    <svg
                      class="theme-icon"
                      [attr.viewBox]="theme.icon.viewBox"
                      aria-hidden="true"
                    >
                      <path
                        [attr.d]="theme.icon.path"
                        stroke="currentColor"
                        stroke-width="1.5"
                        fill="none"
                      />
                    </svg>

                    <div>
                      <div class="theme-name">
                        {{ theme.label }}
                      </div>

                      <div class="theme-desc">
                        {{ theme.description }}
                      </div>
                    </div>
                  </div>

                  <div
                    class="theme-check"
                    aria-hidden="true"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                </label>
              }
            </div>
          </div>
        </section>

        <section class="card settings-section">
          <h2 class="section-title">Cuenta</h2>
          <p class="section-description">
            Información básica de tu cuenta
          </p>

          <div class="setting-group">
            <label class="setting-label">
              Perfil
            </label>

            <div class="account-info">
              <div
                class="avatar avatar-lg"
                style="background: var(--accent-blue)"
              >
                {{ userInitials() }}
              </div>

              <div>
                <div class="account-name">
                  {{ currentUser()?.full_name || 'Usuario' }}
                </div>

                <div class="account-email">
                  &#64;{{ currentUser()?.username }}
                </div>

                <a
                  routerLink="/perfil"
                  class="link-btn"
                >
                  Editar perfil →
                </a>
              </div>
            </div>
          </div>

          <div class="setting-divider"></div>

          <div class="setting-group">
            <label class="setting-label">Correo electrónico</label>
            <form class="account-form" (ngSubmit)="changeEmail()">
              <input
                class="form-input"
                type="email"
                name="newEmail"
                autocomplete="email"
                required
                [ngModel]="emailForm().email"
                (ngModelChange)="setEmailField('email', $event)"
                aria-label="Nuevo correo electrónico"
              />
              <input
                class="form-input"
                type="password"
                name="emailPassword"
                autocomplete="current-password"
                required
                [ngModel]="emailForm().current_password"
                (ngModelChange)="setEmailField('current_password', $event)"
                placeholder="Contraseña actual"
                aria-label="Contraseña actual para cambiar el correo"
              />
              <button class="btn btn-outline" type="submit" [disabled]="savingEmail()">
                {{ savingEmail() ? 'Actualizando...' : 'Actualizar correo' }}
              </button>
            </form>
          </div>

          <div class="setting-divider"></div>

          <div class="setting-group">
            <label class="setting-label">Contraseña</label>
            <form class="account-form" (ngSubmit)="changePassword()">
              <input
                class="form-input"
                type="password"
                name="currentPassword"
                autocomplete="current-password"
                required
                [ngModel]="passwordForm().current_password"
                (ngModelChange)="setPasswordField('current_password', $event)"
                placeholder="Contraseña actual"
              />
              <input
                class="form-input"
                type="password"
                name="newPassword"
                autocomplete="new-password"
                required
                minlength="10"
                [ngModel]="passwordForm().new_password"
                (ngModelChange)="setPasswordField('new_password', $event)"
                placeholder="Nueva contraseña (mínimo 10 caracteres)"
              />
              <button class="btn btn-outline" type="submit" [disabled]="savingPassword()">
                {{ savingPassword() ? 'Actualizando...' : 'Cambiar contraseña' }}
              </button>
            </form>
            @if (accountMessage()) {
              <p class="account-message" role="status">{{ accountMessage() }}</p>
            }
          </div>

          <div class="setting-divider"></div>

          <div class="setting-group">
            <label class="setting-label">
              Rol en la plataforma
            </label>

            <span
              class="badge role-badge"
              [ngClass]="roleBadgeClass(currentUser()?.role)"
            >
              {{ roleLabel(currentUser()?.role) }}
            </span>
          </div>
        </section>

        <section class="card settings-section">
          <h2 class="section-title">Sesiones</h2>
          <p class="section-description">
            Gestiona tus sesiones activas
          </p>

          <div class="setting-group">
            <div class="notification-toggle">
              <div class="notification-info">
                <div class="notification-name">
                  Cerrar sesión en todos los dispositivos
                </div>

                <div class="notification-desc">
                  Invalida las sesiones activas de tu cuenta
                </div>
              </div>

              <button
                type="button"
                class="btn btn-outline btn-danger"
                [disabled]="loggingOutAll()"
                (click)="logoutAll()"
              >
                @if (loggingOutAll()) {
                  <svg
                    class="ui-icon animate-spin"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <path
                      d="M21 12a9 9 0 11-6.219-8.56"
                    />
                  </svg>

                  Cerrando...
                } @else {
                  Cerrar todas las sesiones
                }
              </button>
            </div>
          </div>
        </section>

        <section class="card settings-section">
          <h2 class="section-title">Accesibilidad</h2>
          <p class="section-description">
            Ajustes para mejorar la usabilidad
          </p>

          <div class="setting-group">
            <div class="notification-toggle">
              <div class="notification-info">
                <div class="notification-name">
                  Reducir animaciones
                </div>

                <div class="notification-desc">
                  Reduce transiciones y animaciones de la interfaz
                </div>
              </div>

              <label class="toggle-switch">
                <input
                  type="checkbox"
                  [checked]="reduceMotion()"
                  (change)="toggleReduceMotion($event)"
                />

                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="setting-group">
            <div class="notification-toggle">
              <div class="notification-info">
                <div class="notification-name">
                  Alto contraste
                </div>

                <div class="notification-desc">
                  Aumenta el contraste visual para mejorar la legibilidad
                </div>
              </div>

              <label class="toggle-switch">
                <input
                  type="checkbox"
                  [checked]="highContrast()"
                  (change)="toggleHighContrast($event)"
                />

                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,

  styles: [`
    .settings-page {
      max-width: 900px;
    }

    .settings-grid {
      display: grid;
      grid-template-columns:
        repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
    }

    .settings-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .section-title {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .section-description {
      margin: 0;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .setting-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .setting-label {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .setting-divider {
      height: 1px;
      margin: 2px 0;
      background: var(--border-soft);
    }

    .account-info {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .account-name {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .account-email,
    .account-help {
      margin-top: 2px;
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .link-btn {
      display: inline-block;
      margin-top: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--accent-cyan);
    }

    .link-btn:hover {
      text-decoration: underline;
    }

    .role-badge {
      width: fit-content;
    }

    .theme-options {
      display: grid;
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
      gap: 12px;
    }

    .theme-option {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 14px;
      border: 2px solid var(--border-soft);
      border-radius: 12px;
      text-align: center;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .theme-option:hover {
      border-color: var(--border-medium);
      background: var(--bg-hover);
    }

    .theme-option.active {
      border-color: var(--accent-blue);
      background: rgba(59, 130, 246, 0.08);
    }

    .theme-option input {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }

    .theme-option-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }

    .theme-icon {
      width: 32px;
      height: 32px;
      color: var(--text-secondary);
    }

    .theme-option.active .theme-icon {
      color: var(--accent-blue);
    }

    .theme-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .theme-desc {
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    .theme-check {
      position: absolute;
      top: 8px;
      right: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border: 2px solid var(--border-soft);
      border-radius: 50%;
      background: var(--bg-panel-2);
      opacity: 0;
      transform: scale(0.8);
      transition: all var(--transition-fast);
    }

    .theme-option.active .theme-check {
      border-color: var(--accent-blue);
      background: var(--accent-blue);
      color: #fff;
      opacity: 1;
      transform: scale(1);
    }

    .notification-toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .notification-info {
      flex: 1;
      min-width: 0;
    }

    .notification-name {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .notification-desc {
      margin-top: 2px;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .toggle-switch {
      position: relative;
      width: 48px;
      height: 28px;
      flex-shrink: 0;
    }

    .toggle-switch input {
      position: absolute;
      width: 0;
      height: 0;
      opacity: 0;
    }

    .toggle-slider {
      position: absolute;
      inset: 0;
      border-radius: 28px;
      background: var(--border-medium);
      cursor: pointer;
      transition: background var(--transition-fast);
    }

    .toggle-slider::before {
      content: '';
      position: absolute;
      top: 3px;
      left: 3px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      transition: transform var(--transition-fast);
    }

    .toggle-switch input:checked + .toggle-slider {
      background: var(--accent-blue);
    }

    .toggle-switch input:checked + .toggle-slider::before {
      transform: translateX(20px);
    }

    .toggle-switch input:focus-visible + .toggle-slider {
      box-shadow:
        0 0 0 3px rgba(59, 130, 246, 0.4);
    }

    .btn-outline.btn-danger {
      border-color: var(--accent-red);
      background: transparent;
      color: var(--accent-red);
    }

    .btn-outline.btn-danger:hover {
      background: rgba(239, 68, 68, 0.1);
    }

    .animate-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    @media (max-width: 850px) {
      .settings-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 500px) {
      .theme-options {
        grid-template-columns: 1fr;
      }

      .notification-toggle {
        align-items: flex-start;
        flex-direction: column;
      }
    }
  `]
})
export class SettingsComponent {
  private readonly themeService = inject(ThemeService);
  private readonly authService = inject(AuthService);
  private readonly usersApi = inject(UsersApiService);
  private readonly router = inject(Router);

  readonly currentTheme = this.themeService.currentTheme;
  readonly currentUser = this.authService.user;

  readonly themes = signal<ThemeOption[]>([
    {
      value: 'light',
      label: 'Claro',
      description: 'Interfaz clara',
      icon: {
        viewBox: '0 0 24 24',
        path:
          'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
      }
    },
    {
      value: 'dark',
      label: 'Oscuro',
      description: 'Interfaz oscura',
      icon: {
        viewBox: '0 0 24 24',
        path:
          'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z'
      }
    },
    {
      value: 'system',
      label: 'Sistema',
      description: 'Usar preferencia del sistema',
      icon: {
        viewBox: '0 0 24 24',
        path:
          'M18 13a6 6 0 01-6 6 6 6 0 01-6-6H2M12 22V12M6 12H4m16 0h-2'
      }
    }
  ]);

  readonly reduceMotion = signal(false);
  readonly highContrast = signal(false);
  readonly loggingOutAll = signal(false);
  readonly savingEmail = signal(false);
  readonly savingPassword = signal(false);
  readonly accountMessage = signal<string | null>(null);
  readonly emailForm = signal({ email: '', current_password: '' });
  readonly passwordForm = signal({ current_password: '', new_password: '' });

  constructor() {
    effect(() => {
      const email = this.currentUser()?.email ?? '';
      if (!this.emailForm().current_password) {
        this.emailForm.update(value => ({ ...value, email }));
      }
    });

    effect(() => {
      document.documentElement.classList.toggle(
        'reduce-motion',
        this.reduceMotion()
      );
    });

    effect(() => {
      document.documentElement.classList.toggle(
        'high-contrast',
        this.highContrast()
      );
    });
  }

  setTheme(theme: ThemeMode): void {
    this.themeService.setTheme(theme);
  }

  toggleReduceMotion(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.reduceMotion.set(input.checked);
  }

  toggleHighContrast(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.highContrast.set(input.checked);
  }

  logoutAll(): void {
    if (this.loggingOutAll()) {
      return;
    }

    this.loggingOutAll.set(true);

    this.usersApi.logoutAll().subscribe({
      next: () => {
        this.loggingOutAll.set(false);
        this.authService.clearSession();
      },
      error: () => {
        this.loggingOutAll.set(false);
      }
    });
  }


  setEmailField(field: 'email' | 'current_password', value: string): void {
    this.emailForm.update(current => ({ ...current, [field]: value }));
  }

  setPasswordField(field: 'current_password' | 'new_password', value: string): void {
    this.passwordForm.update(current => ({ ...current, [field]: value }));
  }

  changeEmail(): void {
    const data = this.emailForm();
    if (!data.email.trim() || !data.current_password) return;
    this.savingEmail.set(true);
    this.accountMessage.set(null);
    this.usersApi.changeEmail({
      email: data.email.trim(),
      current_password: data.current_password
    }).subscribe({
      next: () => {
        this.savingEmail.set(false);
        this.router.navigate(['/login'], { queryParams: { accountUpdated: 'email' } });
      },
      error: () => {
        this.savingEmail.set(false);
        this.accountMessage.set('No se pudo actualizar el correo. Verifica tu contraseña y el correo ingresado.');
      }
    });
  }

  changePassword(): void {
    const data = this.passwordForm();
    if (!data.current_password || data.new_password.length < 10) return;
    this.savingPassword.set(true);
    this.accountMessage.set(null);
    this.usersApi.changePassword(data).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.router.navigate(['/login'], { queryParams: { accountUpdated: 'password' } });
      },
      error: () => {
        this.savingPassword.set(false);
        this.accountMessage.set('No se pudo cambiar la contraseña. Verifica la contraseña actual y los requisitos de la nueva.');
      }
    });
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
}