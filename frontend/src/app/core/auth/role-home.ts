import { GlobalRole } from '../../shared/models/domain.models';

export function roleHomePath(role: GlobalRole): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/super-admin';

    case 'ADMIN':
      return '/admin';

    case 'SUPPORT':
      return '/soporte';

    case 'USER':
    default:
      return '/dashboard';
  }
}