import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { PermissionService } from '../permissions/permission';

export const permissionGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot
) => {
  const permission = inject(PermissionService);
  const router = inject(Router);

  const moduleKey = route.data['module'] as string;
  const action = (route.data['action'] ?? 'index') as
    | 'create'
    | 'update'
    | 'delete'
    | 'index'
    | 'show';

  if (!moduleKey) {
    console.warn('PermissionGuard: module key missing in route data');
    return router.parseUrl('/admin/dashboard');
  }

  if (permission.can(moduleKey, action)) {
    return true;
  }

  return router.parseUrl('/admin/unauthorized');
};
