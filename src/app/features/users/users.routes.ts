import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/auth/permission-guard';

export const usersRoutes: Routes = [
  {
    path: '',
    title: 'Users',
    data: {
      breadcrumb: 'Users',
      module: 'users',
      action: 'index'
    },
    canActivate: [permissionGuard],
    loadComponent: () =>
      import('./pages/list/list').then(m => m.UsersListPage)
  }
];
