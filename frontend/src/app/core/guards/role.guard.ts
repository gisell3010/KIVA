import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GlobalRole } from '../../shared/models/domain.models';
import { AuthService } from '../auth/auth.service';

function allowRoles(
  roles: readonly GlobalRole[],
): CanActivateFn {
  return async (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    await auth.initialize();

    const user = auth.user();

    if (!user) {
      return router.createUrlTree(['/login'], {
        queryParams: {
          returnUrl: state.url,
        },
      });
    }

    return roles.includes(user.role)
      || router.createUrlTree(['/dashboard']);
  };
}

export const adminGuard = allowRoles([
  'ADMIN',
  'SUPER_ADMIN',
]);

export const supportGuard = allowRoles([
  'SUPPORT',
  'ADMIN',
  'SUPER_ADMIN',
]);

export const superAdminGuard = allowRoles([
  'SUPER_ADMIN',
]);