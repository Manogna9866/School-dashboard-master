import { Component, inject } from '@angular/core';
import { ApiService } from '../../core/services/api';
import { Classes } from "./classes/classes";
import { Roles } from "./roles/roles";
import { School } from "./school/school";
import { Branches } from "./branches/branches";
import { Faculty } from "./faculty/faculty";
import { Timetable } from "./timetable/timetable";
import { Students } from "./students/students";


@Component({
  selector: 'app-dashboard',
  imports: [Roles, School, Classes, Branches, Faculty, Timetable, Students],
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
