import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { GruposComponent } from './pages/grupos/grupos.component';
import { ParticipantesComponent } from './pages/participantes/participantes.component';
import { DestinosComponent } from './pages/destinos/destinos.component';
import { ItinerarioComponent } from './pages/itinerario/itinerario.component';
import { GastosComponent } from './pages/gastos/gastos.component';
import { VotacionesComponent } from './pages/votaciones/votaciones.component';
import { ReservasComponent } from './pages/reservas/reservas.component';
import { CalendarioComponent } from './pages/calendario/calendario.component';
import { SettingsComponent } from './features/settings/settings.component';
import { ProfileComponent } from './features/profile/profile.component';
import { AdminDashboardComponent } from './features/admin/admin-dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './features/admin/admin-users/admin-users.component';
import { AdminOverviewComponent } from './features/admin/admin-overview/admin-overview.component';
import { NotificationsPageComponent } from './features/notifications/notifications-page/notifications-page.component';
import {
  authGuard,
  guestGuard
} from './core/guards/auth.guard';
import {
  adminGuard,
  superAdminGuard,
  supportGuard
} from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component')
        .then(m => m.HomeComponent),
    pathMatch: 'full'
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component')
        .then(m => m.LoginComponent),
    canActivate: [guestGuard]
  },

  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component')
        .then(m => m.RegisterComponent),
    canActivate: [guestGuard]
  },

  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },

  {
    path: 'grupos',
    component: GruposComponent,
    canActivate: [authGuard]
  },

  {
    path: 'viajes',
    loadComponent: () =>
      import('./features/trips/trips.component')
        .then(m => m.TripsComponent),
    canActivate: [authGuard]
  },

  {
    path: 'viajes/nuevo',
    loadComponent: () =>
      import('./features/trips/trip-create/trip-create.component')
        .then(m => m.TripCreateComponent),
    canActivate: [authGuard]
  },

  {
    path: 'participantes',
    component: ParticipantesComponent,
    canActivate: [authGuard]
  },

  {
    path: 'destinos',
    component: DestinosComponent,
    canActivate: [authGuard]
  },

  {
    path: 'itinerario',
    component: ItinerarioComponent,
    canActivate: [authGuard]
  },

  {
    path: 'gastos',
    component: GastosComponent,
    canActivate: [authGuard]
  },

  {
    path: 'votaciones',
    component: VotacionesComponent,
    canActivate: [authGuard]
  },

  {
    path: 'reservas',
    component: ReservasComponent,
    canActivate: [authGuard]
  },

  {
    path: 'calendario',
    component: CalendarioComponent,
    canActivate: [authGuard]
  },

  {
    path: 'notificaciones',
    component: NotificationsPageComponent,
    canActivate: [authGuard]
  },

  {
    path: 'configuracion',
    component: SettingsComponent,
    canActivate: [authGuard]
  },

  {
    path: 'perfil',
    component: ProfileComponent,
    canActivate: [authGuard]
  },

  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [
      authGuard,
      adminGuard
    ]
  },

  {
    path: 'admin/usuarios',
    component: AdminUsersComponent,
    canActivate: [
      authGuard,
      adminGuard
    ]
  },

  {
    path: 'admin/vision-general',
    component: AdminOverviewComponent,
    canActivate: [
      authGuard,
      adminGuard
    ]
  },

  {
    path: 'admin/grupos',
    loadComponent: () =>
      import('./features/admin/admin-groups/admin-groups.component')
        .then(m => m.AdminGroupsComponent),
    canActivate: [
      authGuard,
      adminGuard
    ]
  },

  {
    path: 'admin/viajes',
    loadComponent: () =>
      import('./features/admin/admin-trips/admin-trips.component')
        .then(m => m.AdminTripsComponent),
    canActivate: [
      authGuard,
      adminGuard
    ]
  },

  {
    path: 'soporte',
    loadComponent: () =>
      import('./features/support/support-dashboard/support-dashboard.component')
        .then(m => m.SupportDashboardComponent),
    canActivate: [
      authGuard,
      supportGuard
    ]
  },

  { path: 'soporte/diagnostico', loadComponent: () => import('./features/support/support-diagnostic/support-diagnostic.component').then(m => m.SupportDiagnosticComponent), canActivate: [authGuard, supportGuard] },

  {
    path: 'soporte/usuarios',
    loadComponent: () =>
      import('./features/support/support-users/support-users.component')
        .then(m => m.SupportUsersComponent),
    canActivate: [
      authGuard,
      supportGuard
    ]
  },

  {
    path: 'super-admin',
    loadComponent: () =>
      import('./features/super-admin/super-admin-dashboard/super-admin-dashboard.component')
        .then(m => m.SuperAdminDashboardComponent),
    canActivate: [
      authGuard,
      superAdminGuard
    ]
  },

  {
    path: 'super-admin/configuracion',
    loadComponent: () =>
      import('./features/super-admin/super-admin-config/super-admin-config.component')
        .then(m => m.SuperAdminConfigComponent),
    canActivate: [
      authGuard,
      superAdminGuard
    ]
  },

  {
    path: 'super-admin/auditoria',
    loadComponent: () =>
      import('./features/super-admin/super-admin-audit/super-admin-audit.component')
        .then(m => m.SuperAdminAuditComponent),
    canActivate: [
      authGuard,
      superAdminGuard
    ]
  },

  {
    path: 'super-admin/salud',
    loadComponent: () =>
      import('./features/super-admin/super-admin-health/super-admin-health.component')
        .then(m => m.SuperAdminHealthComponent),
    canActivate: [
      authGuard,
      superAdminGuard
    ]
  },

  {
    path: '**',
    redirectTo: ''
  }
];