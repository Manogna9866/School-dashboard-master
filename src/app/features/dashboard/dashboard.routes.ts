import { Routes } from '@angular/router';
import { DashboardPage } from './dashboard';
import { Classes } from './classes/classes';
;

export const dashboardRoutes: Routes = [
  {
    path: '',
    component: DashboardPage,
    children: [
      {
        path: 'classes',
        component:Classes,
        title: 'classes'
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'classes'
      }
    ]
  }
];
