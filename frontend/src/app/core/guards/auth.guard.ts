import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { roleHomePath } from '../auth/role-home';

export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.initialize();

  return auth.isAuthenticated()
    || router.createUrlTree(['/login'], {
      queryParams: {
        returnUrl: state.url,
      },
    });
};

export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.initialize();

  const user = auth.user();

  return !user
    || router.createUrlTree([
      roleHomePath(user.role)
    ]);
};