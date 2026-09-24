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
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // Public routes
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent), canActivate: [guestGuard] },

  // Protected user workspace routes
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'grupos', component: GruposComponent, canActivate: [authGuard] },
  { path: 'viajes', loadComponent: () => import('./features/trips/trips.component').then(m => m.TripsComponent), canActivate: [authGuard] },
  { path: 'participantes', component: ParticipantesComponent, canActivate: [authGuard] },
  { path: 'destinos', component: DestinosComponent, canActivate: [authGuard] },
  { path: 'itinerario', component: ItinerarioComponent, canActivate: [authGuard] },
  { path: 'gastos', component: GastosComponent, canActivate: [authGuard] },
  { path: 'votaciones', component: VotacionesComponent, canActivate: [authGuard] },
  { path: 'reservas', component: ReservasComponent, canActivate: [authGuard] },
  { path: 'calendario', component: CalendarioComponent, canActivate: [authGuard] },
  { path: 'notificaciones', component: NotificationsPageComponent, canActivate: [authGuard] },
  { path: 'configuracion', component: SettingsComponent, canActivate: [authGuard] },
  { path: 'perfil', component: ProfileComponent, canActivate: [authGuard] },

  // Admin routes
  { path: 'admin', component: AdminDashboardComponent, canActivate: [authGuard, adminGuard] },
  { path: 'admin/usuarios', component: AdminUsersComponent, canActivate: [authGuard, adminGuard] },
  { path: 'admin/vision-general', component: AdminOverviewComponent, canActivate: [authGuard, adminGuard] },

  { path: '**', redirectTo: 'dashboard' },
];