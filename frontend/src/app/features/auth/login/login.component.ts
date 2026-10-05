import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiError } from '../../../core/http/error.interceptor';
import { roleHomePath } from '../../../core/auth/role-home';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';

  readonly error = signal<string | null>(null);
  readonly loading = signal(false);
  readonly showPassword = signal(false);

  async onSubmit(): Promise<void> {
    this.error.set(null);
    this.loading.set(true);

    try {
      const user = await this.authService.login(
        this.email.trim(),
        this.password
      );

      await this.router.navigate([
        roleHomePath(user.role)
      ]);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        this.error.set(err.message);
      } else {
        this.error.set(
          err instanceof Error
            ? err.message
            : 'Error al iniciar sesión'
        );
      }
    } finally {
      this.loading.set(false);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(value => !value);
  }
}
