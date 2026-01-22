import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class AppTitleService {
  constructor(private title: Title) {}

  set(title: string) {
    this.title.setTitle(`${title} | Admin Panel`);
  }
}
