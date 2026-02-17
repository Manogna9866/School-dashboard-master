import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-subjects',
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './subjects.html',
  styleUrl: './subjects.scss',
})
export class Subjects {
  subjects: any[] = [];
  filteredSubjects: any[] = [];
  paginatedSubjects: any[] = [];

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

  subjectForm!: FormGroup;

  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  ngOnInit() {
    this.subjectForm = this.fb.group({
      school_id: ['', Validators.required],
      branch_id: ['', Validators.required],
      class_id: ['', Validators.required],
      faculty_id: ['', Validators.required],
      name: ['', Validators.required],
      code: ['', Validators.required],
      sub_type: ['', Validators.required],
      passing_marks: ['', [Validators.required, Validators.min(0)]],
      max_marks: ['', [Validators.required, Validators.min(1)]],
    });

    this.loadSchools();
    this.loadClasses();
    this.loadFaculties();
    this.loadSubjects();

    // Load branches dynamically when school changes
    this.subjectForm.get('school_id')?.valueChanges.subscribe(schoolId => {
      if (schoolId) {
        this.loadBranchesBySchool(schoolId);
      } else {
        this.branches = [];
        this.subjectForm.patchValue({ branch_id: '' });
      }
    });
  }

  /** ================= LOAD DATA ================= */
  loadSubjects() {
    this.service.getSubjects().subscribe((res: any) => {
      if (res.success) {
        this.subjects = res.data.data;
        this.applyFilter();
      } else this.notify.error('Failed to load subjects');
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

  /** ================= SEARCH & PAGINATION ================= */
  applyFilter() {
    const text = this.searchText.toLowerCase();
    this.filteredSubjects = this.subjects.filter(s =>
      s.name.toLowerCase().includes(text) ||
      s.code.toLowerCase().includes(text)
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedSubjects = this.filteredSubjects.slice(start, end);

    const totalPages = Math.ceil(this.filteredSubjects.length / this.pageSize);
    this.pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  changePage(page: number) {
    if (page < 1 || page > this.pages.length) return;
    this.currentPage = page;
    this.updatePagination();
  }

  /** ================= MODAL ================= */
  openAdd() {
    this.editId = null;
    this.branches = [];
    this.subjectForm.reset();
    this.showModal = true;
  }

  openEdit(subject: any) {
    this.editId = subject.id;
    this.loadBranchesBySchool(subject.school_id);
    this.subjectForm.patchValue(subject);
    this.showModal = true;
  }

  /** ================= SAVE ================= */
  save() {
    if (this.subjectForm.invalid) return this.notify.error('Fill all required fields');

    const payload = { ...this.subjectForm.value };

    const request$ = this.editId
      ? this.service.updatesubject(this.editId, payload)
      : this.service.createsubject(payload);

    request$.subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success(this.editId ? 'Subject updated' : 'Subject created');
          this.showModal = false;
          this.searchText = '';
          this.loadSubjects();
        } else this.notify.error(res.message || 'Operation failed');
      }
    });
  }

  deleteSubject(id: string) {
    if (!confirm('Delete this subject?')) return;
    this.service.deletesubject(id).subscribe((res: any) => {
      if (res.success) this.notify.success('Subject deleted');
      this.loadSubjects();
    });
  }
}
