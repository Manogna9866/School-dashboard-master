import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(url: string) {
    return this.http.get<T>(`${this.baseUrl}/${url}`);
  }

  post<T>(url: string, body: any) {
    console.log('POST URL:', `${this.baseUrl}/${url}`);
    return this.http.post<T>(`${this.baseUrl}/${url}`, body);
  }

  put<T>(url: string, body: any) {
    return this.http.put<T>(`${this.baseUrl}/${url}`, body);
  }

  delete<T>(url: string) {
    return this.http.delete<T>(`${this.baseUrl}/${url}`);
  }
}
