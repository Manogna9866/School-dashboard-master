import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-faculty',
  imports: [FormsModule,CommonModule,ReactiveFormsModule],
  templateUrl: './faculty.html',
  styleUrl: './faculty.scss',
})
export class Faculty {
faculty: any[] = [];
  filteredFaculty: any[] = [];
  paginatedFaculty: any[] = [];

  pages: number[] = [];
  currentPage = 1;
  pageSize = 5;

  searchText = '';
  showModal = false;
  editId: string | null = null;
  loading = false;

  facultyForm!: FormGroup;

  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  ngOnInit() {
    this.facultyForm = this.fb.group({
      school_id: ['1', Validators.required],
      branch_id: ['1', Validators.required],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      gender: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone_number: ['', Validators.required],
      joining_date: ['', Validators.required],
      employment_status: ['Full-time'],
      address: [''],
      status: ['active', Validators.required],
    });

    this.loadFaculty();
  }

  /* ================= LOAD ================= */
  loadFaculty() {
    this.loading = true;

    this.service.getfaculties().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.faculty = Array.isArray(res.data?.data)
            ? res.data.data
            : [];

          this.applyFilter();
        } else {
          this.notify.error('Failed to load faculty');
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

    this.filteredFaculty = this.faculty.filter(f =>
      `${f.first_name} ${f.last_name}`.toLowerCase().includes(text) ||
      (f.email || '').toLowerCase().includes(text) ||
      (f.phone_number || '').includes(text)
    );

    this.currentPage = 1;
    this.updatePagination();
  }

  /* ================= PAGINATION ================= */
  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedFaculty = this.filteredFaculty.slice(start, end);

    const totalPages = Math.ceil(this.filteredFaculty.length / this.pageSize);
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
    this.facultyForm.reset({
      school_id: '1',
      branch_id: '1',
      status: 'active'
    });
    this.showModal = true;
  }

  openEdit(faculty: any) {
    this.editId = faculty.id;
    this.facultyForm.patchValue(faculty);
    this.showModal = true;
  }

  /* ================= SAVE ================= */
  save() {
    if (this.facultyForm.invalid) {
      this.notify.error('All required fields must be filled');
      return;
    }

    const payload = this.facultyForm.value;
    this.loading = true;

    const request$ = this.editId
      ? this.service.updatefaculty(this.editId, payload)
      : this.service.createfaculty(payload);

    request$.subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success(this.editId ? 'Faculty updated' : 'Faculty created');
          this.showModal = false;
          this.searchText = '';
          this.loadFaculty();
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
    if (!confirm('Delete this faculty member?')) return;

    this.loading = true;
    this.service.deletefaculty(id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success('Faculty deleted');
          this.loadFaculty();
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
