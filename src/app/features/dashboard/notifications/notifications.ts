import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-notifications',
  imports: [ReactiveFormsModule,FormsModule,CommonModule],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss',
})
export class Notifications {
  notifications: any[] = [];
  filteredNotifications: any[] = [];
  paginatedNotifications: any[] = [];

  pages: number[] = [];
  currentPage = 1;
  pageSize = 5;

  searchText = '';
  showModal = false;
  editId: string | null = null;
  loading = false;

  notificationForm!: FormGroup;

  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  ngOnInit() {
    this.notificationForm = this.fb.group({

      

      school_id: ['', Validators.required],
      branch_id: ['', Validators.required],
      class_id: [''],

      title: ['', Validators.required],
      message: ['', Validators.required],

      date_time: ['', Validators.required],

      recipient_type: ['', Validators.required],
      type: ['', Validators.required],

      status: ['', Validators.required],
      last_accessed_by: ['', Validators.required],

     
    });

    this.loadNotifications();
  }

  /* ================= LOAD ================= */
  loadNotifications() {
    this.loading = true;

    this.service.getnotifications().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notifications = Array.isArray(res.data)
            ? res.data
            : res.data?.data || [];

          this.applyFilter();
        } else {
          this.notify.error('Failed to load notifications');
        }
        this.loading = false;
      },
      error: () => {
        this.notify.error('Server error');
        this.loading = false;
      }
    });
  }

  /* ================= SEARCH ================= */
  applyFilter() {
    const text = this.searchText.toLowerCase();

    this.filteredNotifications = this.notifications.filter(n =>
      (n.title || '').toLowerCase().includes(text) ||
      (n.message || '').toLowerCase().includes(text) ||
      (n.type || '').toLowerCase().includes(text)
    );

    this.currentPage = 1;
    this.updatePagination();
  }

  /* ================= PAGINATION ================= */
  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedNotifications = this.filteredNotifications.slice(start, end);

    const totalPages = Math.ceil(this.filteredNotifications.length / this.pageSize);
    this.pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  changePage(page: number) {
    if (page < 1 || page > this.pages.length) return;
    this.currentPage = page;
    this.updatePagination();
  }

  /* ================= MODAL ================= */
  openAdd() {
    this.editId = null;
    this.notificationForm.reset();
    this.showModal = true;
  }

  openEdit(notification: any) {
    this.editId = notification.id;

    this.notificationForm.patchValue({
      ...notification,
      date_time: this.formatDateForInput(notification.date_time),
      created_at: this.formatDateForInput(notification.created_at),
      updated_at: this.formatDateForInput(notification.updated_at),
      deleted_at: this.formatDateForInput(notification.deleted_at)
    });

    this.showModal = true;
  }

  /* ================= SAVE ================= */
  save() {
    if (this.notificationForm.invalid) {
      this.notificationForm.markAllAsTouched();
      this.notify.error('All fields are required');
      return;
    }

    this.loading = true;

    const raw = this.notificationForm.getRawValue();

    const payload = {
      ...raw,
      date_time: this.formatDateForApi(raw.date_time),
      created_at: this.formatDateForApi(raw.created_at),
      updated_at: this.formatDateForApi(raw.updated_at),
      deleted_at: raw.deleted_at
        ? this.formatDateForApi(raw.deleted_at)
        : null
    };

    const request$ = this.editId
      ? this.service.updatenotification(this.editId, payload)
      : this.service.createnotification(payload);

    request$.subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success(this.editId ? 'Notification updated' : 'Notification created');
          this.showModal = false;
          this.searchText = '';
          this.loadNotifications();
        } else {
          this.notify.error(res.message || 'Operation failed');
        }
        this.loading = false;
      },
      error: () => {
        this.notify.error('Server error');
        this.loading = false;
      }
    });
  }

  /* ================= DELETE ================= */
  delete(id: string) {
    if (!confirm('Delete this notification?')) return;

    this.loading = true;
    this.service.deletenotification(id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success('Notification deleted');
          this.loadNotifications();
        } else {
          this.notify.error('Delete failed');
        }
        this.loading = false;
      },
      error: () => {
        this.notify.error('Server error');
        this.loading = false;
      }
    });
  }

  /* ================= DATE HELPERS ================= */
  private formatDateForInput(date: string): string {
    if (!date) return '';
    return date.replace(' ', 'T').substring(0, 16);
  }

  private formatDateForApi(date: string): string {
    return date.replace('T', ' ') + ':00';
  }

}
