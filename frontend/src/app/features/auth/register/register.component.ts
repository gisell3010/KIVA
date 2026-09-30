import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { RegisterRequest } from '../../../shared/models/domain.models';
import { ApiError } from '../../../core/http/error.interceptor';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  firstName = '';
  secondName = '';
  firstLastName = '';
  secondLastName = '';
  username = '';
  email = '';
  password = '';
  confirmPassword = '';

  readonly error = signal<string | null>(null);
  readonly loading = signal(false);
  readonly fieldErrors = signal<Record<string, string>>({});

  async onSubmit(): Promise<void> {
    this.error.set(null);
    this.fieldErrors.set({});

    const validationErrors = this.validateForm();

    if (Object.keys(validationErrors).length > 0) {
      this.fieldErrors.set(validationErrors);
      return;
    }

    const data: RegisterRequest = {
      first_name: this.firstName.trim(),
      second_name: this.secondName.trim() || null,
      first_last_name: this.firstLastName.trim(),
      second_last_name: this.secondLastName.trim() || null,
      username: this.username.trim().toLowerCase(),
      email: this.email.trim().toLowerCase(),
      password: this.password
    };

    this.loading.set(true);

    try {
      await this.authService.register(data);
      await this.router.navigate(['/dashboard']);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.code === 'USER_ALREADY_EXISTS') {
          this.error.set(
            'El correo electrónico o el nombre de usuario ya está registrado.'
          );
        } else {
          this.error.set(err.message);
        }
      } else {
        this.error.set(
          err instanceof Error
            ? err.message
            : 'No se pudo completar el registro.'
        );
      }
    } finally {
      this.loading.set(false);
    }
  }

  hasError(field: string): boolean {
    return Boolean(this.fieldErrors()[field]);
  }

  getError(field: string): string {
    return this.fieldErrors()[field] ?? '';
  }

  private validateForm(): Record<string, string> {
    const errors: Record<string, string> = {};

    const firstName = this.firstName.trim();
    const secondName = this.secondName.trim();
    const firstLastName = this.firstLastName.trim();
    const secondLastName = this.secondLastName.trim();
    const username = this.username.trim().toLowerCase();
    const email = this.email.trim().toLowerCase();

    if (!firstName) {
      errors['firstName'] = 'El primer nombre es obligatorio.';
    } else if (firstName.length < 2) {
      errors['firstName'] =
        'El primer nombre debe tener al menos 2 caracteres.';
    }

    if (secondName && secondName.length < 2) {
      errors['secondName'] =
        'El segundo nombre debe tener al menos 2 caracteres.';
    }

    if (!firstLastName) {
      errors['firstLastName'] =
        'El primer apellido es obligatorio.';
    } else if (firstLastName.length < 2) {
      errors['firstLastName'] =
        'El primer apellido debe tener al menos 2 caracteres.';
    }

    if (secondLastName && secondLastName.length < 2) {
      errors['secondLastName'] =
        'El segundo apellido debe tener al menos 2 caracteres.';
    }

    if (!username) {
      errors['username'] =
        'El nombre de usuario es obligatorio.';
    } else if (!/^[a-z0-9._]{3,50}$/.test(username)) {
      errors['username'] =
        'Usa entre 3 y 50 caracteres: letras minúsculas, números, punto o guion bajo.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      errors['email'] =
        'El correo electrónico es obligatorio.';
    } else if (!emailRegex.test(email)) {
      errors['email'] =
        'Ingresa un correo electrónico válido.';
    }

    if (!this.password) {
      errors['password'] =
        'La contraseña es obligatoria.';
    } else if (this.password.length < 10) {
      errors['password'] =
        'La contraseña debe tener al menos 10 caracteres.';
    }

    if (!this.confirmPassword) {
      errors['confirmPassword'] =
        'Confirma tu contraseña.';
    } else if (this.password !== this.confirmPassword) {
      errors['confirmPassword'] =
        'Las contraseñas no coinciden.';
    }

    return errors;
  }
}