import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginPage {
  email = '';
  password = '';
  loading = false;

  private auth = inject(AuthService);
  private router = inject(Router);
  private notify = inject(NotifyService);

 submit() {
  if (!this.email || !this.password) {
    this.notify.error('Email and password required');
    return;
  }

  this.loading = true;

  this.auth.login({ email: this.email, password: this.password }).subscribe({
    next: (res) => {
      if (res.success) {
        this.auth.setSession(res.data);
        this.notify.success(res.message);
        this.router.navigateByUrl('/admin/dashboard', { replaceUrl: true });
      } else {
        this.notify.error(res.message || 'Login failed');
      }
      this.loading = false;
    },
    error: (err) => {
      this.notify.error(err.error?.message || 'Server error');
      this.loading = false;
    }
  });
}

}
