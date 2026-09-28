import { Component, effect, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from './core/theme/theme.service';
import { AuthService } from './core/auth/auth.service';
import { NotificationDropdownComponent } from './shared/components/notification-dropdown/notification-dropdown.component';
import { ProfileDropdownComponent } from './shared/components/profile-dropdown/profile-dropdown.component';
import { SearchComponent } from './shared/components/search/search.component';
import { LogoComponent } from './shared/components/logo/logo.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, NotificationDropdownComponent, ProfileDropdownComponent, SearchComponent, LogoComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  protected router = inject(Router);
  protected themeService = inject(ThemeService);
  protected authService = inject(AuthService);

  title = 'KIVA';
  isSidebarCollapsed = false;
  showMobileMenu = false;

  protected currentUser = this.authService.user;

  constructor() {
    effect(() => {
      this.themeService.initialize();
    });
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }

  closeMobileMenu(): void {
    this.showMobileMenu = false;
  }

  navigateAndClose(route: string): void {
    this.router.navigate([route]);
    this.closeMobileMenu();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  protected roleLabel(role?: string): string {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Administrador';
      case 'ADMIN': return 'Administrador';
      case 'SUPPORT': return 'Soporte';
      case 'USER': return 'Usuario';
      default: return 'Usuario';
    }
  }
}