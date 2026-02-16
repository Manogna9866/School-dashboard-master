import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-exam',
  imports: [ReactiveFormsModule,CommonModule,FormsModule],
  templateUrl: './exam.html',
  styleUrl: './exam.scss',
})
export class Exam {
exams: any[] = [];
  filteredExams: any[] = [];
  paginatedExams: any[] = [];

  schools: any[] = [];
  branches: any[] = [];
  classes: any[] = [];
  faculties: any[] = [];

  pages: number[] = [];
  currentPage = 1;
  pageSize = 5;
  searchText = '';

  showModal = false;
  editId: string | null = null;

  examForm!: FormGroup;

  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  ngOnInit() {
    this.examForm = this.fb.group({
      school_id: ['', Validators.required],
      branch_id: ['', Validators.required],
      class_id: ['', Validators.required],
      faculty_id: ['', Validators.required],
      exam_name: ['', Validators.required],
      exam_type: ['', Validators.required],
      term: ['', Validators.required],
      subject: ['', Validators.required],
      date_time: ['', Validators.required],
      total_marks: ['', Validators.required],
      passing_marks: ['', Validators.required],
      status: ['active', Validators.required],
    });

    this.loadSchools();
    this.loadClasses();
    this.loadFaculties();
    this.loadExams();

    // When school changes → load branches
    this.examForm.get('school_id')?.valueChanges.subscribe(schoolId => {
      if (schoolId) {
        this.loadBranchesBySchool(schoolId);
      } else {
        this.branches = [];
        this.examForm.patchValue({ branch_id: '' });
      }
    });
  }

  loadExams() {
    this.service.getExams().subscribe((res: any) => {
      if (res.success) {
        this.exams = res.data.data;
        this.applyFilter();
      } else this.notify.error('Failed to load exams');
    });
  }

  loadSchools() { this.service.getSchools().subscribe((res: any) => { this.schools = res.data?.data || []; }); }
  loadBranchesBySchool(schoolId: number) {
    this.service.getBranches().subscribe((res: any) => {
      this.branches = (res.data?.data || []).filter((b: any) => b.school_id == schoolId);
    });
  }
  loadClasses() { this.service.getClasses().subscribe((res: any) => { this.classes = res.data?.data || []; }); }
  loadFaculties() { this.service.getfaculties().subscribe((res: any) => { this.faculties = res.data?.data || []; }); }

  applyFilter() {
    const text = this.searchText.toLowerCase();
    this.filteredExams = this.exams.filter(e =>
      e.exam_name.toLowerCase().includes(text) ||
      e.subject.toLowerCase().includes(text)
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedExams = this.filteredExams.slice(start, end);

    const totalPages = Math.ceil(this.filteredExams.length / this.pageSize);
    this.pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  changePage(page: number) {
    if (page < 1 || page > this.pages.length) return;
    this.currentPage = page;
    this.updatePagination();
  }

  openAdd() {
    this.editId = null;
    this.branches = [];
    this.examForm.reset({ status: 'active' });
    this.showModal = true;
  }

  openEdit(exam: any) {
    this.editId = exam.id;
    this.showModal = true;
    this.loadBranchesBySchool(exam.school_id);
    this.examForm.patchValue(exam);
  }

  save() {
    if (this.examForm.invalid) return this.notify.error('Fill all required fields');

    const payload = { ...this.examForm.value };

    const request$ = this.editId
      ? this.service.updateExam(this.editId, payload)
      : this.service.createExam(payload);

    request$.subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success(this.editId ? 'Exam updated' : 'Exam created');
          this.showModal = false;
          this.searchText = '';
          this.loadExams();
        } else this.notify.error(res.message || 'Operation failed');
      }
    });
  }

  deleteExam(id: string) {
    if (!confirm('Delete this exam?')) return;
    this.service.deleteExam(id).subscribe((res: any) => {
      if (res.success) this.notify.success('Exam deleted');
      this.loadExams();
    });
  }
}
