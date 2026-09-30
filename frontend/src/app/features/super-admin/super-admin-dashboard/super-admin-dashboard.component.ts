import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminApiService } from '../../../data-access/api/admin-api.service';
import { AdminDashboardRead, GlobalRole } from '../../../shared/models/domain.models';

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="admin-page">
      <div class="page-head">
        <div>
          <h1 class="page-title">
            Super Administración
          </h1>
          <p class="page-subtitle">
            Resumen global de la plataforma KIVA.
          </p>
        </div>
        <a
          routerLink="/dashboard"
          class="btn btn-outline"
        >
          Espacio de usuario
        </a>

      </div>


      @if (loading()) {

        <div class="card state-card">
          Cargando métricas...
        </div>

      } @else if (error()) {

        <div class="card state-card error-text">

          <span>
            {{ error() }}
          </span>

          <button
            type="button"
            class="btn btn-outline"
            (click)="loadDashboard()"
          >
            Reintentar
          </button>

        </div>

      } @else if (dashboard()) {

        <div class="grid grid-cols-4 kpi-row">

          <div class="card kpi">
            <div>
              <div class="kpi-value">
                {{ dashboard()!.users_count }}
              </div>

              <div class="kpi-label">
                Usuarios
              </div>
            </div>
          </div>


          <div class="card kpi">
            <div>
              <div class="kpi-value">
                {{ dashboard()!.groups_count }}
              </div>

              <div class="kpi-label">
                Grupos
              </div>
            </div>
          </div>


          <div class="card kpi">
            <div>
              <div class="kpi-value">
                {{ dashboard()!.trips_count }}
              </div>

              <div class="kpi-label">
                Viajes
              </div>
            </div>
          </div>


          <div class="card kpi">
            <div>
              <div class="kpi-value">
                {{ staffCount() }}
              </div>

              <div class="kpi-label">
                Staff
              </div>
            </div>
          </div>

        </div>


        <div class="grid grid-cols-2">

          <div class="card">

            <div class="card-header">
              <h3>
                Distribución de roles
              </h3>
            </div>


            <div class="role-bars">

              @for (
                row of roleDistribution();
                track row.role
              ) {

                <div class="role-bar-row">

                  <span class="role-bar-label">
                    {{ row.label }}
                  </span>

                  <div class="role-bar-track">
                    <div
                      class="role-bar-fill"
                      [style.width.%]="row.percent"
                      [style.background]="row.color"
                    ></div>
                  </div>

                  <span class="role-bar-count">
                    {{ row.count }}
                  </span>

                </div>

              }

            </div>

          </div>


          <div class="card">

            <div class="card-header">
              <h3>
                Accesos rápidos
              </h3>
            </div>


            <div class="quick-links">

              <a
                routerLink="/super-admin/configuracion"
                class="quick-link"
              >
                Configuración del sistema
              </a>


              <a
                routerLink="/super-admin/auditoria"
                class="quick-link"
              >
                Registro de auditoría
              </a>


              <a
                routerLink="/super-admin/salud"
                class="quick-link"
              >
                Salud del sistema
              </a>


              <a
                routerLink="/admin"
                class="quick-link"
              >
                Panel de administración
              </a>

            </div>

          </div>

        </div>

      }

    </div>
  `,

  styles: [`
    .admin-page {
      max-width: 1200px;
    }

    .kpi-row {
      margin-bottom: 22px;
    }

    .kpi {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .kpi-value {
      font-size: 1.3rem;
      font-weight: 700;
    }

    .kpi-label {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .role-bars,
    .quick-links {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .role-bar-row {
      display: grid;
      grid-template-columns:
        140px 1fr 40px;
      align-items: center;
      gap: 12px;
    }

    .role-bar-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .role-bar-track {
      height: 10px;
      background: var(--bg-panel-2);
      border-radius: 999px;
      overflow: hidden;
    }

    .role-bar-fill {
      height: 100%;
      border-radius: 999px;
    }

    .role-bar-count {
      font-weight: 700;
      text-align: right;
    }

    .quick-link {
      padding: 14px 16px;
      background: var(--bg-panel-2);
      border:
        1px solid var(--border-soft);
      border-radius: 10px;
      color: var(--text-primary);
    }

    .state-card {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
    }

    .error-text {
      color: var(--accent-red);
    }
  `],
})
export class SuperAdminDashboardComponent
  implements OnInit
{
  private readonly adminApi =
    inject(AdminApiService);


  readonly dashboard =
    signal<AdminDashboardRead | null>(
      null,
    );

  readonly loading =
    signal(true);

  readonly error =
    signal<string | null>(null);


  readonly staffCount =
    computed(() => {
      const byRole =
        this.dashboard()
          ?.users_by_role;

      return (
        (byRole?.SUPER_ADMIN ?? 0)
        + (byRole?.ADMIN ?? 0)
        + (byRole?.SUPPORT ?? 0)
      );
    });


  readonly roleDistribution =
    computed(() => {
      const data =
        this.dashboard();

      const total =
        data?.users_count ?? 0;

      const byRole =
        data?.users_by_role;

      const definitions: Array<{
        role: GlobalRole;
        label: string;
        color: string;
      }> = [
        {
          role: 'SUPER_ADMIN',
          label: 'Super Admin',
          color: '#7c3aed',
        },
        {
          role: 'ADMIN',
          label: 'Administrador',
          color: '#a855f7',
        },
        {
          role: 'SUPPORT',
          label: 'Soporte',
          color: '#22c55e',
        },
        {
          role: 'USER',
          label: 'Usuario',
          color: '#3b82f6',
        },
      ];


      return definitions.map(
        item => {
          const count =
            byRole?.[
              item.role
            ] ?? 0;

          return {
            ...item,

            count,

            percent:
              total > 0
                ? Math.round(
                    (count / total)
                    * 100,
                  )
                : 0,
          };
        },
      );
    });


  ngOnInit(): void {
    this.loadDashboard();
  }


  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    this.adminApi
      .superAdminDashboard()
      .subscribe({

        next: data => {
          this.dashboard.set(
            data,
          );

          this.loading.set(false);
        },

        error: () => {
          this.dashboard.set(
            null,
          );

          this.error.set(
            'No se pudo cargar el panel de superadministración.',
          );

          this.loading.set(false);
        },

      });
  }
}