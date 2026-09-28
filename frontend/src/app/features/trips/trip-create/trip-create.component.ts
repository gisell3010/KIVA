import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MockDataService } from '../../../data-access/mock/mock-data.service';

@Component({
  selector: 'app-trip-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="create-page">
      <div class="page-head">
        <div>
          <h1 class="page-title">Nuevo viaje</h1>
          <p class="page-subtitle">Crea un viaje para planificar con tu grupo</p>
        </div>
        <a routerLink="/viajes" class="btn btn-outline">
          <svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Volver a viajes
        </a>
      </div>

      <form class="card create-form" (ngSubmit)="onSubmit()" #tripForm="ngForm">
        @if (error()) {
          <div class="error-banner" role="alert">{{ error() }}</div>
        }

        <div class="form-grid">
          <div class="form-group full-width">
            <label for="name">Nombre del viaje</label>
            <input
              id="name"
              name="name"
              type="text"
              class="form-input"
              [(ngModel)]="name"
              required
              minlength="3"
              maxlength="80"
              placeholder="Ej. Patagonia 2026"
            />
          </div>

          <div class="form-group">
            <label for="groupId">Grupo</label>
            <select id="groupId" name="groupId" class="form-select" [(ngModel)]="groupId" required>
              <option value="" disabled>Selecciona un grupo</option>
              @for (group of groups(); track group.id) {
                <option [value]="group.id">{{ group.name }}</option>
              }
            </select>
          </div>

          <div class="form-group">
            <label for="status">Estado inicial</label>
            <select id="status" name="status" class="form-select" [(ngModel)]="status">
              <option value="PLANNING">Planificando</option>
              <option value="CONFIRMED">Confirmado</option>
            </select>
          </div>

          <div class="form-group">
            <label for="startDate">Fecha de inicio</label>
            <input id="startDate" name="startDate" type="date" class="form-input" [(ngModel)]="startDate" required />
          </div>

          <div class="form-group">
            <label for="endDate">Fecha de fin</label>
            <input id="endDate" name="endDate" type="date" class="form-input" [(ngModel)]="endDate" required />
          </div>

          <div class="form-group">
            <label for="totalBudget">Presupuesto total (COP)</label>
            <input
              id="totalBudget"
              name="totalBudget"
              type="number"
              class="form-input"
              [(ngModel)]="totalBudget"
              min="0"
              step="10000"
              required
            />
          </div>

          <div class="form-group full-width">
            <label for="description">Descripción</label>
            <textarea
              id="description"
              name="description"
              class="form-textarea"
              rows="4"
              [(ngModel)]="description"
              maxlength="500"
              placeholder="Describe el objetivo del viaje..."
            ></textarea>
          </div>
        </div>

        <div class="form-actions">
          <a routerLink="/viajes" class="btn btn-ghost">Cancelar</a>
          <button type="submit" class="btn btn-primary" [disabled]="tripForm.invalid || submitting()">
            @if (submitting()) {
              Creando...
            } @else {
              Crear viaje
            }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .create-page { max-width: 720px; }

    .create-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 8px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group.full-width { grid-column: 1 / -1; }

    .form-group label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .form-input,
    .form-select,
    .form-textarea {
      padding: 10px 12px;
      background: var(--bg-input);
      border: 1px solid var(--border-soft);
      border-radius: 10px;
      color: var(--text-primary);
      font-size: 0.9rem;
      font-family: inherit;
      width: 100%;
    }

    .form-select {
      padding-right: 36px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      appearance: none;
    }

    .form-textarea {
      resize: vertical;
      min-height: 100px;
    }

    .form-input:focus,
    .form-select:focus,
    .form-textarea:focus {
      outline: none;
      border-color: var(--accent-blue);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 10px;
      color: #f87171;
      font-size: 0.85rem;
      margin-bottom: 8px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--border-soft);
    }

    @media (max-width: 600px) {
      .form-grid { grid-template-columns: 1fr; }
      .form-actions { flex-direction: column-reverse; }
      .form-actions .btn { width: 100%; justify-content: center; }
    }
  `]
})
export class TripCreateComponent {
  private mockData = inject(MockDataService);
  private router = inject(Router);

  groups = this.mockData.groups;

  name = '';
  groupId = '';
  status: 'PLANNING' | 'CONFIRMED' = 'PLANNING';
  startDate = '';
  endDate = '';
  totalBudget = 0;
  description = '';

  submitting = signal(false);
  error = signal<string | null>(null);

  onSubmit(): void {
    this.error.set(null);

    if (!this.groupId) {
      this.error.set('Selecciona un grupo');
      return;
    }

    if (this.startDate && this.endDate && this.endDate < this.startDate) {
      this.error.set('La fecha de fin debe ser posterior a la de inicio');
      return;
    }

    this.submitting.set(true);

    setTimeout(() => {
      const id = String(this.mockData.trips().length + 1);
      this.mockData.trips.update(list => [
        ...list,
        {
          id,
          groupId: this.groupId,
          name: this.name.trim(),
          description: this.description.trim(),
          startDate: this.startDate,
          endDate: this.endDate,
          status: this.status,
          totalBudget: Number(this.totalBudget) || 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
      this.submitting.set(false);
      this.router.navigate(['/viajes']);
    }, 400);
  }
}
