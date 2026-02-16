import { inject, Injectable } from '@angular/core';
import { ApiService } from '../services/api';

@Injectable({
  providedIn: 'root',
})
export class Exam {
    private api = inject(ApiService);

   
}
