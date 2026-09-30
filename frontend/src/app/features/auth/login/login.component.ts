import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiError } from '../../../core/http/error.interceptor';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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

  async onSubmit(): Promise<void> {
    this.error.set(null);
    this.loading.set(true);

    try {
      await this.authService.login(this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (err) {
      if (err instanceof ApiError) {
        this.error.set(err.message);
      } else {
        this.error.set(err instanceof Error ? err.message : 'Error al iniciar sesión');
      }
    } finally {
      this.loading.set(false);
    }
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}