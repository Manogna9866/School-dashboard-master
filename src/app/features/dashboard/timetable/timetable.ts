import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-timetable',
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './timetable.html',
  styleUrl: './timetable.scss',
})
export class Timetable {
  classes: any[] = [];
  faculty: any[] = [];
  branches: any[] = [];
  schools: any[] = [];
  timetables: any[] = [];
  filteredTimetables: any[] = [];
  paginatedTimetables: any[] = [];

  pages: number[] = [];
  currentPage = 1;
  pageSize = 5;

  searchText = '';
  showModal = false;
  editId: number | null = null;

  loading = false;

  timetableForm!: FormGroup;

  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  ngOnInit() {

    this.timetableForm = this.fb.group({
      school_id: ['', Validators.required],
      branch_id: ['', Validators.required],
      class_id: ['', Validators.required],
      day_of_week: ['', Validators.required],
      period_number: ['', Validators.required],
      subject: ['', Validators.required],
      faculty_id: ['', Validators.required],
      start_time: ['', Validators.required],
      end_time: ['', Validators.required],
      status: ['active', Validators.required]
    });

    this.loadSchools();
    this.loadTimetables();

    /* ===== SCHOOL CHANGE → LOAD BRANCHES ===== */
    this.timetableForm.get('school_id')?.valueChanges.subscribe((schoolId) => {
      if (schoolId) {
        this.branches = [];
        this.classes = [];
        this.faculty = [];

        this.timetableForm.patchValue({
          branch_id: '',
          class_id: '',
          faculty_id: ''
        });

        this.loadBranchesBySchool(Number(schoolId));
      }
    });

    /* ===== BRANCH CHANGE → LOAD CLASSES + FACULTY ===== */
    this.timetableForm.get('branch_id')?.valueChanges.subscribe((branchId) => {
      if (branchId) {
        this.classes = [];
        this.faculty = [];

        this.timetableForm.patchValue({
          class_id: '',
          faculty_id: ''
        });

        this.loadClassesByBranch(Number(branchId));
        this.loadFacultyByBranch(Number(branchId));
      }
    });
  }

  /* ================= SCHOOLS ================= */
  loadSchools() {
    this.service.getSchools().subscribe({
      next: (res: any) => {
        this.schools = res.success && res.data?.data ? res.data.data : [];
      },
      error: () => this.notify.error('Failed to load schools')
    });
  }

  /* ================= BRANCHES ================= */
  loadBranchesBySchool(schoolId: number) {
    this.service.getBranches().subscribe({
      next: (res: any) => {
        this.branches = res.success && res.data?.data
          ? res.data.data.filter((b: any) => b.school_id == schoolId)
          : [];
      },
      error: () => this.notify.error('Failed to load branches')
    });
  }

  /* ================= CLASSES ================= */
  loadClassesByBranch(branchId: number) {
    this.service.getClasses().subscribe({
      next: (res: any) => {
        this.classes = res.success && res.data?.data
          ? res.data.data.filter((c: any) => c.branch_id == branchId)
          : [];
      },
      error: () => this.notify.error('Failed to load classes')
    });
  }

  /* ================= FACULTY ================= */
  loadFacultyByBranch(branchId: number) {
    this.service.getfaculties().subscribe({
      next: (res: any) => {
        this.faculty = res.success && res.data?.data
          ? res.data.data.filter((f: any) => f.branch_id == branchId)
          : [];
      },
      error: () => this.notify.error('Failed to load faculty')
    });
  }

  /* ================= TIMETABLE LOAD ================= */
  loadTimetables() {
    this.loading = true;

    this.service.getTimetables().subscribe({
      next: (res: any) => {
        this.timetables = res.success && Array.isArray(res.data?.data)
          ? res.data.data
          : [];
        this.applyFilter();
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

    this.filteredTimetables = this.timetables.filter(t =>
      (t.subject || '').toLowerCase().includes(text) ||
      (t.day_of_week || '').toLowerCase().includes(text)
    );

    this.currentPage = 1;
    this.updatePagination();
  }

  /* ================= PAGINATION ================= */
  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedTimetables = this.filteredTimetables.slice(start, end);

    const totalPages = Math.ceil(this.filteredTimetables.length / this.pageSize);
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

    this.timetableForm.reset({
      school_id: '',
      branch_id: '',
      class_id: '',
      faculty_id: '',
      day_of_week: '',
      period_number: '',
      subject: '',
      start_time: '',
      end_time: '',
      status: 'active'
    });

    this.branches = [];
    this.classes = [];
    this.faculty = [];

    this.showModal = true;
  }


  openEdit(row: any) {
    this.editId = Number(row.id);
    this.timetableForm.patchValue(row);
    this.showModal = true;
  }


  /* ================= SAVE ================= */
  save() {

    if (this.timetableForm.invalid) {
      this.notify.error('Please fill all required fields');
      this.timetableForm.markAllAsTouched();
      return;
    }

    const formValue = this.timetableForm.value;

    const payload = {
      school_id: String(formValue.school_id),
      branch_id: String(formValue.branch_id),
      class_id: String(formValue.class_id),
      faculty_id: String(formValue.faculty_id),
      day_of_week: formValue.day_of_week,
      period_number: String(formValue.period_number),
      subject: formValue.subject?.trim(),
      start_time: formValue.start_time,
      end_time: formValue.end_time,
      status: formValue.status
    };

    console.log('CREATE Payload:', payload);

    this.loading = true;

    const request$ = this.editId
      ? this.service.updateTimetable(String(this.editId), payload)
      
      : this.service.createTimetable(payload);

    request$.subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success(
            this.editId ? 'Updated successfully' : 'Created successfully'
          );
          this.showModal = false;
          this.loadTimetables();
        } else {
          this.notify.error(res.message || 'Operation failed');
        }
        this.loading = false;
      },
      error: (err) => {
        console.log('Create Error:', err);
        this.notify.error(err?.error?.message || 'Server error');
        this.loading = false;
      }
    });
  }






  /* ================= DELETE ================= */
  delete(id: number) {
    if (!confirm('Delete this timetable entry?')) return;

    this.service.deleteTimetable(id.toString()).subscribe({
      next: () => {
        this.notify.success('Deleted successfully');
        this.loadTimetables();
      },
      error: () => this.notify.error('Delete failed')
    });
  }
}
