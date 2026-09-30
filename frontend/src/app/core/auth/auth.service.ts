import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, AuthSessionRead, RegisterRequest, UserRead } from '../../shared/models/domain.models';
import { ApiError } from '../http/error.interceptor';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly currentUser = signal<UserRead | null>(null);

  private token: string | null = null;
  private generation = 0;
  private initialization?: Promise<void>;
  private refreshing?: Promise<string>;

  private readonly channel =
    typeof BroadcastChannel === 'undefined'
      ? null
      : new BroadcastChannel('kiva-session');

  readonly user = this.currentUser.asReadonly();

  readonly isLoading = signal(true);
  readonly sessionError = signal<string | null>(null);

  readonly isAuthenticated = computed(
    () => this.user() !== null
  );

  readonly currentUserId = computed(
    () => this.user()?.id ?? null
  );

  readonly isSuperAdmin = computed(
    () => this.user()?.role === 'SUPER_ADMIN'
  );

  readonly isAdmin = computed(
    () =>
      this.isSuperAdmin() ||
      this.user()?.role === 'ADMIN'
  );

  readonly isSupport = computed(
    () =>
      this.isAdmin() ||
      this.user()?.role === 'SUPPORT'
  );

  constructor() {
    if (this.channel) {
      this.channel.onmessage = () => {
        this.clearSession(false);
      };
    }

    inject(DestroyRef).onDestroy(() => {
      this.channel?.close();
    });
  }

  get accessToken(): string | null {
    return this.token;
  }

  get sessionVersion(): number {
    return this.generation;
  }

  initialize(): Promise<void> {
    return this.initialization ??= this.refreshAccessToken()
      .then(() => undefined)
      .catch((error: unknown) => {
        if (
          !(
            error instanceof ApiError &&
            error.status === 401
          )
        ) {
          this.sessionError.set(
            error instanceof Error
              ? error.message
              : 'No se pudo comprobar la sesión.'
          );
        }
      })
      .finally(() => {
        this.isLoading.set(false);
      });
  }

  login(
    email: string,
    password: string
  ): Promise<UserRead> {
    return this.authenticate(
      'login',
      {
        email,
        password
      }
    );
  }

  register(
    data: RegisterRequest
  ): Promise<UserRead> {
    return this.authenticate(
      'register',
      data
    );
  }

  refreshAccessToken(): Promise<string> {
    if (this.refreshing) {
      return this.refreshing;
    }

    const version = this.generation;
    const previousUserId = this.currentUserId();

    const operation = this.locked(
      async () => {
        if (version !== this.generation) {
          throw new ApiError(
            'La sesión cambió.',
            401,
            'SESSION_CHANGED'
          );
        }

        const response = await this.authRequest(
          'refresh',
          {}
        );

        if (
          version !== this.generation ||
          (
            previousUserId !== null &&
            response.user.id !== previousUserId
          )
        ) {
          throw new ApiError(
            'La sesión cambió.',
            401,
            'SESSION_CHANGED'
          );
        }

        this.accept(response);

        return response.access_token;
      }
    ).catch((error: unknown) => {
      if (
        version === this.generation &&
        error instanceof ApiError &&
        [401, 403].includes(error.status)
      ) {
        this.clearSession();
      }

      throw error;
    });

    this.refreshing = operation;

    void operation
      .finally(() => {
        if (this.refreshing === operation) {
          this.refreshing = undefined;
        }
      })
      .catch(() => undefined);

    return operation;
  }

  async logout(): Promise<void> {
    await this.locked(() =>
      firstValueFrom(
        this.http
          .post<void>(
            `${environment.apiUrl}/auth/logout`,
            {}
          )
          .pipe(timeout(15000))
      )
    );

    this.clearSession();
  }

  async logoutAll(): Promise<void> {
    await firstValueFrom(
      this.http.post<void>(
        `${environment.apiUrl}/auth/logout-all`,
        {}
      )
    );

    this.clearSession();
  }

  listSessions() {
    return this.http.get<AuthSessionRead[]>(
      `${environment.apiUrl}/auth/sessions`
    );
  }

  async revokeSession(id: number): Promise<void> {
    let currentId: number | null = null;

    try {
      const payload =
        this.token?.split('.')[1];

      if (payload) {
        const normalized = payload
          .replace(/-/g, '+')
          .replace(/_/g, '/');

        const padded = normalized.padEnd(
          Math.ceil(normalized.length / 4) * 4,
          '='
        );

        const decoded = atob(padded);
        const parsed = JSON.parse(decoded);

        currentId = Number(parsed.sid);
      }
    } catch {
      currentId = null;
    }

    await firstValueFrom(
      this.http.delete<void>(
        `${environment.apiUrl}/auth/sessions/${id}`
      )
    );

    if (id === currentId) {
      this.clearSession();
    }
  }

  updateUser(user: UserRead): void {
    if (
      this.currentUserId() === user.id
    ) {
      this.currentUser.set(user);
    }
  }

  clearSession(
    broadcast = true
  ): void {
    const hadUser =
      this.isAuthenticated();

    ++this.generation;

    this.token = null;
    this.currentUser.set(null);

    if (broadcast) {
      this.channel?.postMessage(
        'changed'
      );
    }

    if (hadUser) {
      void this.router.navigate([
        '/login'
      ]);
    }
  }

  private locked<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    if (!navigator.locks) {
      return Promise.reject(
        new Error(
          'Abre KIVA en localhost o HTTPS con un navegador actualizado.'
        )
      );
    }

    return navigator.locks.request(
      'kiva-auth-cookie',
      operation
    );
  }

  private authRequest(
    path: string,
    body: unknown
  ): Promise<AuthResponse> {
    return firstValueFrom(
      this.http
        .post<AuthResponse>(
          `${environment.apiUrl}/auth/${path}`,
          body
        )
        .pipe(timeout(15000))
    );
  }

  private accept(
    response: AuthResponse
  ): void {
    this.token =
      response.access_token;

    this.currentUser.set(
      response.user
    );

    this.sessionError.set(null);
  }

  private async authenticate(
    path: 'login' | 'register',
    body: unknown
  ): Promise<UserRead> {
    this.isLoading.set(true);

    const version =
      ++this.generation;

    try {
      return await this.locked(
        async () => {
          if (
            version !==
            this.generation
          ) {
            throw new Error(
              'La sesión cambió.'
            );
          }

          const response =
            await this.authRequest(
              path,
              body
            );

          if (
            version !==
            this.generation
          ) {
            throw new Error(
              'La sesión cambió.'
            );
          }

          this.accept(response);

          this.channel?.postMessage(
            'changed'
          );

          return response.user;
        }
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}