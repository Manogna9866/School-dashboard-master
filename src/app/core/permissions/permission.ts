import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from '../auth/auth';

type Action = 'create' | 'update' | 'delete' | 'index' | 'show';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private auth = inject(AuthService);

  // permissions from login / permission API
  private permissions = computed(() => this.auth.permissions() ?? []);

  /**
   * Check permission using module_key + action
   */
  can(moduleKey: string, action: Action): boolean {
    const perm = this.permissions().find(
      p => p.module_key === moduleKey
    );

    return !!perm?.permissions?.[action];
  }

  // Shortcut helpers
  canCreate(moduleKey: string) {
    return this.can(moduleKey, 'create');
  }

  canUpdate(moduleKey: string) {
    return this.can(moduleKey, 'update');
  }

  canDelete(moduleKey: string) {
    return this.can(moduleKey, 'delete');
  }

  canView(moduleKey: string) {
    return this.can(moduleKey, 'index');
  }

  canShow(moduleKey: string) {
    return this.can(moduleKey, 'show');
  }
}
