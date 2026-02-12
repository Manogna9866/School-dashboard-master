import { Component, inject } from '@angular/core';
import { ApiService } from '../../core/services/api';
import { Classes } from "./classes/classes";
import { Roles } from "./roles/roles";
import { School } from "./school/school";
import { Branches } from "./branches/branches";
import { Faculty } from "./faculty/faculty";
import { Timetable } from "./timetable/timetable";
import { Students } from "./students/students";
import { Attendence } from "./attendence/attendence";
import { Examscrores } from "./examscrores/examscrores";
import { ProgressCards } from "./progress-cards/progress-cards";
import { AssignmentsHomeworks } from "./assignments-homeworks/assignments-homeworks";
import { Notifications } from "./notifications/notifications";
import { Culturalactivities } from "./culturalactivities/culturalactivities";
import { FeeManagement } from "./fee-management/fee-management";
import { Librarymanagement } from "./librarymanagement/librarymanagement";
import { HostelRooms } from "./hostel-rooms/hostel-rooms";
import { TransportManagement } from "./transport-management/transport-management";
import { Medicalrecords } from "./medicalrecords/medicalrecords";
import { LibraryBookIssue } from "./library-book-issue/library-book-issue";
import { HostelAllocation } from "./hostel-allocation/hostel-allocation";


@Component({
  selector: 'app-dashboard',
  imports: [Culturalactivities, FeeManagement, Librarymanagement, HostelRooms, TransportManagement, Medicalrecords, LibraryBookIssue, HostelAllocation],
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
