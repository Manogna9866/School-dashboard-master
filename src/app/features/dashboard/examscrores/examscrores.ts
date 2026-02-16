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
  schools: any[] = [];
  branches: any[] = [];
  exams: any[] = [];
  students: any[] = [];
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
      school_id: ['', Validators.required],
      branch_id: ['', Validators.required],
      exam_id: ['', Validators.required],
      student_id: ['', Validators.required],
      marks_obtained: ['', Validators.required],
      grade: ['', Validators.required],
      result_status: ['', Validators.required],
      remarks: [''],
    });

    // Load master data
    this.loadSchools();
    this.loadExamScores();

    // ================= Cascading Selects =================
    // School → Branch + Students
    this.examScoreForm.get('school_id')?.valueChanges.subscribe((schoolId) => {
      if (schoolId) {
        this.loadBranchesBySchool(schoolId);
        this.loadStudentsBySchool(schoolId); // 🔥 Load students by school
        this.examScoreForm.patchValue({ branch_id: '', exam_id: '', student_id: '' }, { emitEvent: false });
        this.exams = [];
      } else {
        this.branches = [];
        this.students = [];
        this.exams = [];
      }
    });

    // Branch → Exams
    this.examScoreForm.get('branch_id')?.valueChanges.subscribe((branchId) => {
      if (branchId) {
        this.loadExamsByBranch(branchId);
        this.examScoreForm.patchValue({ exam_id: '' }, { emitEvent: false });
      } else {
        this.exams = [];
      }
    });
  }

  /* ================= LOAD MASTER ================= */
  loadSchools() {
    this.service.getSchools().subscribe({
      next: (res: any) => {
        this.schools = res?.success ? res.data?.data || [] : [];
      },
      error: () => this.notify.error('Failed to load schools')
    });
  }

  loadBranchesBySchool(schoolId: string) {
    this.service.getBranches().subscribe({
      next: (res: any) => {
        this.branches = (res.data?.data || []).filter((b: any) => Number(b.school_id) === Number(schoolId));
      },
      error: () => {
        this.branches = [];
        this.notify.error('Failed to load branches');
      }
    });
  }

  loadExamsByBranch(branchId: string) {
    this.service.getExams().subscribe({
      next: (res: any) => {
        this.exams = (res.data?.data || []).filter((e: any) => Number(e.branch_id) === Number(branchId));
      },
      error: () => {
        this.exams = [];
        this.notify.error('Failed to load exams');
      }
    });
  }

  // ================= 🔥 Load Students by School =================
  loadStudentsBySchool(schoolId: string) {
    if (!schoolId) {
      this.students = [];
      return;
    }
    const sId = Number(schoolId);

    this.service.getstudents().subscribe({
      next: (res: any) => {
        const allStudents = res?.success ? res.data?.data || [] : [];
        this.students = allStudents.filter((s: any) => Number(s.school_id) === sId);
      },
      error: () => {
        this.students = [];
        this.notify.error('Failed to load students');
      }
    });
  }

  /* ================= EXAM SCORES ================= */
  loadExamScores() {
    this.service.getexamscrores().subscribe({
      next: (res: any) => {
        this.examScores = res?.success ? res.data?.data || [] : [];
        this.applyFilter();
      },
      error: () => this.notify.error('Server error')
    });
  }

  /* ================= SEARCH & PAGINATION ================= */
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
    this.examScoreForm.reset();
    this.showModal = true;
  }

  openEdit(score: any) {
    this.editId = score.id;
    this.showModal = true;
    this.examScoreForm.patchValue(score);

    // Load branches and students for edit
    this.loadBranchesBySchool(score.school_id);
    this.loadStudentsBySchool(score.school_id);
    this.loadExamsByBranch(score.branch_id);
  }

  save() {
    if (this.examScoreForm.invalid) {
      this.notify.error('All required fields are required');
      return;
    }

    this.loading = true;
    const payload = this.examScoreForm.value;

    const request$ = this.editId
      ? this.service.updateexamscrore(this.editId, payload)
      : this.service.createexamscrore(payload);

    request$.subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success(res.message || 'Exam score saved successfully');
          this.showModal = false;
          this.loadExamScores();
        } else {
          this.notify.error(res.message || 'Operation failed');
        }
        this.loading = false;
      },
      error: (err) => {
        this.notify.error(err.error?.message || 'Server error');
        this.loading = false;
      }
    });
  }

  delete(id: string) {
    if (!confirm('Delete this exam score?')) return;
    this.service.deleteexamscrore(id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success('Exam score deleted');
          this.loadExamScores();
        } else {
          this.notify.error('Delete failed');
        }
      },
      error: () => this.notify.error('Server error')
    });
  }
}
