import { Routes } from '@angular/router';
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
    path: 'ayuda',
    loadComponent: () =>
      import('./features/auth/help/help.component')
        .then(m => m.HelpComponent),
    canActivate: [guestGuard]
  },

  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },

  {
    path: 'grupos',
    loadComponent: () => import('./pages/grupos/grupos.component').then(m => m.GruposComponent),
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
    loadComponent: () => import('./pages/participantes/participantes.component').then(m => m.ParticipantesComponent),
    canActivate: [authGuard]
  },

  {
    path: 'destinos',
    loadComponent: () => import('./pages/destinos/destinos.component').then(m => m.DestinosComponent),
    canActivate: [authGuard]
  },

  {
    path: 'itinerario',
    loadComponent: () => import('./pages/itinerario/itinerario.component').then(m => m.ItinerarioComponent),
    canActivate: [authGuard]
  },

  {
    path: 'gastos',
    loadComponent: () => import('./pages/gastos/gastos.component').then(m => m.GastosComponent),
    canActivate: [authGuard]
  },

  {
    path: 'votaciones',
    loadComponent: () => import('./pages/votaciones/votaciones.component').then(m => m.VotacionesComponent),
    canActivate: [authGuard]
  },

  {
    path: 'reservas',
    loadComponent: () => import('./pages/reservas/reservas.component').then(m => m.ReservasComponent),
    canActivate: [authGuard]
  },

  {
    path: 'calendario',
    loadComponent: () => import('./pages/calendario/calendario.component').then(m => m.CalendarioComponent),
    canActivate: [authGuard]
  },


  {
    path: 'reportes',
    loadComponent: () =>
      import('./pages/reportes/reportes.component')
        .then(m => m.ReportesComponent),
    canActivate: [authGuard]
  },

  {
    path: 'notificaciones',
    loadComponent: () => import('./features/notifications/notifications-page/notifications-page.component').then(m => m.NotificationsPageComponent),
    canActivate: [authGuard]
  },

  {
    path: 'configuracion',
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [authGuard]
  },

  {
    path: 'perfil',
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },

  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [
      authGuard,
      adminGuard
    ]
  },

  {
    path: 'admin/usuarios',
    loadComponent: () => import('./features/admin/admin-users/admin-users.component').then(m => m.AdminUsersComponent),
    canActivate: [
      authGuard,
      adminGuard
    ]
  },

  {
    path: 'admin/vision-general',
    loadComponent: () => import('./features/admin/admin-overview/admin-overview.component').then(m => m.AdminOverviewComponent),
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
    path: 'soporte/reportes',
    loadComponent: () =>
      import('./features/support/support-reports/support-reports.component')
        .then(m => m.SupportReportsComponent),
    canActivate: [authGuard, supportGuard]
  },

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