import { Routes } from '@angular/router';
import { Auth } from './layouts/auth/auth';
import { AdminLayout } from './layouts/admin/admin';
import { authGuard } from './core/auth/auth-guard';

export const routes: Routes = [
  {
    path: 'admin',
    children: [
      // 🔓 PUBLIC LOGIN
      {
        path: 'login',
        component: Auth,
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/auth/login/login')
                .then(m => m.LoginPage)
          }
        ]
      },

      // 🔐 PROTECTED ADMIN AREA
      {
        path: '',
        component: AdminLayout,
        canActivate: [authGuard],
        children: [
          {
            path: 'dashboard',
            title: 'Admin Dashboard',
            loadComponent: () =>
              import('./features/dashboard/dashboard')
                .then(m => m.DashboardPage)
          },

          {
            path: 'users',
            loadChildren: () =>
              import('./features/users/users.routes')
                .then(m => m.usersRoutes)
          },

          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'dashboard'
          }
        ]
      }
    ]
  },

  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'admin/login'
  },

  {
  path: 'unauthorized',
  loadComponent: () =>
    import('./features/errors/unauthorized/unauthorized')
      .then(m => m.Unauthorized)
}
];
