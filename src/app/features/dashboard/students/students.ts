import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-students',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './students.html',
  styleUrl: './students.scss',
})
export class Students {
  students: any[] = [];
  filteredStudents: any[] = [];
  paginatedStudents: any[] = [];

  pages: number[] = [];
  currentPage = 1;
  pageSize = 5;

  searchText = '';
  showModal = false;
  editId: string | null = null;
  loading = false;

  studentForm!: FormGroup;

  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  ngOnInit() {
    this.studentForm = this.fb.group({
      school_id: ['1', Validators.required],
      branch_id: ['1', Validators.required],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      gender: ['', Validators.required],
      date_of_birth: ['', Validators.required],
      aadhaar_number: [''],
      class_id: ['', Validators.required],
      roll_number: ['', Validators.required],
      phone_number: ['', Validators.required],
      email: ['', Validators.required],
      address: ['', Validators.required],
      admission_date: ['', Validators.required],
      status: ['Active', Validators.required],
    });


    this.loadStudents();
  }

  /* ================= LOAD ================= */
  loadStudents() {
    this.loading = true;

    this.service.getstudents().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.students = Array.isArray(res.data?.data)
            ? res.data.data
            : [];

          this.applyFilter();
        } else {
          this.notify.error('Failed to load students');
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

    this.filteredStudents = this.students.filter(s =>
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(text) ||
      (s.roll_number || '').toString().includes(text) ||
      (s.class_id || '').toString().includes(text)
    );

    this.currentPage = 1;
    this.updatePagination();
  }

  /* ================= PAGINATION ================= */
  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedStudents = this.filteredStudents.slice(start, end);

    const totalPages = Math.ceil(this.filteredStudents.length / this.pageSize);
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
    this.studentForm.reset({
      school_id: '1',
      branch_id: '1',
      status: 'Active'
    });
    this.showModal = true;
  }

  openEdit(student: any) {
    this.editId = student.id;
    this.studentForm.patchValue(student);
    this.showModal = true;
  }

  /* ================= SAVE ================= */
  save() {
    if (this.studentForm.invalid) {
      this.notify.error('Please fill all required fields');
      return;
    }

    this.loading = true;

    const formData = new FormData();

    Object.entries(this.studentForm.value).forEach(([key, value]: any) => {
      formData.append(key, value ?? '');
    });

    // REQUIRED EXTRA FIELDS FOR API
    formData.append('discontinuation_status', 'No');
    formData.append('rejoined', 'No');

    const request$ = this.editId
      ? this.service.updatestudent(this.editId, formData)
      : this.service.createstudent(formData);

    request$.subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success(this.editId ? 'Student updated' : 'Student added');
          this.showModal = false;
          this.searchText = '';
          this.loadStudents();
        } else {
          this.notify.error(res.message || 'Operation failed');
        }
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.notify.error('Server error');
        this.loading = false;
      }
    });
  }


  /* ================= DELETE ================= */
  delete(id: string) {
    if (!confirm('Delete this student?')) return;

    this.loading = true;
    this.service.deletestudent(id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success('Student deleted');
          this.loadStudents();
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
