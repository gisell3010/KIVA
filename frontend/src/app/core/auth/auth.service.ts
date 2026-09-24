import { Injectable, signal, computed, effect } from '@angular/core';
import { AuthUser, AuthState, UserRole, UUID } from '../../shared/models/domain.models';

const MOCK_USERS: AuthUser[] = [
  {
    id: '1' as UUID,
    email: 'admin@kiva.app',
    firstName: 'Admin',
    lastName: 'User',
    displayName: 'Admin User',
    avatarColor: '#a855f7',
    initials: 'AU',
    role: 'ADMIN',
  },
  {
    id: '2' as UUID,
    email: 'camila@kiva.app',
    firstName: 'Camila',
    lastName: 'Rojas',
    displayName: 'Camila Rojas',
    avatarColor: '#3b82f6',
    initials: 'CR',
    role: 'USER',
  },
  {
    id: '3' as UUID,
    email: 'julian@kiva.app',
    firstName: 'Julián',
    lastName: 'Pérez',
    displayName: 'Julián Pérez',
    avatarColor: '#22c55e',
    initials: 'JP',
    role: 'USER',
  },
];

const DEMO_USER_ID = '2';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _state = signal<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  readonly state = this._state.asReadonly();
  readonly user = computed(() => this._state().user);
  readonly isAuthenticated = computed(() => this._state().isAuthenticated);
  readonly isLoading = computed(() => this._state().isLoading);
  readonly isAdmin = computed(() => this._state().user?.role === 'ADMIN');
  readonly currentUserId = computed(() => this._state().user?.id ?? null);

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    setTimeout(() => {
      const user = MOCK_USERS.find(u => u.id === DEMO_USER_ID);
      if (user) {
        this._state.set({ user, isAuthenticated: true, isLoading: false });
      } else {
        this._state.set({ user: null, isAuthenticated: false, isLoading: false });
      }
    }, 100);
  }

  login(email: string, password: string): Promise<AuthUser> {
    return new Promise((resolve, reject) => {
      this._state.update(s => ({ ...s, isLoading: true }));
      setTimeout(() => {
        const user = MOCK_USERS.find(u => u.email === email);
        if (user && password === 'demo123') {
          this._state.set({ user, isAuthenticated: true, isLoading: false });
          resolve(user);
        } else {
          this._state.update(s => ({ ...s, isLoading: false }));
          reject(new Error('Credenciales inválidas'));
        }
      }, 500);
    });
  }

  logout(): void {
    this._state.set({ user: null, isAuthenticated: false, isLoading: false });
  }

  setDemoUser(userId: string): void {
    const user = MOCK_USERS.find(u => u.id === userId);
    if (user) {
      this._state.set({ user, isAuthenticated: true, isLoading: false });
    }
  }

  getAvailableDemoUsers(): AuthUser[] {
    return MOCK_USERS;
  }
}