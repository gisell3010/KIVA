import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { ThemeService } from './core/theme/theme.service';
import { GlobalRole } from './shared/models/domain.models';
import { NotificationDropdownComponent } from './shared/components/notification-dropdown/notification-dropdown.component';
import { ProfileDropdownComponent } from './shared/components/profile-dropdown/profile-dropdown.component';
import { SearchComponent } from './shared/components/search/search.component';
import { LogoComponent } from './shared/components/logo/logo.component';
import { UserAvatarComponent } from './shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NotificationDropdownComponent,
    ProfileDropdownComponent,
    SearchComponent,
    LogoComponent,
    UserAvatarComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly roleLabels:
    Record<GlobalRole, string> = {
      SUPER_ADMIN: 'Super Administrador',
      ADMIN: 'Administrador',
      SUPPORT: 'Soporte',
      USER: 'Usuario'
    };

  protected readonly links = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon:
        'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z'
    },
    {
      path: '/grupos',
      label: 'Grupos',
      icon:
        'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M22 21v-2a4 4 0 0 0-3-4'
    },
    {
      path: '/viajes',
      label: 'Viajes',
      icon:
        'M3 7h18v14H3z M8 7V3h8v4 M8 7v14 M16 7v14'
    },
    {
      path: '/participantes',
      label: 'Participantes',
      icon:
        'M20 21v-2a7 7 0 0 0-14 0v2 M13 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8'
    },
    {
      path: '/destinos',
      label: 'Destinos',
      icon:
        'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0 M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6'
    },
    {
      path: '/itinerario',
      label: 'Itinerario',
      icon:
        'M4 4h16v17H4z M8 8h8 M8 12h8 M8 16h5'
    },
    {
      path: '/gastos',
      label: 'Gastos',
      icon:
        'M12 2v20 M17 5H9a4 4 0 0 0 0 8h6a3 3 0 0 1 0 6H6'
    },
    {
      path: '/votaciones',
      label: 'Votaciones',
      icon:
        'M4 4h16v16H4z M8 11l3 3 6-6'
    },
    {
      path: '/reservas',
      label: 'Reservas',
      icon:
        'M5 3h14v19l-7-4-7 4z'
    },
    {
      path: '/calendario',
      label: 'Calendario',
      icon:
        'M3 5h18v16H3z M3 10h18 M8 2v6 M16 2v6'
    }
  ];

  protected readonly adminLinks = [
    {
      path: '/admin',
      label: 'Administración'
    },
    {
      path: '/admin/usuarios',
      label: 'Usuarios'
    },
    {
      path: '/admin/grupos',
      label: 'Grupos de la plataforma'
    },
    {
      path: '/admin/viajes',
      label: 'Viajes de la plataforma'
    },
    {
      path: '/admin/vision-general',
      label: 'Visión general'
    }
  ];

  protected readonly superLinks = [
    {
      path: '/super-admin',
      label: 'Superadministración'
    },
    {
      path: '/super-admin/configuracion',
      label: 'Configuración del sistema'
    },
    {
      path: '/super-admin/auditoria',
      label: 'Auditoría'
    },
    {
      path: '/super-admin/salud',
      label: 'Estado del sistema'
    }
  ];

  isSidebarCollapsed = false;
  showMobileMenu = false;

  constructor() {
    inject(ThemeService).initialize();
  }

  protected isPublicRoute(): boolean {
    const path =
      this.router.url
        .split('?')[0]
        .split('#')[0];

    return (
      path === '/' ||
      path === '/login' ||
      path === '/register'
    );
  }

  closeMobileMenu(): void {
    this.showMobileMenu = false;
  }
}