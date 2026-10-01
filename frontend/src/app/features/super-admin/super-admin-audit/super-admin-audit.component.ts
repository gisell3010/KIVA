import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuditApiService } from '../../../data-access/api/audit-api.service';
import { AuditLogRead } from '../../../shared/models/domain.models';
import { formatDateTime } from '../../../shared/utils/date.utils';

@Component({
  selector: 'app-super-admin-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="admin-page">
      <div class="page-head">
        <div>
          <h1 class="page-title">
            Registro de Auditoría
          </h1>
          <p class="page-subtitle">
            Acciones registradas por KIVA.
          </p>
        </div>
        <a
          routerLink="/super-admin"
          class="btn btn-outline"
        >
          Volver al panel
        </a>

      </div>


      <div class="card">

        <div class="filters-bar">

          <input
            type="text"
            class="filter-input"
            placeholder="Acción exacta"
            [(ngModel)]="actionFilter"
            (keyup.enter)="applyFilters()"
          />


          <input
            type="text"
            class="filter-input"
            placeholder="Entidad exacta, por ejemplo USER"
            [(ngModel)]="entityFilter"
            (keyup.enter)="applyFilters()"
          />


          <input
            type="number"
            class="filter-input small-input"
            min="1"
            placeholder="ID usuario"
            [(ngModel)]="userIdFilter"
            (keyup.enter)="applyFilters()"
          />


          <button
            type="button"
            class="btn btn-outline"
            (click)="applyFilters()"
          >
            Filtrar
          </button>


          <button
            type="button"
            class="btn btn-ghost"
            (click)="clearFilters()"
          >
            Limpiar
          </button>

        </div>


        @if (loading()) {
          <p>
            Cargando auditoría...
          </p>
        }


        @if (error()) {
          <p class="error-text">
            {{ error() }}
          </p>
        }


        <div class="table-container">

          <table class="admin-table">

            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Entidad</th>
                <th>ID entidad</th>
                <th>Fecha</th>
              </tr>
            </thead>


            <tbody>

              @for (
                entry of entries();
                track entry.id
              ) {

                <tr>

                  <td>
                    {{ entry.id }}
                  </td>

                  <td>
                    {{
                      entry.user_id
                      ?? 'Sistema'
                    }}
                  </td>

                  <td>
                    {{ entry.action }}
                  </td>

                  <td>
                    {{
                      entry.entity
                      ?? '—'
                    }}
                  </td>

                  <td>
                    {{
                      entry.entity_id
                      ?? '—'
                    }}
                  </td>

                  <td>
                    {{
                      formatDateTime(
                        entry.created_at
                      )
                    }}
                  </td>

                </tr>
              }

            </tbody>

          </table>

        </div>


        @if (
          !loading()
          && entries().length === 0
        ) {

          <div class="empty-state">
            <p>
              No se encontraron registros de auditoría.
            </p>
          </div>

        }


        <div class="pagination">

          <span>
            Mostrando
            {{ entries().length }}
            de
            {{ totalEntries() }}
            registros
          </span>


          <div class="pagination-controls">

            <button
              type="button"
              class="btn btn-outline btn-sm"
              [disabled]="
                currentPage() <= 1
                || loading()
              "
              (click)="prevPage()"
            >
              Anterior
            </button>


            <span>
              Página
              {{ currentPage() }}
              de
              {{ totalPages() }}
            </span>


            <button
              type="button"
              class="btn btn-outline btn-sm"
              [disabled]="
                currentPage()
                  >= totalPages()
                || loading()
              "
              (click)="nextPage()"
            >
              Siguiente
            </button>

          </div>

        </div>

      </div>

    </div>
  `,

  styles: [`
    .admin-page {
      max-width: 1200px;
    }

    .filters-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 16px;
    }

    .filter-input {
      flex: 1;
      min-width: 190px;
    }

    .small-input {
      max-width: 150px;
    }

    .table-container {
      overflow-x: auto;
    }

    .admin-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }

    .admin-table th,
    .admin-table td {
      padding: 12px 10px;
      text-align: left;
      border-bottom:
        1px solid var(--border-soft);
    }

    .pagination {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-top: 16px;
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .error-text {
      color: var(--accent-red);
    }
  `],
})
export class SuperAdminAuditComponent
  implements OnInit
{
  private readonly auditApi =
    inject(AuditApiService);


  readonly entries =
    signal<AuditLogRead[]>([]);

  readonly totalEntries =
    signal(0);

  readonly currentPage =
    signal(1);

  readonly loading =
    signal(false);

  readonly error =
    signal<string | null>(null);

  readonly pageSize = 10;


  actionFilter = '';

  entityFilter = '';

  userIdFilter:
    number | null = null;


  readonly totalPages =
    computed(() =>
      Math.max(
        1,
        Math.ceil(
          this.totalEntries()
          / this.pageSize
        ),
      ),
    );


  readonly formatDateTime =
    formatDateTime;


  ngOnInit(): void {
    this.loadAudit();
  }


  loadAudit(): void {
    this.loading.set(true);
    this.error.set(null);

    this.auditApi
      .list({
        page: this.currentPage(),
        page_size: this.pageSize,

        action:
          this.actionFilter.trim()
          || undefined,

        entity:
          this.entityFilter.trim()
          || undefined,

        user_id:
          this.userIdFilter
          && this.userIdFilter > 0
            ? this.userIdFilter
            : undefined,
      })
      .subscribe({

        next: page => {
          this.entries.set(
            page.items,
          );

          this.totalEntries.set(
            page.total,
          );

          this.loading.set(false);
        },

        error: () => {
          this.error.set(
            'No se pudo cargar el registro de auditoría.',
          );

          this.loading.set(false);
        },

      });
  }


  applyFilters(): void {
    this.currentPage.set(1);
    this.loadAudit();
  }


  clearFilters(): void {
    this.actionFilter = '';
    this.entityFilter = '';
    this.userIdFilter = null;

    this.currentPage.set(1);

    this.loadAudit();
  }


  prevPage(): void {
    if (
      this.currentPage() <= 1
    ) {
      return;
    }

    this.currentPage.update(
      page => page - 1,
    );

    this.loadAudit();
  }


  nextPage(): void {
    if (
      this.currentPage()
      >= this.totalPages()
    ) {
      return;
    }

    this.currentPage.update(
      page => page + 1,
    );

    this.loadAudit();
  }
}