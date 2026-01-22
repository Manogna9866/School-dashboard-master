import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from './auth';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = route.data['roles'] as string[];
  const userRole = auth.role();

  if (userRole && allowedRoles.includes(userRole)) {
    return true;
  }

  return router.parseUrl('/admin/login');
};
