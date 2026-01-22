import { Component, inject } from '@angular/core';
import { ApiService } from '../../core/services/api';


@Component({
  selector: 'app-dashboard',
  imports: [],
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
