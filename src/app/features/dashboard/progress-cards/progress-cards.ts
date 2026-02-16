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
  schools: any[] = [];
  branches: any[] = [];
  classes: any[] = [];
  students: any[] = [];
  exams: any[] = [];

  // Progress cards
  progressCards: any[] = [];
  filteredProgressCards: any[] = [];
  paginatedProgressCards: any[] = [];

  // Pagination
  pages: number[] = [];
  currentPage = 1;
  pageSize = 5;
  searchText = '';

  // Modal & Form
  showModal = false;
  editId: string | null = null;
  loading = false;
  progressCardForm!: FormGroup;

  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  ngOnInit() {
    this.initForm();
    this.loadMasterData();
    this.loadProgressCards();

    // Auto calculate percentage
    this.progressCardForm.valueChanges.subscribe(() => this.calculatePercentage());

    // Cascading dropdowns
    this.progressCardForm.get('school_id')?.valueChanges.subscribe((schoolId: string) => {
      this.progressCardForm.patchValue({ branch_id: '', class_id: '', exam_id: '', student_id: '' }, { emitEvent: false });
      if (schoolId) {
        this.loadBranchesBySchool(schoolId);
        this.loadStudentsBySchool(schoolId);
      } else {
        this.branches = [];
        this.students = [];
      }
    });

    this.progressCardForm.get('branch_id')?.valueChanges.subscribe((branchId: string) => {
      this.progressCardForm.patchValue({ exam_id: '', student_id: '' }, { emitEvent: false });
      if (branchId) this.loadExamsByBranch(branchId);
      else this.exams = [];
    });

    this.progressCardForm.get('class_id')?.valueChanges.subscribe((classId: string) => {
      this.progressCardForm.patchValue({ student_id: '' }, { emitEvent: false });
      if (classId) this.loadStudentsByClass(classId);
      else this.students = [];
    });

    this.progressCardForm.get('exam_id')?.valueChanges.subscribe((examId: string) => {
      this.progressCardForm.patchValue({ student_id: '' }, { emitEvent: false });
      if (examId) this.loadStudentsByExam(examId);
      else this.students = [];
    });
  }

  // ------------------ FORM ------------------
  private initForm() {
    this.progressCardForm = this.fb.group({
      school_id: ['', Validators.required],
      branch_id: ['', Validators.required],
      class_id: ['', Validators.required],
      exam_id: ['', Validators.required],
      student_id: ['', Validators.required],
      total_marks: ['', Validators.required],
      obtained_marks: ['', Validators.required],
      percentage: [''],
      rank: ['', Validators.required],
      grade: ['', Validators.required],
      result_status: ['', Validators.required],
      overall_remarks: [''],
      teacher_signature: [''],
      principal_signature: [''],
    });
    
  }

  // ------------------ MASTER DATA ------------------
  private loadMasterData() {
    this.loadSchools();
    this.loadBranches();
    this.loadClasses();
   
    this.loadStudents();
    this.progressCardForm.get('branch_id')?.valueChanges.subscribe((branchId) => {
      if (branchId) {
        this.loadExamsByBranch(branchId);
        this.progressCardForm.patchValue({ exam_id: '' }, { emitEvent: false });
      } else {
        this.exams = [];
      }
    });
    
  }

  loadSchools() {
    this.service.getSchools().subscribe(res => this.schools = res?.success ? res.data?.data || [] : []);
  }

  loadBranches() {
    this.service.getBranches().subscribe(res => this.branches = res?.success ? res.data?.data || [] : []);
  }

  

  loadClasses() {
    this.service.getClasses().subscribe(res => this.classes = res?.success ? res.data?.data || [] : []);
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

  
 loadBranchesBySchool(schoolId: number) {
    this.service.getBranches().subscribe((res: any) => {
      this.branches = (res.data?.data || []).filter((b: any) => b.school_id == schoolId);
    });
  }

  loadStudents() {
    this.service.getstudents().subscribe(res => this.students = res?.success ? res.data?.data || [] : []);
  }

  loadStudentsBySchool(schoolId: string) {
    const sId = Number(schoolId);
    this.service.getstudents().subscribe(res => {
      const allStudents = res?.success ? res.data?.data || [] : [];
      this.students = allStudents.filter((s: any) => Number(s.school_id) === sId);
    });
  }

  loadStudentsByClass(classId: string) {
    const cId = Number(classId);
    this.service.getstudents().subscribe(res => {
      const allStudents = res?.success ? res.data?.data || [] : [];
      this.students = allStudents.filter((s: any) => Number(s.class_id) === cId);
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

  // ------------------ PROGRESS CARDS ------------------
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
      }
    });
  }

  // ------------------ SEARCH & PAGINATION ------------------
  applyFilter() {
    const text = this.searchText.toLowerCase();
    this.filteredProgressCards = this.progressCards.filter(p =>
      p.student_id.toString().includes(text) ||
      p.exam_id.toString().includes(text) ||
      p.class_id.toString().includes(text) ||
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

  // ------------------ MODAL ------------------
  openAdd() {
    this.editId = null;
    this.progressCardForm.reset({
      school_id: '', branch_id: '', class_id: '', exam_id: '', student_id: '', teacher_signature: '', principal_signature: ''
    });
    this.showModal = true;
  }

  openEdit(card: any) {
    this.editId = card.id;
    this.loadBranchesBySchool(card.school_id);
    this.loadExamsByBranch(card.branch_id);
    this.loadStudentsByExam(card.exam_id);
    this.progressCardForm.patchValue({
      ...card,
      teacher_signature: card.teacher_signature || '',
      principal_signature: card.principal_signature || ''
    });
    this.showModal = true;
  }

  // ------------------ CALCULATION ------------------
  calculatePercentage() {
    const total = this.progressCardForm.value.total_marks;
    const obtained = this.progressCardForm.value.obtained_marks;
    if (total && obtained) {
      const percentage = ((obtained / total) * 100).toFixed(2);
      this.progressCardForm.patchValue({ percentage }, { emitEvent: false });
    }
  }

  // ------------------ SAVE ------------------
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
            school_id: '', branch_id: '', class_id: '', exam_id: '', student_id: '', teacher_signature: '', principal_signature: ''
          });
          this.loadProgressCards();
        } else {
          this.notify.error(res.message || 'Operation failed');
        }
        this.loading = false;
      },
      error: () => {
        this.notify.error('Server error');
        this.loading = false;
      }
    });
  }

  // ------------------ DELETE ------------------
  delete(id: string) {
    if (!confirm('Delete this progress card?')) return;
    this.loading = true;
    this.service.deleteprogresscard(id).subscribe({
      next: (res: any) => {
        if (res.success) this.notify.success('Progress card deleted');
        this.loadProgressCards();
        this.loading = false;
      },
      error: () => {
        this.notify.error('Server error');
        this.loading = false;
      }
    });
  }

  // ------------------ FILE UPLOAD ------------------
  onFileChange(event: any, type: 'teacher' | 'principal') {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (type === 'teacher') this.progressCardForm.patchValue({ teacher_signature: reader.result });
      if (type === 'principal') this.progressCardForm.patchValue({ principal_signature: reader.result });
    };
    reader.readAsDataURL(file);
  }
}
