import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ModuleService {
  private _modules = signal<any[]>([]);
  modules = this._modules.asReadonly();

  constructor(private http: HttpClient) {}

  load() {
    return this.http
      .get<any>(`${environment.apiUrl}/modules`)
      .subscribe(res => {
        this._modules.set(res.data?.data || []);
      });
  }
}
