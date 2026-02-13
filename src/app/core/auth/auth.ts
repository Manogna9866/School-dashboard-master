import { Injectable, inject, PLATFORM_ID, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ApiService } from '../services/api';
import { ModuleService } from '../modules/module';

export type UserRole = 'superadmin' | 'admin' | 'subadmin' | 'villager';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  private api = inject(ApiService);

  private _accessToken = signal<string | null>(null);
  private _refreshToken = signal<string | null>(null);
  private _user = signal<any | null>(null);
  private _permissions = signal<any[]>([]);

  readonly isLoggedIn = computed(() => !!this._accessToken());
  readonly user = computed(() => this._user());
  readonly role = computed<UserRole | null>(() => this._user()?.role_name ?? null);
  readonly permissions = computed(() => this._permissions());

  constructor(private moduleService: ModuleService) {
    if (isPlatformBrowser(this.platformId)) {
      const access = localStorage.getItem('access_token');
      const refresh = localStorage.getItem('refresh_token');
      const user = localStorage.getItem('user');
      const permissions = localStorage.getItem('permissions');

      if (access) this._accessToken.set(access);
      if (refresh) this._refreshToken.set(refresh);
      if (user) this._user.set(JSON.parse(user));
      if (permissions) this._permissions.set(JSON.parse(permissions));
    }
  }

  init() {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    const permissions = localStorage.getItem('permissions');

    if (token && user && permissions) {
      this._user.set(JSON.parse(user));
      this._permissions.set(JSON.parse(permissions));
    }
  }


  // 🔐 LOGIN API
  login(payload: { email: string; password: string }) {
    console.log('API URL:', this.api);
    return this.api.post<any>('users/login', payload);
  }
  //roles//
  createRole(payload: { role_name: string; description: string }) {
    return this.api.post<any>('roles', payload);
  }
  updateRole(id: string, payload: { role_name: string; description: string }) {
    return this.api.put<any>(`roles/${id}`, payload);
  }
  deleteRole(id: string) {
    return this.api.delete<any>(`roles/${id}`);
  }
  getRoles() {
    return this.api.get<any>('roles');
  }
  //schools//
  getSchools() {
    return this.api.get<any>('schools');
  }

  // CREATE a school
  createSchool(payload: any) {
    console.log('API URL:', this.api);
    return this.api.post<any>('schools', payload);
  }

  // UPDATE a school
  updateSchool(id: string, payload: any) {
    console.log('API URL:', this.api);
    return this.api.put<any>(`schools/${id}`, payload);
  }

  // DELETE a school
  deleteSchool(id: string) {
    console.log('API URL:', this.api);
    return this.api.delete<any>(`schools/${id}`);
  }
  getClasses() {
    console.log('API URL:', this.api);
    return this.api.get<any>('classes');
  }

  // CREATE class
  createClass(payload: any) {
    console.log('API URL:', this.api);
    return this.api.post<any>('classes', payload);
  }

  // UPDATE class
  updateClass(id: string, payload: any) {
    console.log('API URL:', this.api);
    return this.api.put<any>(`classes/${id}`, payload);
  }

  // DELETE class
  deleteClass(id: string) {
    console.log('API URL:', this.api);
    return this.api.delete<any>(`classes/${id}`);
  }

  //braches//
  getBranches() {
    return this.api.get<any>('branches');
  }

  // CREATE a branch
  createBranch(payload: any) {
    return this.api.post<any>('branches', payload);
  }

  // UPDATE a branch
  updateBranch(id: string, payload: any) {
    return this.api.put<any>(`branches/${id}`, payload);
  }

  // DELETE a branch
  deleteBranch(id: string) {
    return this.api.delete<any>(`branches/${id}`);
  }
  //faculty//
  getfaculties() {
    return this.api.get<any>('faculty');
  }
  createfaculty(payload: any) {
    return this.api.post<any>('faculty', payload);
  }
  updatefaculty(id: string, payload: any) {
    return this.api.put<any>(`faculty/${id}`, payload);
  }
  deletefaculty(id: string) {
    return this.api.delete<any>(`faculty/${id}`);
  }
  //timetable//
  getTimetables() {
    return this.api.get<any>('timetable');
  }
  createTimetable(payload: any) {
    return this.api.post<any>('timetable', payload);
  }
  updateTimetable(id: string, payload: any) {
    return this.api.put<any>(`timetable/${id}`, payload);
  }
  deleteTimetable(id: string) {
    return this.api.delete<any>(`timetable/${id}`);
  }
  //
  getstudents() {
    return this.api.get<any>('students');
  }
  createstudent(payload: any) {
    return this.api.post<any>('students', payload);
  }
  updatestudent(id: string, payload: any) {
    return this.api.put<any>(`students/${id}`, payload);
  }
  deletestudent(id: string) {
    return this.api.delete<any>(`students/${id}`);
  }
  //attetendence//
  getattendences() {
    return this.api.get<any>('attendance');
  }
  createattendence(payload: any) {
    return this.api.post<any>('attendance', payload);
  }
  updateattendence(id: string, payload: any) {
    return this.api.put<any>(`attendance/${id}`, payload);
  }
  deleteattendence(id: string) {
    return this.api.delete<any>(`attendance/${id}`);
  }
  //examcrores//
  getexamscrores() {
    return this.api.get<any>('exam_scores');
  }
  createexamscrore(payload: any) {
    return this.api.post<any>('exam_scores', payload);
  }
  updateexamscrore(id: string, payload: any) {
    return this.api.put<any>(`exam_scores/${id}`, payload);
  }
  deleteexamscrore(id: string) {
    return this.api.delete<any>(`exam_scores/${id}`);
  }
  //progess-cards//
  getprogresscards() {
    return this.api.get<any>('progress_cards');
  }
  createprogresscard(payload: any) {
    return this.api.post<any>('progress_cards', payload);
  }
  updateprogresscard(id: string, payload: any) {
    return this.api.put<any>(`progress_cards/${id}`, payload);
  }
  deleteprogresscard(id: string) {
    return this.api.delete<any>(`progress_cards/${id}`);
  }
  //assignment-homeworks//
  getassignmentshomeworks() {
    return this.api.get<any>('assignments_homework');
  }
  createassignmentshomework(payload: any) {
    return this.api.post<any>('assignments_homework', payload);
  }
  updateassignmentshomework(id: string, payload: any) {
    return this.api.put<any>(`assignments_homework/${id}`, payload);
  }
  deleteassignmentshomework(id: string) {
    return this.api.delete<any>(`assignments_homework/${id}`);
  }
  //notifications//
  getnotifications() {
    return this.api.get<any>('notifications');
  }
  createnotification(payload: any) {
    return this.api.post<any>('notifications', payload);
  }
  updatenotification(id: string, payload: any) {
    return this.api.put<any>(`notifications/${id}`, payload);
  }
  deletenotification(id: string) {
    return this.api.delete<any>(`notifications/${id}`);
  }
  //culuturalactivties//
  getculturalactivities() {
    return this.api.get<any>('cultural_activities');
  }

  createculturalactivity(payload: any) {
    return this.api.post<any>('cultural_activities', payload);
  }


  updateculturalactivity(id: string, payload: any) {
    return this.api.put<any>(`cultural_activities/${id}`, payload);
  }
  deleteculturalactivity(id: string) {
    return this.api.delete<any>(`cultural_activities/${id}`);
  }
  //fee-management//
  getfees() {
    return this.api.get<any>('fee_management');
  }
  createfee(payload: any) {
    return this.api.post<any>('fee_management', payload);
  }
  updatefee(id: string, payload: any) {
    return this.api.put<any>(`fee_management/${id}`, payload);
  }
  deletefee(id: string) {
    return this.api.delete<any>(`fee_management/${id}`);    }
    //librarybooks//
  getBooks() {
    return this.api.get<any>('library_books');
  }
  createBook(payload: any) {
    return this.api.post<any>('library_books', payload);
  }  
  updateBook(id: string, payload: any) {
    return this.api.put<any>(`library_books/${id}`, payload);
  }
  deleteBook(id: string) {
    return this.api.delete<any>(`library_books/${id}`);
  } 
  //hostelrooms//
  getHostelRooms() {
    return this.api.get<any>('hostel_rooms');
  }
  createHostelRoom(payload: any) {
    return this.api.post<any>('hostel_rooms', payload);
  }
  updateHostelRoom(id: string, payload: any) {
    return this.api.put<any>(`hostel_rooms/${id}`, payload);
  }
  deleteHostelRoom(id: string) {
    return this.api.delete<any>(`hostel_rooms/${id}`);
  }  
  //transportmanagement//
  getTransports() {
    return this.api.get<any>('transport');
  }
  createTransport(payload: any) {
    return this.api.post<any>('transport', payload);
  }
  updateTransport(id: string, payload: any) {
    return this.api.put<any>(`transport/${id}`, payload);
  }
  deleteTransport(id: string) {
    return this.api.delete<any>(`transport/${id}`);
  }
  //medicalrecords//
  getMedicalRecords() {
    return this.api.get<any>('medical_records');
  }
  createMedicalRecord(payload: any) {
    return this.api.post<any>('medical_records', payload);
  }
  updateMedicalRecord(id: string, payload: any) {
    return this.api.put<any>(`medical_records/${id}`, payload);
  }
  deleteMedicalRecord(id: string) {
    return this.api.delete<any>(`medical_records/${id}`);
  } 
  //librarybooks//  
  getLibraryBookIssues() {
    return this.api.get<any>('library_book_issue');
  }
  createLibraryBookIssue(payload: any) {
    return this.api.post<any>('library_book_issue', payload);
  }  
  updateLibraryBookIssue(id: string, payload: any) {
    return this.api.put<any>(`library_book_issue/${id}`, payload);
  }
  deleteLibraryBookIssue(id: string) {
    return this.api.delete<any>(`library_book_issue/${id}`);
  } 
  //hostelallocation//
  getHostelAllocations() {
    return this.api.get<any>('hostel_allocations');
  }
  createHostelAllocation(payload: any) {
    return this.api.post<any>('hostel_allocations', payload);
  }
  updateHostelAllocation(id: string, payload: any) {
    return this.api.put<any>(`hostel_allocations/${id}`, payload);
  }
  deleteHostelAllocation(id: string) {
    return this.api.delete<any>(`hostel_allocations/${id}`);
  } 
  //facultyleave//
  getFacultyLeaves() {
    return this.api.get<any>('faculty_leave_management');
  }
  createFacultyLeave(payload: any) {
    return this.api.post<any>('faculty_leave_management', payload);
  }
  updateFacultyLeave(id: string, payload: any) {
    return this.api.put<any>(`faculty_leave_management/${id}`, payload);
  }
  deleteFacultyLeave(id: string) {
    return this.api.delete<any>(`faculty_leave_management/${id}`);
  } 
  //faculty-salry/
  getFacultySalaries() {
    return this.api.get<any>('faculty_salary');
  }
  createFacultySalary(payload: any) {
    return this.api.post<any>('faculty_salary', payload);
  }
  updateFacultySalary(id: string, payload: any) {
    return this.api.put<any>(`faculty_salary/${id}`, payload);
  }
  deleteFacultySalary(id: string) {
    return this.api.delete<any>(`faculty_salary/${id}`);
  } 
  //subjects//
  getSubjects() {
    return this.api.get<any>('subjects');
  }
  createsubject(payload: any) {
    return this.api.post<any>('subjects', payload);
  }
  updatesubject(id: string, payload: any) {
    return this.api.put<any>(`subjects/${id}`, payload);
  }
  deletesubject(id: string) {
    return this.api.delete<any>(`subjects/${id}`);
  } 
  //gallery//
  getGallery() {  
    return this.api.get<any>('gallery');    
  }
  createGallery(payload: any) {
    return this.api.post<any>('gallery', payload);
  }
  updateGallery(id: string, payload: any) {
    return this.api.post<any>(`gallery/${id}`, payload);
  }     
    
  deleteGallery(id: string) {
    return this.api.delete<any>(`gallery/${id}`);
  }
  //school-calender//
  getSchoolCalenders() {
    return this.api.get<any>('school_calendar');
  }
  createSchoolCalender(payload: any) {
    return this.api.post<any>('school_calendar', payload);
  }
  updateSchoolCalender(id: string, payload: any) {
    return this.api.put<any>(`school_calendar/${id}`, payload);
  }
  deleteSchoolCalender(id: string) {
    return this.api.delete<any>(`school_calendar/${id}`);
  }
  // ✅ SAVE SESSION
  setSession(data: any) {
    // tokens
    localStorage.setItem('access_token', data.access_token);
    this._accessToken.set(data.access_token);

    // user
    localStorage.setItem('user', JSON.stringify(data.user));
    this._user.set(data.user);

    // load modules list
    this.moduleService.load();

    // 🔥 NOW load permissions
    this.loadPermissionsByRole(data.user.role_id);
  }

  loadPermissionsByRole(roleId: number) {
    this.api
      .get<any>(`module-permissions?role_id=${roleId}`)
      .subscribe({
        next: (res) => {
          const permissions = res?.data?.permissions ?? [];

          // persist
          localStorage.setItem('permissions', JSON.stringify(permissions));

          // update signal (THIS FIXES SIDEBAR)
          this._permissions.set(permissions);
        },
        error: () => {
          console.error('Failed to load permissions');
          this._permissions.set([]);
        }
      });
  }



  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.clear();
    }
    this._accessToken.set(null);
    this._refreshToken.set(null);
    this._user.set(null);
    this._permissions.set([]);
  }

  getToken() {
    return this._accessToken();
  }
}
