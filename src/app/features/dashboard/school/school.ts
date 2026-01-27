import { AuthService } from './../../../core/auth/auth';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonEngine } from '@angular/ssr/node';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-school',
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './school.html',
  styleUrl: './school.scss',
})
export class School {
  schools: any[] = [];
  filteredSchools: any[] = [];
  paginatedSchools: any[] = [];

  showModal = false;
  editId: string | null = null;
  loading = false;

  searchText = '';
  currentPage = 1;
  pageSize = 5;

  schoolForm!: FormGroup;
  apiBaseUrl = 'https://s2swebsolutions.in/S2SWebSchool/public'; // For logos

  private fb = inject(FormBuilder);
  private schoolsService = inject(AuthService);
  private notify = inject(NotifyService);

  ngOnInit() {
    this.schoolForm = this.fb.group({
      school_name: ['', Validators.required],
      school_code: ['', Validators.required],
      address: ['', Validators.required],
      type: ['', Validators.required],
      management: ['', Validators.required],
      chairman_name: ['', Validators.required],
      contact_number: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      total_students: ['', Validators.required],
      total_teachers: ['', Validators.required],
      established_year: ['', Validators.required],
      status: ['active', Validators.required],
      logo: [''] // can be URL or file
    });

    this.loadSchools();
  }

  /* ---------------- LOAD ---------------- */
  loadSchools() {
    this.loading = true;
    this.schoolsService.getSchools().subscribe({
      next: (res) => {
        if (res.success) {
          this.schools = res.data.data;
          this.applyFilter();
        } else {
          this.notify.error(res.message || 'Failed to load schools');
        }
        this.loading = false;
      },
      error: () => {
        this.notify.error('Server error');
        this.loading = false;
      }
    });
  }

  /* ---------------- SEARCH ---------------- */
  applyFilter() {
    const text = this.searchText.toLowerCase();
    this.filteredSchools = this.schools.filter(s =>
      s.school_name.toLowerCase().includes(text) ||
      s.school_code.toLowerCase().includes(text) ||
      s.chairman_name.toLowerCase().includes(text)
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  /* ---------------- PAGINATION ---------------- */
  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedSchools = this.filteredSchools.slice(start, start + this.pageSize);
  }

  changePage(page: number) {
    this.currentPage = page;
    this.updatePagination();
  }

  totalPages() {
    return Math.ceil(this.filteredSchools.length / this.pageSize);
  }

  /* ---------------- MODAL ---------------- */
  openAdd() {
    this.editId = null;
    this.schoolForm.reset({ status: 'active' });
    this.showModal = true;
  }

  openEdit(school: any) {
    this.editId = school.id;
    this.schoolForm.patchValue(school);
    this.showModal = true;
  }

  /* ---------------- SAVE ---------------- */
  save() {
    if (this.schoolForm.invalid) {
      this.notify.error('All fields are required');
      return;
    }

    this.loading = true;

    const request$ = this.editId
      ? this.schoolsService.updateSchool(this.editId, this.schoolForm.value)
      : this.schoolsService.createSchool(this.schoolForm.value);

    request$.subscribe({
      next: (res) => {
        if (res.success) {
          this.notify.success(res.message || 'School saved successfully');
          this.showModal = false;
          this.schoolForm.reset();
          this.loadSchools();
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

  /* ---------------- DELETE ---------------- */
  delete(id: string) {
    if (!confirm('Delete this school?')) return;

    this.loading = true;

    this.schoolsService.deleteSchool(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.notify.success(res.message || 'School deleted successfully');
          this.loadSchools();
        } else {
          this.notify.error(res.message || 'Failed to delete school');
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
