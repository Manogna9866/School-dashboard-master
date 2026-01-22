import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';
import { HeaderComponent } from '../../shared/components/header/header';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb';


@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    HeaderComponent
],
  templateUrl: './admin.html',
  styleUrl: './admin.scss'
})
export class AdminLayout {
 sidebarCollapsed = false;

toggleSidebar() {
  this.sidebarCollapsed = !this.sidebarCollapsed;
  console.log('Sidebar:', this.sidebarCollapsed); // DEBUG
}
}
