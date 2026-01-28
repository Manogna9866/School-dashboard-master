import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from './../../../layouts/auth/auth';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotifyService } from '../../../core/services/notify';
import { AuthService } from '../../../core/auth/auth';

@Component({
  selector: 'app-classes',
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './classes.html',
  styleUrl: './classes.scss',
})
export class Classes {

  classes: any[] = [];
  filteredClasses: any[] = [];
  paginatedClasses: any[] = [];

  pages: number[] = [];

  searchText = '';
  currentPage = 1;
  pageSize = 5;

  showModal = false;
  editId: string | null = null;
  loading = false;

  classForm!: FormGroup;

  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  ngOnInit(): void {
    this.classForm = this.fb.group({
      school_id: ['1', Validators.required],
      branch_id: ['1', Validators.required],
      faculty_id: ['', Validators.required],
      class_name: ['', Validators.required],
      section: ['', Validators.required],
      total_students: ['', Validators.required],
      subjects_covered: ['', Validators.required],
      status: ['active', Validators.required],
    });

    this.loadClasses();
  }

  /* ================= LOAD ================= */
  loadClasses() {
    this.loading = true;

    this.service.getClasses().subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.classes = res.data?.data || [];
          this.applyFilter(); // 🔥 REQUIRED
        } else {
          this.notify.error(res?.message || 'Failed to load classes');
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

    this.filteredClasses = this.classes.filter(c =>
      (c.class_name || '').toLowerCase().includes(text) ||
      (c.section || '').toLowerCase().includes(text) ||
      (c.subjects_covered || '').toLowerCase().includes(text)
    );

    this.currentPage = 1;
    this.updatePagination();
  }

  /* ================= PAGINATION ================= */
  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedClasses = this.filteredClasses.slice(start, end);

    const totalPages = Math.ceil(this.filteredClasses.length / this.pageSize);
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
    this.classForm.reset({
      school_id: '1',
      branch_id: '1',
      status: 'active'
    });
    this.showModal = true;
  }

  openEdit(cls: any) {
    this.editId = cls.id;
    this.classForm.patchValue({
      school_id: cls.school_id,
      branch_id: cls.branch_id,
      faculty_id: cls.faculty_id,
      class_name: cls.class_name,
      section: cls.section,
      total_students: cls.total_students,
      subjects_covered: cls.subjects_covered,
      status: cls.status
    });
    this.showModal = true;
  }

  /* ================= SAVE ================= */
  save() {
    if (this.classForm.invalid) {
      this.notify.error('All fields are required');
      return;
    }

    this.loading = true;
    const payload = this.classForm.value;

    const request$ = this.editId
      ? this.service.updateClass(this.editId, payload)
      : this.service.createClass(payload);

    request$.subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.notify.success(this.editId ? 'Class updated' : 'Class added');
          this.showModal = false;
          this.searchText = '';
          this.loadClasses();
        } else {
          this.notify.error(res?.message || 'Operation failed');
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
    if (!confirm('Delete this class?')) return;

    this.loading = true;

    this.service.deleteClass(id).subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.notify.success('Class deleted');
          this.loadClasses();
        } else {
          this.notify.error(res?.message || 'Delete failed');
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


