import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-subjects',
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './subjects.html',
  styleUrl: './subjects.scss',
})
export class Subjects {
subjects: any[] = [];
  filteredSubjects: any[] = [];
  paginatedSubjects: any[] = [];

  pages: number[] = [];
  currentPage = 1;
  pageSize = 5;

  searchText = '';
  showModal = false;
  editId: string | null = null;
  loading = false;

  subjectForm!: FormGroup;

  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  ngOnInit() {
    this.subjectForm = this.fb.group({
      school_id: ['1', Validators.required],
      branch_id: ['1', Validators.required],
      class_id: ['1', Validators.required],
      faculty_id: ['1', Validators.required],
      name: ['', Validators.required],
      code: ['', Validators.required],
      sub_type: ['', Validators.required],
      passing_marks: ['', Validators.required],
      max_marks: ['', Validators.required],
    });

    this.loadSubjects();
  }

  /* ================= LOAD ================= */
  loadSubjects() {
    this.loading = true;

    this.service.getSubjects().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.subjects = Array.isArray(res.data?.data)
            ? res.data.data
            : [];

          this.applyFilter();
        } else {
          this.notify.error('Failed to load subjects');
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

    this.filteredSubjects = this.subjects.filter(s =>
      s.name.toLowerCase().includes(text) ||
      s.code.toLowerCase().includes(text) ||
      (s.sub_type || '').toLowerCase().includes(text)
    );

    this.currentPage = 1;
    this.updatePagination();
  }

  /* ================= PAGINATION ================= */
  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedSubjects = this.filteredSubjects.slice(start, end);

    const totalPages = Math.ceil(this.filteredSubjects.length / this.pageSize);
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
    this.subjectForm.reset({
      school_id: '1',
      branch_id: '1',
      class_id: '1',
      faculty_id: '1'
    });
    this.showModal = true;
  }

  openEdit(subject: any) {
    this.editId = subject.id;
    this.subjectForm.patchValue(subject);
    this.showModal = true;
  }

  /* ================= SAVE ================= */
  save() {
    if (this.subjectForm.invalid) {
      this.notify.error('All required fields must be filled');
      return;
    }

    const payload = this.subjectForm.value;
    this.loading = true;

    const request$ = this.editId
      ? this.service.updatesubject(this.editId, payload)
      : this.service.createsubject(payload);

    request$.subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success(this.editId ? 'Subject updated' : 'Subject created');
          this.showModal = false;
          this.searchText = '';
          this.loadSubjects();
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
    if (!confirm('Delete this subject?')) return;

    this.loading = true;
    this.service.deletesubject(id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success('Subject deleted');
          this.loadSubjects();
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
