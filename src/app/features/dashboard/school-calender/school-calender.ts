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
  calendar: any[] = [];
  filteredCalendar: any[] = [];
  paginatedCalendar: any[] = [];

  pages: number[] = [];
  currentPage = 1;
  pageSize = 5;

  searchText = '';
  showModal = false;
  editId: string | null = null;

  calendarForm!: FormGroup;

  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  ngOnInit() {
    this.calendarForm = this.fb.group({
      school_id: ['1', Validators.required],
      branch_id: ['1', Validators.required],
      title: ['', Validators.required],
      calendar_type: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      description: [''],
      is_working_day: ['No'],
      visibility: ['All'],
      status: ['active']
    });

    this.loadCalendar();
  }

  /* ================= LOAD ================= */
  loadCalendar() {
    this.service.getSchoolCalenders().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.calendar = Array.isArray(res.data?.data)
            ? res.data.data
            : [];

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
      c.title.toLowerCase().includes(text) ||
      c.calendar_type.toLowerCase().includes(text) ||
      c.visibility.toLowerCase().includes(text)
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
      school_id: '1',
      branch_id: '1',
      status: 'active'
    });
    this.showModal = true;
  }

  openEdit(item: any) {
    this.editId = item.id;
    this.calendarForm.patchValue(item);
    this.showModal = true;
  }

  /* ================= SAVE ================= */
  save() {
    if (this.calendarForm.invalid) {
      this.notify.error('All required fields must be filled');
      return;
    }

    // 🔥 Always ensure these are sent
    const payload = {
      ...this.calendarForm.value,
      school_id: '1',
      branch_id: '1'
    };

    const request$ = this.editId
      ? this.service.updateSchoolCalender(this.editId, payload)
      : this.service.createSchoolCalender(payload);

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
      },
      error: (err) => {
        console.log(err.error);
        this.notify.error(err.error?.message || 'Server error');
      }
    });
  }


  /* ================= DELETE ================= */
  delete(id: string) {
    if (!confirm('Delete this record?')) return;

    this.service.deleteSchoolCalender(id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success('Record deleted');
          this.loadCalendar();
        } else {
          this.notify.error('Delete failed');
        }
      },
      error: () => this.notify.error('Server error')
    });
  }
}
