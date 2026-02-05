import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-attendence',
  imports: [ReactiveFormsModule,CommonModule,FormsModule],
  templateUrl: './attendence.html',
  styleUrl: './attendence.scss',
})
export class Attendence {
 attendance: any[] = [];
  filteredAttendance: any[] = [];
  paginatedAttendance: any[] = [];

  pages: number[] = [];
  currentPage = 1;
  pageSize = 5;

  searchText = '';
  showModal = false;
  editId: string | null = null;
  loading = false;

  attendanceForm!: FormGroup;

  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  // ✅ NOW ngOnInit WILL RUN
  ngOnInit(): void {
    this.attendanceForm = this.fb.group({
      school_id: ['1', Validators.required],
      branch_id: ['1', Validators.required],
      class_id: ['1', Validators.required],
      date: ['', Validators.required],
      student_id: ['', Validators.required],
      faculty_id: [''],
      status: ['Present', Validators.required],          // ✅ REQUIRED
      remarks: [''],
      percentage_report: ['0.00', Validators.required], // ✅ REQUIRED
    });

    this.loadAttendance();
  }

  /* ================= LOAD ================= */
  loadAttendance() {
    this.loading = true;

    this.service.getattendences().subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.attendance = Array.isArray(res.data?.data)
            ? res.data.data
            : [];

          this.applyFilter();
        } else {
          this.notify.error('Failed to load attendance');
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

    this.filteredAttendance = this.attendance.filter(a =>
      a.student_id?.toString().includes(text) ||
      (a.status || '').toLowerCase().includes(text) ||
      (a.remarks || '').toLowerCase().includes(text)
    );

    this.currentPage = 1;
    this.updatePagination();
  }

  /* ================= PAGINATION ================= */
  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedAttendance = this.filteredAttendance.slice(start, end);

    const totalPages = Math.ceil(this.filteredAttendance.length / this.pageSize);
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
    this.attendanceForm.reset({
      school_id: '1',
      branch_id: '1',
      class_id: '1',
      status: 'Present',
      percentage_report: '0.00'
    });
    this.showModal = true;
  }

  openEdit(att: any) {
    this.editId = att.id;
    this.attendanceForm.patchValue(att);
    this.showModal = true;
  }

  /* ================= SAVE ================= */
  save() {
    if (this.attendanceForm.invalid) {
      this.notify.error('All required fields must be filled');
      return;
    }

    const payload = this.attendanceForm.value;
    this.loading = true;

    const request$ = this.editId
      ? this.service.updateattendence(this.editId, payload)
      : this.service.createattendence(payload);

    request$.subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.notify.success(
            this.editId ? 'Attendance updated' : 'Attendance created'
          );
          this.showModal = false;
          this.searchText = '';
          this.loadAttendance();
        } else {
          this.notify.error('Operation failed');
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
    if (!confirm('Delete this attendance record?')) return;

    this.loading = true;
    this.service.deleteattendence(id).subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.notify.success('Attendance deleted');
          this.loadAttendance();
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
}
