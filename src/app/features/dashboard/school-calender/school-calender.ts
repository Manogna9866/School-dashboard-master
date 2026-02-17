import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-school-calender',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './school-calender.html',
  styleUrl: './school-calender.scss',
})
export class SchoolCalender {
  schools: any[] = [];
  branches: any[] = [];
  filteredBranches: any[] = [];

  calendar: any[] = [];
  filteredCalendar: any[] = [];
  paginatedCalendar: any[] = [];

  /* ================= PAGINATION ================= */
  pages: number[] = [];
  currentPage = 1;
  pageSize = 5;

  /* ================= UI STATE ================= */
  searchText = '';
  showModal = false;
  editId: string | null = null;
 loading = false;
  calendarForm!: FormGroup;

  /* ================= INJECTION ================= */
  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  /* ================= INIT ================= */
  ngOnInit() {

    this.calendarForm = this.fb.group({
      school_id: ['', Validators.required],
      branch_id: ['', Validators.required],
      title: ['', Validators.required],
      calendar_type: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      description: [''],
      is_working_day: ['No'],
      visibility: ['All'],
      status: ['active']
    });

    this.loadSchools();
    this.loadBranches();
    this.loadCalendar();

    /* 🔥 SCHOOL CHANGE → FILTER BRANCHES */
    this.calendarForm.get('school_id')?.valueChanges.subscribe(schoolId => {

      if (!schoolId) {
        this.filteredBranches = [];
        this.calendarForm.patchValue({ branch_id: '' });
        return;
      }

      this.filteredBranches = this.branches.filter(
        (b: any) => b.school_id == schoolId
      );

      this.calendarForm.patchValue({ branch_id: '' });
    });

    /* 🔥 BRANCH CHANGE → ENSURE SCHOOL MATCH */
    this.calendarForm.get('branch_id')?.valueChanges.subscribe(branchId => {

      if (!branchId) return;

      const selectedBranch = this.branches.find(
        (b: any) => b.id == branchId
      );

      if (selectedBranch) {
        this.calendarForm.patchValue({
          school_id: selectedBranch.school_id
        }, { emitEvent: false });
      }
    });
  }

  /* ================= LOAD DATA ================= */
  loadSchools() {
    this.service.getSchools().subscribe({
      next: (res: any) => {
        this.schools = res.success && res.data?.data ? res.data.data : [];
      },
      error: () => this.notify.error('Failed to load schools')
    });
  }

  loadBranches() {
    this.service.getBranches().subscribe({
      next: (res: any) => {
        this.branches = res.success && res.data?.data ? res.data.data : [];
      },
      error: () => this.notify.error('Failed to load branches')
    });
  }

  loadCalendar() {
    this.service.getSchoolCalenders().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.calendar = Array.isArray(res.data?.data) ? res.data.data : [];
          this.applyFilter();
        } else {
          this.notify.error('Failed to load records');
        }
      },
      error: () => this.notify.error('Server error')
    });
  }

  /* ================= SEARCH ================= */
  applyFilter() {
    const text = this.searchText.toLowerCase();

    this.filteredCalendar = this.calendar.filter(c =>
      c.title?.toLowerCase().includes(text) ||
      c.calendar_type?.toLowerCase().includes(text) ||
      c.visibility?.toLowerCase().includes(text)
    );

    this.currentPage = 1;
    this.updatePagination();
  }

  /* ================= PAGINATION ================= */
  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedCalendar = this.filteredCalendar.slice(start, end);

    const totalPages = Math.ceil(this.filteredCalendar.length / this.pageSize);
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

    this.calendarForm.reset({
      school_id: '',
      branch_id: '',
      status: 'active',
      is_working_day: 'No',
      visibility: 'All'
    });

    this.filteredBranches = [];
    this.showModal = true;
  }

  openEdit(item: any) {
    this.editId = item.id;

    this.filteredBranches = this.branches.filter(
      (b: any) => b.school_id == item.school_id
    );

    this.calendarForm.patchValue(item);
    this.showModal = true;
  }

  /* ================= SAVE ================= */
  save() {

    if (this.calendarForm.invalid) {
      this.notify.error('Please fill all required fields');
      return;
    }

    const payload = {
      ...this.calendarForm.value,
      school_id: Number(this.calendarForm.value.school_id),
      branch_id: Number(this.calendarForm.value.branch_id)
    };

    const request$ = this.editId
      ? this.service.updateSchoolCalender(this.editId, payload)
      : this.service.createSchoolCalender(payload);

    this.loading = true;

    request$.subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success(this.editId ? 'Event updated' : 'Event created');
          this.showModal = false;
          this.searchText = '';
          this.loadCalendar();
        } else {
          this.notify.error(res.message || 'Operation failed');
        }
        this.loading = false;
      },
      error: (err) => {
        console.log(err);
        this.notify.error(err.error?.message || 'Server error');
        this.loading = false;
      }
    });
  }

  /* ================= DELETE ================= */
  delete(id: string) {
    if (!confirm('Delete this record?')) return;

    this.loading = true;

    this.service.deleteSchoolCalender(id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success('Record deleted');
          this.loadCalendar();
        } else {
          this.notify.error('Delete failed');
        }
        this.loading = false;
      },
      error: () => this.notify.error('Server error')
    });
  }
}
