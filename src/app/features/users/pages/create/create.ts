import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsersService } from '../../services/user';
import { NotifyService } from '../../../../core/services/notify';

@Component({
  selector: 'app-create',
  imports: [CommonModule, FormsModule],
  templateUrl: './create.html',
  styleUrl: './create.scss',
})
export class UsersCreatePage {
  private service = inject(UsersService);
  private notify = inject(NotifyService);
  private router = inject(Router);

  form: any = {
    name: '',
    email: '',
    password: '',
    role_id: ''
  };

  save() {
    this.service.createUser(this.form).subscribe({
      next: () => {
        this.notify.success('User created');
        this.router.navigate(['/admin/users']);
      },
      error: () => this.notify.error('Create failed')
    });
  }

  cancel() {
    this.router.navigate(['/admin/users']);
  }
}
