import { Component, inject, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../core/theme/theme.service';
import { AuthService } from '../../core/auth/auth.service';
import { MockDataService } from '../../data-access/mock/mock-data.service';
import { User, UserPreferences, NotificationPreferences, ThemeMode } from '../../shared/models/domain.models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-page">
      <div class="page-head">
        <div>
          <h1 class="page-title">Configuración</h1>
          <p class="page-subtitle">Personaliza tu experiencia en KIVA</p>
        </div>
      </div>

      <div class="settings-grid">
        <section class="card settings-section">
          <h2 class="section-title">Apariencia</h2>
          <p class="section-description">Elige cómo se ve KIVA en tu dispositivo</p>

          <div class="setting-group">
            <label class="setting-label">Tema</label>
            <div class="theme-options" role="radiogroup" aria-label="Seleccionar tema">
              @for (theme of themes(); track theme.value) {
                <label class="theme-option" [class.active]="currentTheme() === theme.value">
                  <input
                    type="radio"
                    name="theme"
                    [value]="theme.value"
                    [checked]="currentTheme() === theme.value"
                    (change)="setTheme(theme.value)"
                  />
                  <div class="theme-option-content">
                    <svg class="theme-icon" [attr.viewBox]="theme.icon.viewBox" aria-hidden="true">
                      <path [attr.d]="theme.icon.path" stroke="currentColor" stroke-width="1.5" fill="none"/>
                    </svg>
                    <div>
                      <div class="theme-name">{{ theme.label }}</div>
                      <div class="theme-desc">{{ theme.description }}</div>
                    </div>
                  </div>
                  <div class="theme-check" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <path d="M20 6 9 17l-5-5"/>
                    </svg>
                  </div>
                </label>
              }
            </div>
          </div>
        </section>

        <section class="card settings-section">
          <h2 class="section-title">Cuenta</h2>
          <p class="section-description">Información básica de tu cuenta</p>

          <div class="setting-group">
            <label class="setting-label">Nombre de usuario</label>
            <div class="account-info">
              <div class="avatar avatar-lg" [style.background]="currentUser()?.avatarColor">
                {{ currentUser()?.initials }}
              </div>
              <div>
                <div class="account-name">{{ currentUser()?.displayName }}</div>
                <div class="account-email">{{ currentUser()?.email }}</div>
                <a routerLink="/perfil" class="link-btn">Editar perfil →</a>
              </div>
            </div>
          </div>

          <div class="setting-group">
            <label class="setting-label">Rol en la plataforma</label>
            <span class="badge" [ngClass]="roleBadgeClass(currentUser()?.role)">
              {{ roleLabel(currentUser()?.role) }}
            </span>
          </div>
        </section>

        <section class="card settings-section">
          <h2 class="section-title">Notificaciones</h2>
          <p class="section-description">Controla qué notificaciones recibes</p>

          <div class="setting-group">
            <div class="notification-toggle">
              <div class="notification-info">
                <div class="notification-name">Notificaciones push</div>
                <div class="notification-desc">Recibir notificaciones en el navegador</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" [checked]="pushEnabled()" (change)="togglePush($event)" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="setting-divider"></div>

          <h3 class="subsection-title">Preferencias por tipo</h3>
          @for (pref of notificationPrefs(); track pref.key) {
            <div class="setting-group notification-pref">
              <div class="notification-info">
                <div class="notification-name">{{ pref.label }}</div>
                <div class="notification-desc">{{ pref.description }}</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" [checked]="pref.enabled()" (change)="toggleNotificationPref(pref.key, $event)" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          }
        </section>

        <section class="card settings-section">
          <h2 class="section-title">Accesibilidad</h2>
          <p class="section-description">Ajustes para mejorar la usabilidad</p>

          <div class="setting-group">
            <div class="notification-toggle">
              <div class="notification-info">
                <div class="notification-name">Reducir animaciones</div>
                <div class="notification-desc">Desactiva transiciones y animaciones en la interfaz</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" [checked]="reduceMotion()" (change)="toggleReduceMotion($event)" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="setting-group">
            <div class="notification-toggle">
              <div class="notification-info">
                <div class="notification-name">Alto contraste</div>
                <div class="notification-desc">Aumenta el contraste de colores para mejor legibilidad</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" [checked]="highContrast()" (change)="toggleHighContrast($event)" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </section>

        <section class="card settings-section">
          <h2 class="section-title">Zona horaria e idioma</h2>
          <p class="section-description">Configuración regional</p>

          <div class="setting-group">
            <label for="timezone" class="setting-label">Zona horaria</label>
            <select id="timezone" [(ngModel)]="timezone" class="select-input">
              @for (tz of timezones; track tz.value) {
                <option [value]="tz.value">{{ tz.label }}</option>
              }
            </select>
          </div>

          <div class="setting-group">
            <label for="locale" class="setting-label">Idioma</label>
            <select id="locale" [(ngModel)]="locale" class="select-input">
              @for (loc of locales; track loc.value) {
                <option [value]="loc.value">{{ loc.label }}</option>
              }
            </select>
          </div>
        </section>

        <section class="card settings-section danger-zone">
          <h2 class="section-title">Zona de peligro</h2>
          <p class="section-description">Acciones irreversibles</p>

          <div class="setting-group">
            <div>
              <div class="notification-name">Cerrar sesión en todos los dispositivos</div>
              <div class="notification-desc">Invalida todas tus sesiones activas</div>
            </div>
            <button class="btn btn-outline btn-danger" type="button">Cerrar todas las sesiones</button>
          </div>

          <div class="setting-divider"></div>

          <div class="setting-group">
            <div>
              <div class="notification-name">Eliminar cuenta</div>
              <div class="notification-desc">Elimina permanentemente tu cuenta y todos tus datos</div>
            </div>
            <button class="btn btn-danger" type="button">Eliminar mi cuenta</button>
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
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
    }

    @media (max-width: 850px) {
      .settings-grid {
        grid-template-columns: 1fr;
      }
    }

    .settings-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .section-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .section-description {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin: 0;
    }

    .subsection-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 8px 0 12px;
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
      background: var(--border-soft);
      margin: 8px 0;
    }

    .account-info {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .account-name {
      font-weight: 600;
      font-size: 0.95rem;
    }

    .account-email {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .link-btn {
      font-size: 0.8rem;
      color: var(--accent-cyan);
      font-weight: 600;
      margin-top: 6px;
      display: inline-block;
    }

    .link-btn:hover {
      text-decoration: underline;
    }

    .theme-options {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    @media (max-width: 500px) {
      .theme-options {
        grid-template-columns: 1fr;
      }
    }

    .theme-option {
      position: relative;
      border: 2px solid var(--border-soft);
      border-radius: 12px;
      padding: 14px;
      cursor: pointer;
      transition: all var(--transition-fast);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 8px;
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
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--bg-panel-2);
      border: 2px solid var(--border-soft);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transform: scale(0.8);
      transition: all var(--transition-fast);
    }

    .theme-option.active .theme-check {
      opacity: 1;
      transform: scale(1);
      background: var(--accent-blue);
      border-color: var(--accent-blue);
      color: white;
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
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .notification-pref {
      flex-direction: row;
      align-items: center;
    }

    .notification-pref .setting-label {
      display: none;
    }

    .toggle-switch {
      position: relative;
      width: 48px;
      height: 28px;
      flex-shrink: 0;
    }

    .toggle-switch input {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-slider {
      position: absolute;
      inset: 0;
      background: var(--border-medium);
      border-radius: 28px;
      transition: background var(--transition-fast);
    }

    .toggle-slider::before {
      content: '';
      position: absolute;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: white;
      top: 3px;
      left: 3px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      transition: transform var(--transition-fast);
    }

    .toggle-switch input:checked + .toggle-slider {
      background: var(--accent-blue);
    }

    .toggle-switch input:checked + .toggle-slider::before {
      transform: translateX(20px);
    }

    .toggle-switch input:focus-visible + .toggle-slider {
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4);
    }

    .select-input {
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      padding-right: 40px;
    }

    .danger-zone {
      border-color: rgba(239, 68, 68, 0.3);
    }

    .danger-zone .section-title {
      color: var(--accent-red);
    }

    .btn-danger {
      background: linear-gradient(135deg, var(--accent-red), #f87171);
      color: white;
    }

    .btn-outline.btn-danger {
      background: transparent;
      border-color: var(--accent-red);
      color: var(--accent-red);
    }

    .btn-outline.btn-danger:hover {
      background: rgba(239, 68, 68, 0.1);
    }
  `]
})
export class SettingsComponent {
  private themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private mockData = inject(MockDataService);

  currentTheme = this.themeService.currentTheme;
  currentUser = this.authService.user;

  themes = signal<{ value: ThemeMode; label: string; description: string; icon: { viewBox: string; path: string } }[]>([
    { value: 'light', label: 'Claro', description: 'Interfaz clara', icon: { viewBox: '0 0 24 24', path: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z' }},
    { value: 'dark', label: 'Oscuro', description: 'Interfaz oscura', icon: { viewBox: '0 0 24 24', path: 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z' }},
    { value: 'system', label: 'Sistema', description: 'Usar preferencia del sistema', icon: { viewBox: '0 0 24 24', path: 'M18 13a6 6 0 01-6 6 6 6 0 01-6-6H2M12 22V12M6 12H4m16 0h-2' }},
  ]);

  pushEnabled = signal(true);
  reduceMotion = signal(false);
  highContrast = signal(false);
  timezone = 'America/Bogota';
  locale = 'es';

  timezones = [
    { value: 'America/Bogota', label: 'Bogotá (UTC-5)' },
    { value: 'America/Mexico_City', label: 'Ciudad de México (UTC-6)' },
    { value: 'America/New_York', label: 'Nueva York (UTC-5/-4)' },
    { value: 'America/Los_Angeles', label: 'Los Ángeles (UTC-8/-7)' },
    { value: 'Europe/Madrid', label: 'Madrid (UTC+1/+2)' },
    { value: 'Europe/Paris', label: 'París (UTC+1/+2)' },
    { value: 'UTC', label: 'UTC' },
  ];

  locales = [
    { value: 'es', label: 'Español' },
    { value: 'en', label: 'English' },
    { value: 'pt', label: 'Português' },
  ];

  notificationPrefs = computed(() => [
    { key: 'groupInvitations', label: 'Invitaciones a grupos', description: 'Cuando te inviten a un grupo', enabled: signal(true) },
    { key: 'tripInvitations', label: 'Invitaciones a viajes', description: 'Cuando te inviten a un viaje', enabled: signal(true) },
    { key: 'tripUpdates', label: 'Actualizaciones de viajes', description: 'Cambios en viajes en los que participas', enabled: signal(true) },
    { key: 'votes', label: 'Votaciones', description: 'Nuevas votaciones y resultados', enabled: signal(true) },
    { key: 'expenses', label: 'Gastos', description: 'Nuevos gastos y liquidaciones', enabled: signal(true) },
    { key: 'reservations', label: 'Reservas', description: 'Confirmaciones y cambios en reservas', enabled: signal(true) },
    { key: 'calendar', label: 'Calendario', description: 'Recordatorios de eventos próximos', enabled: signal(true) },
    { key: 'system', label: 'Sistema', description: 'Actualizaciones y noticias de KIVA', enabled: signal(false) },
  ]);

  constructor() {
    effect(() => {
      const theme = this.currentTheme();
      if (theme === 'light') {
        document.documentElement.classList.remove('reduce-motion');
      }
    });
  }

  setTheme(theme: ThemeMode): void {
    this.themeService.setTheme(theme);
  }

  togglePush(event: Event): void {
    this.pushEnabled.set((event.target as HTMLInputElement).checked);
  }

  toggleNotificationPref(key: string, event: Event): void {
    const pref = this.notificationPrefs().find(p => p.key === key);
    if (pref) {
      pref.enabled.set((event.target as HTMLInputElement).checked);
    }
  }

  toggleReduceMotion(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.reduceMotion.set(checked);
    document.documentElement.classList.toggle('reduce-motion', checked);
  }

  toggleHighContrast(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.highContrast.set(checked);
    document.documentElement.classList.toggle('high-contrast', checked);
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