import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/services/api';

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private api: ApiService) {}

  // ✅ LIST USERS
  getUsers(search: string = '') {
    return this.api.get(`users?search=${search}`);
  }

  // ✅ GET SINGLE USER
  getUser(id: number) {
    return this.api.get(`users/${id}`);
  }

  // ✅ CREATE
  createUser(payload: any) {
    return this.api.post('users', payload);
  }

  // ✅ UPDATE
  updateUser(id: number, payload: any) {
    return this.api.put(`users/${id}`, payload);
  }

  // ✅ DELETE
  deleteUser(id: number) {
    return this.api.delete(`users/${id}`);
  }
}
