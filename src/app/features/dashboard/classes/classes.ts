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
    faculty: any[] = [];
  schools: any[] = [];
  branches: any[] = [];
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
      school_id: ['', Validators.required],
      branch_id: ['', Validators.required],
      faculty_id: ['', Validators.required],
      class_name: ['', Validators.required],
      section: ['', Validators.required],
      total_students: ['', Validators.required],
      subjects_covered: ['', Validators.required],
      status: ['active', Validators.required],
    });

    this.loadSchools();
    this.loadClasses();

    /* 🔥 SCHOOL CHANGE → LOAD BRANCHES */
    this.classForm.get('school_id')?.valueChanges.subscribe((schoolId) => {
      if (schoolId) {
        this.loadBranchesBySchool(schoolId);
        this.branches = [];
        this.faculty = [];
        this.classForm.patchValue({ branch_id: '', faculty_id: '' });
      }
    });

    /* 🔥 BRANCH CHANGE → LOAD FACULTY */
    this.classForm.get('branch_id')?.valueChanges.subscribe((branchId) => {
      if (branchId) {
        this.loadFacultyByBranch(branchId);
        this.faculty = [];
        this.classForm.patchValue({ faculty_id: '' });
      }
    });
  }

  /* ================= LOAD ================= */

  loadClasses() {
    this.loading = true;

    this.service.getClasses().subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.classes = res.data?.data || [];
          this.applyFilter();
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

  loadSchools() {
    this.service.getSchools().subscribe({
      next: (res: any) => {
        this.schools = res.success && res.data?.data ? res.data.data : [];
      },
      error: () => this.notify.error('Failed to load schools')
    });
  }

  loadBranchesBySchool(schoolId: number) {
    this.service.getBranches().subscribe({
      next: (res: any) => {
        if (res.success && res.data?.data) {
          this.branches = res.data.data.filter(
            (b: any) => b.school_id == schoolId
          );
        } else {
          this.branches = [];
        }
      },
      error: () => {
        this.notify.error('Failed to load branches');
        this.branches = [];
      }
    });
  }

  loadFacultyByBranch(branchId: number) {
    this.service.getfaculties().subscribe({
      next: (res: any) => {
        if (res.success && res.data?.data) {
          this.faculty = res.data.data.filter(
            (f: any) => f.branch_id == branchId
          );
        } else {
          this.faculty = [];
        }
      },
      error: () => {
        this.notify.error('Failed to load faculty');
        this.faculty = [];
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
    this.branches = [];
    this.faculty = [];

    this.classForm.reset({
      status: 'active'
    });

    this.showModal = true;
  }

  openEdit(cls: any) {
    this.editId = cls.id;
    this.showModal = true;

    this.loadBranchesBySchool(cls.school_id);
    this.loadFacultyByBranch(cls.branch_id);

    this.classForm.patchValue(cls);
  }

  /* ================= SAVE ================= */

  save() {
    if (this.classForm.invalid) {
      this.notify.error('All fields are required');
      return;
    }

    const payload = {
      ...this.classForm.value,
      school_id: Number(this.classForm.value.school_id),
      branch_id: Number(this.classForm.value.branch_id),
      faculty_id: Number(this.classForm.value.faculty_id),
      total_students: Number(this.classForm.value.total_students),
    };

    this.loading = true;

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

  delete(id: string) {
    if (!confirm('Delete this class?')) return;

    this.service.deleteClass(id).subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.notify.success('Class deleted');
          this.loadClasses();
        } else {
          this.notify.error(res?.message || 'Delete failed');
        }
      },
      error: () => this.notify.error('Server error')
    });
  }
}


