import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PermissionService } from '../../../core/permissions/permission';
import { ModuleService } from '../../../core/modules/module';

@Component({
  standalone: true,
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html'
})
export class SidebarComponent {
  permission = inject(PermissionService);
  moduleService = inject(ModuleService);

  // Sort: system modules first, then others
  modules = computed(() =>
    this.moduleService.modules()?.slice().sort((a, b) => {
      return Number(b.is_system) - Number(a.is_system);
    })
  );
 
}
