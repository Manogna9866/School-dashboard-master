import { Component, inject } from '@angular/core';
import { ApiService } from '../../core/services/api';
import { Classes } from "./classes/classes";
import { Roles } from "./roles/roles";
import { School } from "./school/school";


@Component({
  selector: 'app-dashboard',
  imports: [Roles, School],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardPage {
  private api = inject(ApiService);

  testApi() {
    this.api.get('test').subscribe({
      next: res => console.log(res),
      error: err => console.error(err)
    });
  }
}
