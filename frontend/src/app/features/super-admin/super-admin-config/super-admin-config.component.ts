import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface SystemConfig {
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailNotifications: boolean;
  maxGroupSize: number;
  sessionTimeoutMinutes: number;
  defaultLocale: string;
  supportEmail: string;
}

@Component({
  selector: 'app-super-admin-config',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="admin-page">
      <div class="page-head">
        <div>
          <h1 class="page-title">Configuración del Sistema</h1>
          <p class="page-subtitle">Ajustes globales de la plataforma KIVA</p>
        </div>
        <a routerLink="/super-admin" class="btn btn-outline">
          <svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Volver al panel
        </a>
      </div>

      <form (ngSubmit)="saveConfig()" class="config-form">
        <div class="card">
          <div class="card-header">
            <h3>General</h3>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label for="supportEmail">Email de soporte</label>
              <input
                id="supportEmail"
                type="email"
                name="supportEmail"
                [(ngModel)]="config().supportEmail"
                (ngModelChange)="updateConfig('supportEmail', $event)"
                class="form-input"
                placeholder="soporte@kiva.app"
              />
            </div>
            <div class="form-group">
              <label for="defaultLocale">Idioma por defecto</label>
              <select
                id="defaultLocale"
                name="defaultLocale"
                [(ngModel)]="config().defaultLocale"
                (ngModelChange)="updateConfig('defaultLocale', $event)"
                class="form-select"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="pt">Português</option>
              </select>
            </div>
            <div class="form-group">
              <label for="maxGroupSize">Tamaño máximo de grupo</label>
              <input
                id="maxGroupSize"
                type="number"
                name="maxGroupSize"
                min="2"
                max="100"
                [(ngModel)]="config().maxGroupSize"
                (ngModelChange)="updateConfig('maxGroupSize', +$event)"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label for="sessionTimeoutMinutes">Timeout de sesión (min)</label>
              <input
                id="sessionTimeoutMinutes"
                type="number"
                name="sessionTimeoutMinutes"
                min="5"
                max="1440"
                [(ngModel)]="config().sessionTimeoutMinutes"
                (ngModelChange)="updateConfig('sessionTimeoutMinutes', +$event)"
                class="form-input"
              />
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Interruptores</h3>
          </div>
          <div class="toggle-list">
            <label class="toggle-row">
              <div class="toggle-info">
                <span class="toggle-title">Modo mantenimiento</span>
                <span class="toggle-desc">Muestra una página de mantenimiento a todos los usuarios no staff</span>
              </div>
              <input
                type="checkbox"
                name="maintenanceMode"
                [ngModel]="config().maintenanceMode"
                (ngModelChange)="updateConfig('maintenanceMode', $event)"
                class="toggle-input"
              />
              <span class="toggle-switch" aria-hidden="true"></span>
            </label>

            <label class="toggle-row">
              <div class="toggle-info">
                <span class="toggle-title">Registro habilitado</span>
                <span class="toggle-desc">Permite que nuevos usuarios se registren</span>
              </div>
              <input
                type="checkbox"
                name="registrationEnabled"
                [ngModel]="config().registrationEnabled"
                (ngModelChange)="updateConfig('registrationEnabled', $event)"
                class="toggle-input"
              />
              <span class="toggle-switch" aria-hidden="true"></span>
            </label>

            <label class="toggle-row">
              <div class="toggle-info">
                <span class="toggle-title">Notificaciones por email</span>
                <span class="toggle-desc">Envía emails transaccionales (invitaciones, votaciones, etc.)</span>
              </div>
              <input
                type="checkbox"
                name="emailNotifications"
                [ngModel]="config().emailNotifications"
                (ngModelChange)="updateConfig('emailNotifications', $event)"
                class="toggle-input"
              />
              <span class="toggle-switch" aria-hidden="true"></span>
            </label>
          </div>
        </div>

        <div class="form-actions">
          @if (saved()) {
            <span class="save-feedback" role="status">Cambios guardados</span>
          }
          <button type="button" class="btn btn-ghost" (click)="resetConfig()">Restablecer</button>
          <button type="submit" class="btn btn-primary">Guardar cambios</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .admin-page { max-width: 900px; }

    .config-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .form-input,
    .form-select {
      padding: 10px 12px;
      background: var(--bg-input);
      border: 1px solid var(--border-soft);
      border-radius: 10px;
      color: var(--text-primary);
      font-size: 0.9rem;
      font-family: inherit;
    }

    .form-select {
      padding-right: 36px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      appearance: none;
    }

    .form-input:focus,
    .form-select:focus {
      outline: none;
      border-color: var(--accent-blue);
    }

    .toggle-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 14px 0;
      border-bottom: 1px solid var(--border-soft);
      cursor: pointer;
      position: relative;
    }

    .toggle-row:last-child { border-bottom: none; }

    .toggle-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .toggle-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .toggle-desc {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .toggle-input {
      position: absolute;
      opacity: 0;
      width: 1px;
      height: 1px;
      pointer-events: none;
    }

    .toggle-switch {
      width: 44px;
      height: 24px;
      background: var(--bg-panel-2);
      border: 1px solid var(--border-soft);
      border-radius: 999px;
      position: relative;
      flex-shrink: 0;
      transition: background var(--transition-fast), border-color var(--transition-fast);
    }

    .toggle-switch::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      width: 18px;
      height: 18px;
      background: var(--text-muted);
      border-radius: 50%;
      transition: transform var(--transition-fast), background var(--transition-fast);
    }

    .toggle-input:checked + .toggle-switch {
      background: rgba(59,130,246,0.25);
      border-color: var(--accent-blue);
    }

    .toggle-input:checked + .toggle-switch::after {
      transform: translateX(20px);
      background: var(--accent-blue);
    }

    .toggle-input:focus-visible + .toggle-switch {
      box-shadow: 0 0 0 3px rgba(59,130,246,0.4);
    }

    .form-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
    }

    .save-feedback {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--accent-green);
      margin-right: auto;
    }

    @media (max-width: 700px) {
      .form-grid { grid-template-columns: 1fr; }
      .form-actions { flex-wrap: wrap; }
    }
  `]
})
export class SuperAdminConfigComponent {
  private readonly defaults: SystemConfig = {
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    maxGroupSize: 50,
    sessionTimeoutMinutes: 60,
    defaultLocale: 'es',
    supportEmail: 'soporte@kiva.app',
  };

  config = signal<SystemConfig>({ ...this.defaults });
  saved = signal(false);

  updateConfig<K extends keyof SystemConfig>(key: K, value: SystemConfig[K]): void {
    this.config.update(c => ({ ...c, [key]: value }));
    this.saved.set(false);
  }

  saveConfig(): void {
    this.saved.set(true);
  }

  resetConfig(): void {
    this.config.set({ ...this.defaults });
    this.saved.set(false);
  }
}
