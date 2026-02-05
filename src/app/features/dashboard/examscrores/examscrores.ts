import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '../../../layouts/auth/auth';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-examscrores',
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './examscrores.html',
  styleUrl: './examscrores.scss',
})
export class Examscrores {
  examScores: any[] = [];
  filteredExamScores: any[] = [];
  paginatedExamScores: any[] = [];

  pages: number[] = [];
  currentPage = 1;
  pageSize = 5;

  searchText = '';
  showModal = false;
  editId: string | null = null;
  loading = false;

  examScoreForm!: FormGroup;

  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  ngOnInit() {
    this.examScoreForm = this.fb.group({
      school_id: ['1', Validators.required],
      branch_id: ['1', Validators.required],
      exam_id: ['', Validators.required],
      student_id: ['', Validators.required],
      marks_obtained: ['', Validators.required],
      grade: ['', Validators.required],
      result_status: ['', Validators.required],
      remarks: [''],
    });

    this.loadExamScores();
  }

  /* ================= LOAD ================= */
  loadExamScores() {
    this.loading = true;

    this.service.getexamscrores().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.examScores = Array.isArray(res.data?.data)
            ? res.data.data
            : [];
          this.applyFilter();
        } else {
          this.notify.error('Failed to load exam scores');
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

    this.filteredExamScores = this.examScores.filter(s =>
      (s.student_id || '').toString().includes(text) ||
      (s.exam_id || '').toString().includes(text) ||
      (s.grade || '').toLowerCase().includes(text) ||
      (s.result_status || '').toLowerCase().includes(text)
    );

    this.currentPage = 1;
    this.updatePagination();
  }

  /* ================= PAGINATION ================= */
  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedExamScores = this.filteredExamScores.slice(start, end);

    const totalPages = Math.ceil(this.filteredExamScores.length / this.pageSize);
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
    this.examScoreForm.reset({
      school_id: '1',
      branch_id: '1'
    });
    this.showModal = true;
  }

  openEdit(score: any) {
    this.editId = score.id;
    this.examScoreForm.patchValue(score);
    this.showModal = true;
  }

  /* ================= SAVE ================= */
  save() {
    if (this.examScoreForm.invalid) {
      this.notify.error('All required fields are required');
      return;
    }

    this.loading = true;

    const request$ = this.editId
      ? this.service.updateexamscrore(this.editId, this.examScoreForm.value)
      : this.service.createexamscrore(this.examScoreForm.value);

    request$.subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success(res.message || 'Exam score saved successfully');
          this.showModal = false;
          this.examScoreForm.reset({
            school_id: '1',
            branch_id: '1'
          });
          this.loadExamScores();
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
    if (!confirm('Delete this exam score?')) return;

    this.loading = true;
    this.service.deleteexamscrore(id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success('Exam score deleted');
          this.loadExamScores();
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
