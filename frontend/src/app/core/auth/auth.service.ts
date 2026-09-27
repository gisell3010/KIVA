import { Injectable, signal, computed, effect } from '@angular/core';
import { AuthUser, AuthState, GlobalRole, UUID, GLOBAL_ROLE_LABELS } from '../../shared/models/domain.models';

const MOCK_USERS: AuthUser[] = [
  {
    id: '1' as UUID,
    email: 'superadmin@kiva.app',
    firstName: 'Super',
    lastName: 'Admin',
    displayName: 'Super Admin',
    avatarColor: '#7c3aed',
    initials: 'SA',
    role: 'SUPER_ADMIN',
    bio: 'Super administrador de la plataforma KIVA',
  },
  {
    id: '2' as UUID,
    email: 'admin@kiva.app',
    firstName: 'Admin',
    lastName: 'User',
    displayName: 'Admin User',
    avatarColor: '#a855f7',
    initials: 'AU',
    role: 'ADMIN',
    bio: 'Administrador de la plataforma KIVA',
  },
  {
    id: '3' as UUID,
    email: 'soporte@kiva.app',
    firstName: 'Soporte',
    lastName: 'KIVA',
    displayName: 'Soporte KIVA',
    avatarColor: '#22c55e',
    initials: 'SK',
    role: 'SUPPORT',
    bio: 'Equipo de soporte al usuario',
  },
  {
    id: '4' as UUID,
    email: 'camila@kiva.app',
    firstName: 'Camila',
    lastName: 'Rojas',
    displayName: 'Camila Rojas',
    avatarColor: '#3b82f6',
    initials: 'CR',
    role: 'USER',
    bio: 'Amante de los viajes y la aventura',
  },
  {
    id: '5' as UUID,
    email: 'julian@kiva.app',
    firstName: 'Julián',
    lastName: 'Pérez',
    displayName: 'Julián Pérez',
    avatarColor: '#22c55e',
    initials: 'JP',
    role: 'USER',
    bio: 'Fotógrafo de viajes',
  },
  {
    id: '6' as UUID,
    email: 'valentina@kiva.app',
    firstName: 'Valentina',
    lastName: 'Gómez',
    displayName: 'Valentina Gómez',
    avatarColor: '#a855f7',
    initials: 'VG',
    role: 'USER',
    bio: 'Exploradora de destinos ocultos',
  },
  {
    id: '7' as UUID,
    email: 'andres@kiva.app',
    firstName: 'Andrés',
    lastName: 'Torres',
    displayName: 'Andrés Torres',
    avatarColor: '#f97316',
    initials: 'AT',
    role: 'USER',
    bio: 'Mochoilero por el mundo',
  },
];

const DEMO_USER_ID = '5';

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
  readonly currentUserId = computed(() => this._state().user?.id ?? null);

  readonly isSuperAdmin = computed(() => this._state().user?.role === 'SUPER_ADMIN');
  readonly isAdmin = computed(() => this._state().user?.role === 'ADMIN' || this._state().user?.role === 'SUPER_ADMIN');
  readonly isSupport = computed(() => this._state().user?.role === 'SUPPORT' || this.isAdmin());
  readonly isUser = computed(() => this._state().user?.role === 'USER');

  readonly canAccessAdminPanel = computed(() => this.isAdmin());
  readonly canSupport = computed(() => this.isSupport());

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

  getRoleLabel(role: GlobalRole): string {
    return GLOBAL_ROLE_LABELS[role] || role;
  }

  getRoleColor(role: GlobalRole): string {
    const colors: Record<GlobalRole, string> = {
      SUPER_ADMIN: '#7c3aed',
      ADMIN: '#a855f7',
      SUPPORT: '#22c55e',
      USER: '#64748b',
    };
    return colors[role] || '#64748b';
  }
}