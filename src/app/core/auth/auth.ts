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
