import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-faculty-leave',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './faculty-leave.html',
  styleUrl: './faculty-leave.scss',
})
export class FacultyLeave {
  leaves: any[] = [];
  filteredLeaves: any[] = [];
  paginatedLeaves: any[] = [];

  pages: number[] = [];
  currentPage = 1;
  pageSize = 5;

  searchText = '';
  showModal = false;
  editId: string | null = null;
  loading = false;

  leaveForm!: FormGroup;

  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  ngOnInit() {

    this.leaveForm = this.fb.group({
      school_id: ['', Validators.required],
      branch_id: ['', Validators.required],
      faculty_id: ['', Validators.required],
      leave_type: ['', Validators.required],
      from_date: ['', Validators.required],
      to_date: ['', Validators.required],
      reason: ['', Validators.required],
      approval_status: ['Pending'],
      approved_by: [''],
      status: ['active'],
      last_accessed_by: ['1']
    });

    this.loadLeaves();
  }

  /* ================= LOAD ================= */
  loadLeaves() {
    this.loading = true;

    this.service.getFacultyLeaves().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.leaves = Array.isArray(res.data?.data)
            ? res.data.data
            : [];

          this.applyFilter();
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

    this.filteredLeaves = this.leaves.filter(l =>
      l.leave_type?.toLowerCase().includes(text) ||
      l.reason?.toLowerCase().includes(text) ||
      l.faculty_id?.toString().includes(text) ||
      l.approval_status?.toLowerCase().includes(text)
    );

    this.currentPage = 1;
    this.updatePagination();
  }

  /* ================= PAGINATION ================= */
  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedLeaves = this.filteredLeaves.slice(start, end);

    const totalPages = Math.ceil(this.filteredLeaves.length / this.pageSize);
    this.pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  changePage(page: number) {
    if (page < 1 || page > this.pages.length) return;
    this.currentPage = page;
    this.updatePagination();
  }

  /* ================= ADD ================= */
  openAdd() {
    this.editId = null;
    this.leaveForm.reset({
      approval_status: 'Pending',
      status: 'active',
      last_accessed_by: '1'
    });
    this.showModal = true;
  }

  /* ================= EDIT ================= */
  openEdit(leave: any) {
    this.editId = leave.id;
    this.leaveForm.patchValue(leave);
    this.showModal = true;
  }

  /* ================= SAVE ================= */
  save() {

    if (this.leaveForm.invalid) {
      this.notify.error('Fill all required fields');
      return;
    }

    const payload = this.leaveForm.value;
    this.loading = true;

    const request$ = this.editId
      ? this.service.updateFacultyLeave(this.editId, payload)
      : this.service.createFacultyLeave(payload);

    request$.subscribe({
      next: (res: any) => {
        console.log('Leave Save Response:', res); // Debug

        this.notify.success(
          this.editId ? 'Updated successfully' : 'Created successfully'
        );

        this.showModal = false;
        this.searchText = '';
        this.loadLeaves();
        this.loading = false;
      },
      error: (err) => {
        console.error('Leave Save Error:', err);
        this.notify.error(err.error?.message || 'Server error');
        this.loading = false;
      }
    });

  }

  /* ================= DELETE ================= */
  delete(id: string) {
    if (!confirm('Delete this leave?')) return;

    this.service.deleteFacultyLeave(id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success('Deleted successfully');
          this.loadLeaves();
        }
      }
    });
  }
}



