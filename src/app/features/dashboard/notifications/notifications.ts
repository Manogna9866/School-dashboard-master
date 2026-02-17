import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-notifications',
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss',
})
export class Notifications {
  notifications: any[] = [];
  filteredNotifications: any[] = [];
  paginatedNotifications: any[] = [];

  schools: any[] = [];
  branches: any[] = [];
  classes: any[] = [];

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
    });


    this.loadSchools();
    this.loadClasses();
    this.loadNotifications();

    // Load branches dynamically when school changes
    this.notificationForm.get('school_id')?.valueChanges.subscribe(schoolId => {
      if (schoolId) {
        this.loadBranchesBySchool(schoolId);
      } else {
        this.branches = [];
        this.notificationForm.patchValue({ branch_id: '' });
      }
    });
  }

  /** ================= LOAD DATA ================= */
  loadNotifications() {
    this.loading = true;
    this.service.getnotifications().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notifications = Array.isArray(res.data?.data) ? res.data.data : [];
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

  loadSchools() { this.service.getSchools().subscribe((res: any) => { this.schools = res.data?.data || []; }); }
  loadBranchesBySchool(schoolId: number) {
    this.service.getBranches().subscribe((res: any) => {
      this.branches = (res.data?.data || []).filter((b: any) => b.school_id == schoolId);
    });
  }
  loadClasses() { this.service.getClasses().subscribe((res: any) => { this.classes = res.data?.data || []; }); }

  /** ================= SEARCH & PAGINATION ================= */
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

  /** ================= MODAL ================= */
  openAdd() {
    this.editId = null;
    this.branches = [];
    this.notificationForm.reset();
    this.showModal = true;
  }

  openEdit(notification: any) {
    this.editId = notification.id;
    this.loadBranchesBySchool(notification.school_id);
    this.notificationForm.patchValue({
      ...notification,
      date_time: this.formatDateForInput(notification.date_time)
    });
    this.showModal = true;
  }

  /** ================= SAVE ================= */
  save() {
  if (this.notificationForm.invalid) {
    this.notificationForm.markAllAsTouched();
    console.log("Form Errors:", this.notificationForm.errors);
    console.log("Form Value:", this.notificationForm.value);
    return;
  }

  const raw = this.notificationForm.value;

  const payload = {
    school_id: +raw.school_id,
    branch_id: +raw.branch_id,
    class_id: raw.class_id ? +raw.class_id : null,
    title: raw.title,
    message: raw.message,
    date_time: raw.date_time
      ? raw.date_time.replace('T', ' ') + ':00'
      : null,
    recipient_type: raw.recipient_type,
    type: raw.type,
    status: raw.status
  };

  console.log("Sending Payload:", payload);

  this.service.createnotification(payload).subscribe({
    next: (res: any) => {
      console.log("API Response:", res);
      this.notify.success("Notification created");
      this.showModal = false;
      this.loadNotifications();
    },
    error: (err) => {
      console.log("API Error:", err);
      console.log("Error Response:", err.error);
      this.notify.error(err.error?.message || "Server Error");
    }
  });
}



  /** ================= DELETE ================= */
  deleteNotification(id: string) {
    if (!confirm('Delete this notification?')) return;
    this.service.deletenotification(id).subscribe((res: any) => {
      if (res.success) this.notify.success('Notification deleted');
      this.loadNotifications();
    });
  }

  /** ================= DATE HELPERS ================= */
  private formatDateForInput(date: string): string {
    if (!date) return '';
    return date.replace(' ', 'T').substring(0, 16);
  }

  private formatDateForApi(date: string): string {
    return date.replace('T', ' ') + ':00';
  }

}
