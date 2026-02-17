import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { form } from '@angular/forms/signals';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-progress-cards',
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './progress-cards.html',
  styleUrl: './progress-cards.scss',
})
export class ProgressCards {
  progressCards: any[] = [];
  filteredProgressCards: any[] = [];
  paginatedProgressCards: any[] = [];

  schools: any[] = [];
  branches: any[] = [];
  classes: any[] = [];
  exams: any[] = [];
  students: any[] = [];

  pages: number[] = [];
  currentPage = 1;
  pageSize = 5;
  searchText = '';

  showModal = false;
  editId: string | null = null;
  loading = false;

  progressCardForm!: FormGroup;

  // Image previews
  teacherPreview: string | null = null;
  principalPreview: string | null = null;

  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  ngOnInit() {
    this.initForm();
    this.loadSchools();
    this.loadBranches();
    this.loadClasses();
    this.loadStudents();
    this.loadProgressCards();

    // Cascading selects
    this.progressCardForm.get('school_id')?.valueChanges.subscribe((schoolId: string) => {
      this.progressCardForm.patchValue(
        { branch_id: '', class_id: '', exam_id: '', student_id: '' },
        { emitEvent: false }
      );
      this.branches = schoolId ? [] : [];
      this.students = [];
      this.exams = [];
      if (schoolId) {
        this.loadBranchesBySchool(schoolId);
        this.loadStudentsBySchool(schoolId);
      }
    });

    this.progressCardForm.get('branch_id')?.valueChanges.subscribe((branchId: string) => {
      this.progressCardForm.patchValue({ exam_id: '', student_id: '' }, { emitEvent: false });
      this.exams = [];
      if (branchId) {
        this.loadExamsByBranch(branchId);
        this.loadStudentsByBranch(branchId);
      }
    });

    this.progressCardForm.get('class_id')?.valueChanges.subscribe((classId: string) => {
      this.progressCardForm.patchValue({ student_id: '' }, { emitEvent: false });
      if (classId) this.loadStudentsByClass(classId);
    });

    this.progressCardForm.get('exam_id')?.valueChanges.subscribe((examId: string) => {
      this.progressCardForm.patchValue({ student_id: '' }, { emitEvent: false });
      if (examId) this.loadStudentsByExam(examId);
    });

    // Auto-calculate percentage
    this.progressCardForm.valueChanges.subscribe(() => this.calculatePercentage());
  }

  initForm() {
    this.progressCardForm = this.fb.group({
      school_id: ['', Validators.required],
      branch_id: ['', Validators.required],
      class_id: ['', Validators.required],
      exam_id: ['', Validators.required],
      student_id: ['', Validators.required],
      total_marks: ['', Validators.required],
      obtained_marks: ['', Validators.required],
      percentage: [{ value: '', disabled: true }],
      rank: ['', Validators.required],
      grade: ['', Validators.required],
      result_status: ['', Validators.required],
      overall_remarks: [''],
      teacher_signature: [null],
      principal_signature: [null],
    });
  }

  // ------------------- LOAD DATA -------------------
  loadSchools() { this.service.getSchools().subscribe((res: any) => (this.schools = res?.success ? res.data?.data || [] : [])); }
  loadBranches() { this.service.getBranches().subscribe((res: any) => (this.branches = res?.success ? res.data?.data || [] : [])); }
  loadClasses() { this.service.getClasses().subscribe((res: any) => (this.classes = res?.success ? res.data?.data || [] : [])); }
  loadExamsByBranch(branchId: string) {
    this.service.getExams().subscribe((res: any) => {
      this.exams = (res.data?.data || []).filter((e: any) => e.branch_id == branchId);
    });
  }
  loadBranchesBySchool(schoolId: string) {
    this.service.getBranches().subscribe((res: any) => {
      this.branches = (res.data?.data || []).filter((b: any) => b.school_id == schoolId);
    });
  }
  loadStudents() { this.service.getstudents().subscribe((res: any) => (this.students = res?.success ? res.data?.data || [] : [])); }
  loadStudentsBySchool(schoolId: string) {
    this.service.getstudents().subscribe((res: any) => {
      const all = res?.success ? res.data?.data || [] : [];
      this.students = all.filter((s: any) => s.school_id == schoolId);
    });
  }
  loadStudentsByBranch(branchId: string) {
    this.service.getstudents().subscribe((res: any) => {
      const all = res?.success ? res.data?.data || [] : [];
      this.students = all.filter((s: any) => s.branch_id == branchId);
    });
  }
  loadStudentsByClass(classId: string) {
    this.service.getstudents().subscribe((res: any) => {
      const all = res?.success ? res.data?.data || [] : [];
      this.students = all.filter((s: any) => s.class_id == classId);
    });
  }
  loadStudentsByExam(examId: string) {
    this.service.getstudents().subscribe((res: any) => {
      const all = res?.success ? res.data?.data || [] : [];
      this.students = all.filter((s: any) => s.exam_id == examId);
    });
  }

  loadProgressCards() {
    this.loading = true;
    this.service.getprogresscards().subscribe({
      next: (res: any) => {
        this.progressCards = res?.success ? res.data?.data || [] : [];
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.notify.error('Server error');
        this.loading = false;
      },
    });
  }

  // ------------------- SEARCH & PAGINATION -------------------
  applyFilter() {
    const text = this.searchText.toLowerCase();
    this.filteredProgressCards = this.progressCards.filter((p: any) =>
      (p.student_id || '').toString().includes(text) ||
      (p.exam_id || '').toString().includes(text) ||
      (p.class_id || '').toString().includes(text) ||
      (p.grade || '').toLowerCase().includes(text) ||
      (p.result_status || '').toLowerCase().includes(text)
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedProgressCards = this.filteredProgressCards.slice(start, end);
    this.pages = Array.from({ length: Math.ceil(this.filteredProgressCards.length / this.pageSize) }, (_, i) => i + 1);
  }

  changePage(page: number) {
    if (page < 1 || page > this.pages.length) return;
    this.currentPage = page;
    this.updatePagination();
  }

  // ------------------- MODAL -------------------
  openAdd() {
    this.editId = null;
    this.progressCardForm.reset();
    this.teacherPreview = null;
    this.principalPreview = null;
    this.showModal = true;
  }

  openEdit(card: any) {
    this.editId = card.id;
    this.showModal = true;
    this.teacherPreview = card.teacher_signature ? 'https://s2swebsolutions.in/S2SWebSchool/public/' + card.teacher_signature : null;
    this.principalPreview = card.principal_signature ? 'https://s2swebsolutions.in/S2SWebSchool/public/' + card.principal_signature : null;

    this.loadBranchesBySchool(card.school_id);
    this.loadExamsByBranch(card.branch_id);
    this.loadStudentsBySchool(card.school_id);

    setTimeout(() => {
      this.progressCardForm.patchValue({
        school_id: card.school_id || '',
        branch_id: card.branch_id || '',
        class_id: card.class_id || '',
        exam_id: card.exam_id || '',
        student_id: card.student_id || '',
        total_marks: card.total_marks ? Number(card.total_marks) : '',
        obtained_marks: card.obtained_marks ? Number(card.obtained_marks) : '',
        percentage: card.percentage ? Number(card.percentage) : '',
        rank: card.rank ? Number(card.rank) : '',
        grade: card.grade || '',
        result_status: card.result_status || '',
        overall_remarks: card.overall_remarks || '',
        teacher_signature: null,
        principal_signature: null,
      });
    }, 100);
  }

  // ------------------- CALCULATE PERCENTAGE -------------------
  calculatePercentage() {
    const total = Number(this.progressCardForm.value.total_marks);
    const obtained = Number(this.progressCardForm.value.obtained_marks);
    if (total && obtained) {
      const percentage = ((obtained / total) * 100).toFixed(2);
      this.progressCardForm.patchValue({ percentage }, { emitEvent: false });
    }
  }

  // ------------------- SAVE -------------------
  save() {
    if (this.progressCardForm.invalid) {
      this.notify.error('All required fields are required');
      return;
    }

    this.loading = true;
    const formValue = this.progressCardForm.getRawValue();
    const payload = new FormData();

    payload.append('school_id', formValue.school_id);
    payload.append('branch_id', formValue.branch_id);
    payload.append('class_id', formValue.class_id);
    payload.append('exam_id', formValue.exam_id);
    payload.append('student_id', formValue.student_id);
    payload.append('total_marks', formValue.total_marks.toString());
    payload.append('obtained_marks', formValue.obtained_marks.toString());
    payload.append('percentage', formValue.percentage.toString());
    payload.append('rank', formValue.rank.toString());
    payload.append('grade', formValue.grade);
    payload.append('result_status', formValue.result_status);
    payload.append('overall_remarks', formValue.overall_remarks || '');

    // Append files if uploaded
    if (formValue.teacher_signature instanceof File) payload.append('teacher_signature', formValue.teacher_signature);
    if (formValue.principal_signature instanceof File) payload.append('principal_signature', formValue.principal_signature);

    const request$ = this.editId
      ? this.service.updateprogresscard(this.editId, payload)
      : this.service.createprogresscard(payload);

    request$.subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success(res.message || 'Progress card saved');
          this.showModal = false;
          this.loadProgressCards();
        } else this.notify.error(res.message || 'Operation failed');
        this.loading = false;
      },
      error: () => {
        this.notify.error('Server error');
        this.loading = false;
      },
    });
  }

  // ------------------- DELETE -------------------
  delete(id: string) {
    if (!confirm('Delete this progress card?')) return;
    this.service.deleteprogresscard(id).subscribe({
      next: (res: any) => {
        if (res.success) this.notify.success('Progress card deleted');
        this.loadProgressCards();
      },
      error: () => this.notify.error('Server error'),
    });
  }

  // ------------------- FILE UPLOAD -------------------
  onFileChange(event: any, type: 'teacher' | 'principal') {
    const file = event.target.files[0];
    if (!file) return;
    if (type === 'teacher') {
      this.progressCardForm.patchValue({ teacher_signature: file });
      this.teacherPreview = URL.createObjectURL(file);
    }
    if (type === 'principal') {
      this.progressCardForm.patchValue({ principal_signature: file });
      this.principalPreview = URL.createObjectURL(file);
    }
  }
}
