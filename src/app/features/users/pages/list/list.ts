import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UsersService } from '../../services/user';
import { NotifyService } from '../../../../core/services/notify';
import { PermissionService } from '../../../../core/permissions/permission';


@Component({
  selector: 'app-list',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './list.html',
  styleUrl: './list.scss',
})
export class UsersListPage implements OnInit {
  private service = inject(UsersService);
  private notify = inject(NotifyService);
  private permission = inject(PermissionService);

  users: any[] = [];
  search = '';

  // Permission flags (clean & readable)
  get canCreate() {
  return this.permission.can('users', 'create');
}

get canUpdate() {
  return this.permission.can('users', 'update');
}

get canDelete() {
  return this.permission.can('users', 'delete');
}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.service.getUsers(this.search).subscribe({
      next: (res: any) => {
        this.users = res.data ?? [];
      },
      error: () => {
        this.notify.error('Failed to load users');
      }
    });
  }

  remove(id: number) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    this.service.deleteUser(id).subscribe({
      next: () => {
        this.notify.success('User deleted');
        this.loadUsers();
      },
      error: () => {
        this.notify.error('Delete failed');
      }
    });
  }

}
