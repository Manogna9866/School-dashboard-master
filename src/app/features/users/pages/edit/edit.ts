import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService } from '../../services/user';
import { NotifyService } from '../../../../core/services/notify';

@Component({
  selector: 'app-edit',
  imports: [CommonModule, FormsModule],
  templateUrl: './edit.html',
  styleUrl: './edit.scss',
})
export class UsersEditPage implements OnInit {
  private service = inject(UsersService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notify = inject(NotifyService);

  form: any;
  id!: number;

  ngOnInit() {
  const id = this.route.snapshot.paramMap.get('id');

  if (!id) {
    this.notify.error('Invalid user');
    this.router.navigate(['/admin/users']);
    return;
  }

  this.id = Number(id);

  this.service.getUser(this.id).subscribe({
    next: (res: any) => {
      this.form = res.data;
    },
    error: () => {
      this.notify.error('Failed to load user');
      this.router.navigate(['/admin/users']);
    }
  });
}


  update() {
    this.service.updateUser(this.id, this.form).subscribe({
      next: () => {
        this.notify.success('User updated');
        this.router.navigate(['/admin/users']);
      },
      error: () => this.notify.error('Update failed')
    });
  }

  cancel() {
    this.router.navigate(['/admin/users']);
  }
}
