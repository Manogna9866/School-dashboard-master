import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-assignments-homeworks',
  imports: [ReactiveFormsModule,FormsModule,CommonModule],
  templateUrl: './assignments-homeworks.html',
  styleUrl: './assignments-homeworks.scss',
})
export class AssignmentsHomeworks {

  assignments: any[] = [];
  filteredAssignments: any[] = [];
  paginatedAssignments: any[] = [];

  pages: number[] = [];
  currentPage = 1;
  pageSize = 5;

  searchText = '';
  showModal = false;
  editId: string | null = null;
  loading = false;

  assignmentForm!: FormGroup;

  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  /* ================= INIT ================= */
  ngOnInit(): void {
    this.assignmentForm = this.fb.group({
      school_id: ['1', Validators.required],
      branch_id: ['1', Validators.required],
      class_id: ['1', Validators.required],
      faculty_id: ['1'],
      subject: ['', Validators.required],
      title: ['', Validators.required],
      description: [''],
      assigned_date: ['', Validators.required],
      due_date: ['', Validators.required],
      submission_status: ['submitted', Validators.required],
      marks_obtained: ['']
    });

    this.loadAssignments();
  }

  /* ================= LOAD ================= */
  loadAssignments() {
    this.loading = true;

    this.service. getassignmentshomeworks().subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.assignments = Array.isArray(res.data?.data)
            ? res.data.data
            : [];
          this.applyFilter();
        } else {
          this.notify.error('Failed to load assignments');
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

    this.filteredAssignments = this.assignments.filter(a =>
      a.subject?.toLowerCase().includes(text) ||
      a.title?.toLowerCase().includes(text) ||
      a.submission_status?.toLowerCase().includes(text)
    );

    this.currentPage = 1;
    this.updatePagination();
  }

  /* ================= PAGINATION ================= */
  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedAssignments =
      this.filteredAssignments.slice(start, end);

    const totalPages =
      Math.ceil(this.filteredAssignments.length / this.pageSize);

    this.pages =
      Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  changePage(page: number) {
    if (page < 1 || page > this.pages.length) return;
    this.currentPage = page;
    this.updatePagination();
  }

  /* ================= MODAL ================= */
  openAdd() {
    this.editId = null;
    this.assignmentForm.reset({
      school_id: '1',
      branch_id: '1',
      class_id: '1',
      faculty_id: '1',
      submission_status: 'submitted'
    });
    this.showModal = true;
  }

  openEdit(ass: any) {
    this.editId = ass.id;
    this.assignmentForm.patchValue(ass);
    this.showModal = true;
  }

  /* ================= SAVE ================= */
  save() {
    if (this.assignmentForm.invalid) {
      this.notify.error('All required fields must be filled');
      return;
    }

    const payload = this.assignmentForm.value;
    this.loading = true;

    const request$ = this.editId
      ? this.service.updateassignmentshomework(this.editId, payload)
      : this.service.createassignmentshomework(payload);

    request$.subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.notify.success(
            this.editId ? 'Assignment updated' : 'Assignment created'
          );
          this.showModal = false;
          this.searchText = '';
          this.loadAssignments();
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
    if (!confirm('Delete this assignment?')) return;

    this.loading = true;

    this.service.deleteassignmentshomework(id).subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.notify.success('Assignment deleted');
          this.loadAssignments();
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
