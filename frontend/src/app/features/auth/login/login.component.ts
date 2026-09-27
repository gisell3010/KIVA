import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthUser } from '../../../shared/models/domain.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  rememberMe = false;
  error = signal<string | null>(null);
  loading = signal(false);
  showDemoSelector = false;

  demoUsers = this.authService.getAvailableDemoUsers();

  async onSubmit(): Promise<void> {
    this.error.set(null);
    this.loading.set(true);

    try {
      await this.authService.login(this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      this.loading.set(false);
    }
  }

  loginAsDemo(user: AuthUser): void {
    this.authService.setDemoUser(user.id);
    this.router.navigate(['/dashboard']);
  }

  toggleDemoSelector(): void {
    this.showDemoSelector = !this.showDemoSelector;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  roleBadgeClass(role: string): string {
    switch (role) {
      case 'SUPER_ADMIN': return 'badge-purple';
      case 'ADMIN': return 'badge-purple';
      case 'SUPPORT': return 'badge-green';
      case 'USER': return 'badge-blue';
      default: return 'badge-gray';
    }
  }

  roleLabel(role: string): string {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Administrador';
      case 'ADMIN': return 'Administrador';
      case 'SUPPORT': return 'Soporte';
      case 'USER': return 'Usuario';
      default: return 'Usuario';
    }
  }
}