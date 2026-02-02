import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-timetable',
  imports: [ReactiveFormsModule,FormsModule,CommonModule],
  templateUrl: './timetable.html',
  styleUrl: './timetable.scss',
})
export class Timetable {
  timetables: any[] = [];
  filteredTimetables: any[] = [];
  paginatedTimetables: any[] = [];

  pages: number[] = [];
  currentPage = 1;
  pageSize = 5;

  searchText = '';
  showModal = false;
  editId: string | null = null;
  loading = false;

  timetableForm!: FormGroup;

  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  ngOnInit() {
    this.timetableForm = this.fb.group({
      school_id: ['1', Validators.required],
      branch_id: ['1', Validators.required],
      class_id: ['', Validators.required],
      day_of_week: ['', Validators.required],
      period_number: ['', Validators.required],
      subject: ['', Validators.required],
      faculty_id: ['', Validators.required],
      start_time: ['', Validators.required],
      end_time: ['', Validators.required],
      status: ['active', Validators.required]
    });

    this.loadTimetables();
  }

  /* ================= LOAD ================= */
  loadTimetables() {
    this.loading = true;

    this.service.getTimetables().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.timetables = Array.isArray(res.data?.data)
            ? res.data.data
            : [];

          this.applyFilter();
        } else {
          this.notify.error('Failed to load timetable');
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

    this.filteredTimetables = this.timetables.filter(t =>
      (t.subject || '').toLowerCase().includes(text) ||
      (t.day_of_week || '').toLowerCase().includes(text) ||
      (t.class_id || '').toString().includes(text)
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
      school_id: '1',
      branch_id: '1',
      status: 'active'
    });
    this.showModal = true;
  }

  openEdit(row: any) {
    this.editId = row.id;
    this.timetableForm.patchValue(row);
    this.showModal = true;
  }

  /* ================= SAVE ================= */
  save() {
    if (this.timetableForm.invalid) {
      this.notify.error('Please fill all required fields');
      return;
    }

    const payload = this.timetableForm.value;
    this.loading = true;

    const request$ = this.editId
      ? this.service.updateTimetable(this.editId, payload)
      : this.service.createTimetable(payload);

    request$.subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success(this.editId ? 'Timetable updated' : 'Timetable created');
          this.showModal = false;
          this.searchText = '';
          this.loadTimetables();
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
    if (!confirm('Delete this timetable entry?')) return;

    this.loading = true;
    this.service.deleteTimetable(id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success('Timetable deleted');
          this.loadTimetables();
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
