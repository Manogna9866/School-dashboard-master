import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { form } from '@angular/forms/signals';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-progress-cards',
  imports: [ReactiveFormsModule,FormsModule,CommonModule],
  templateUrl: './progress-cards.html',
  styleUrl: './progress-cards.scss',
})
export class ProgressCards {
 progressCards: any[] = [];
  filteredProgressCards: any[] = [];
  paginatedProgressCards: any[] = [];

  pages: number[] = [];
  currentPage = 1;
  pageSize = 5;

  searchText = '';
  showModal = false;
  editId: string | null = null;
  loading = false;

  progressCardForm!: FormGroup;

  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  ngOnInit() {
    this.progressCardForm = this.fb.group({
      school_id: ['1', Validators.required],
      branch_id: ['1', Validators.required],
      exam_id: ['', Validators.required],
      student_id: ['', Validators.required],
      class_id: ['', Validators.required],
      total_marks: ['', Validators.required],
      obtained_marks: ['', Validators.required],
      percentage: [''],
      rank: ['', Validators.required],
      grade: ['', Validators.required],
      result_status: ['', Validators.required],
      overall_remarks: [''],
    });

    this.loadProgressCards();

    this.progressCardForm.valueChanges.subscribe(() => {
      this.calculatePercentage();
    });
  }

  /* ================= LOAD ================= */
  loadProgressCards() {
    this.loading = true;

    this.service.getprogresscards().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.progressCards = Array.isArray(res.data?.data)
            ? res.data.data
            : [];
          this.applyFilter();
        } else {
          this.notify.error('Failed to load progress cards');
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

    this.filteredProgressCards = this.progressCards.filter(p =>
      (p.student_id || '').toString().includes(text) ||
      (p.exam_id || '').toString().includes(text) ||
      (p.class_id || '').toString().includes(text) ||
      (p.grade || '').toLowerCase().includes(text) ||
      (p.result_status || '').toLowerCase().includes(text)
    );

    this.currentPage = 1;
    this.updatePagination();
  }

  /* ================= PAGINATION ================= */
  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedProgressCards = this.filteredProgressCards.slice(start, end);

    const totalPages = Math.ceil(this.filteredProgressCards.length / this.pageSize);
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
    this.progressCardForm.reset({
      school_id: '1',
      branch_id: '1'
    });
    this.showModal = true;
  }

  openEdit(card: any) {
    this.editId = card.id;
    this.progressCardForm.patchValue(card);
    this.showModal = true;
  }

  /* ================= CALCULATION ================= */
  calculatePercentage() {
    const total = this.progressCardForm.value.total_marks;
    const obtained = this.progressCardForm.value.obtained_marks;

    if (total && obtained) {
      const percentage = ((obtained / total) * 100).toFixed(2);
      this.progressCardForm.patchValue({ percentage }, { emitEvent: false });
    }
  }

 save() {
  if (this.progressCardForm.invalid) {
    this.notify.error('All required fields are required');
    return;
  }

  this.loading = true;

  const request$ = this.editId
    ? this.service.updateprogresscard(this.editId, this.progressCardForm.value)
    : this.service.createprogresscard(this.progressCardForm.value);

  request$.subscribe({
    next: (res: any) => {
      if (res.success) {
        this.notify.success(res.message || 'Progress card saved successfully');
        this.showModal = false;

        this.progressCardForm.reset({
          school_id: '1',
          branch_id: '1'
        });

        this.loadProgressCards();
      } else {
        this.notify.error(res.message || 'Operation failed');
      }

      this.loading = false;
    },
    error: (err: any) => {
      this.notify.error(err.error?.message || 'Server error');
      this.loading = false;
    }
  });
}


  /* ================= DELETE ================= */
  delete(id: string) {
    if (!confirm('Delete this progress card?')) return;

    this.loading = true;
    this.service.deleteprogresscard(id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success('Progress card deleted');
          this.loadProgressCards();
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
