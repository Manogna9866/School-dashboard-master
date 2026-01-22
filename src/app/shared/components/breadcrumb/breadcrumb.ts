import { Component } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';

@Component({
  selector: 'app-breadcrumb',
  imports: [CommonModule],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.scss',
})
export class BreadcrumbComponent {
  label = '';

  constructor(private router: Router, private route: ActivatedRoute) {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        let current = this.route.firstChild;
        while (current?.firstChild) {
          current = current.firstChild;
        }
        this.label = current?.snapshot.data['breadcrumb'] || '';
      });
  }
}
