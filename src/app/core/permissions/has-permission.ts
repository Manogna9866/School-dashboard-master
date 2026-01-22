import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  inject,
  effect
} from '@angular/core';
import { PermissionService } from './permission';

@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private permissionService = inject(PermissionService);

  private permission?: string;
  private hasView = false;

  @Input()
  set hasPermission(value: string) {
    this.permission = value;
    this.updateView();
  }

  constructor() {
    effect(() => {
      this.updateView();
    });
  }

  private updateView() {
    if (!this.permission) {
      this.viewContainer.clear();
      this.hasView = false;
      return;
    }

    const [module, action] = this.permission.split(':');

    const allowed = this.permissionService.can(
      module,
      action as any
    );

    if (allowed && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!allowed && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
