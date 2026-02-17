import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-modules',
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './modules.html',
  styleUrl: './modules.scss',
})
export class Modules {
    schools: any[] = [];
  branches: any[] = [];
  students: any[] = [];

  filteredBranches: any[] = [];
  filteredStudents: any[] = [];

  modules: any[] = [];
  filteredModules: any[] = [];
  paginatedModules: any[] = [];

  /* ================= PAGINATION ================= */
  currentPage = 1;
  pageSize = 6;
  pages: number[] = [];

  /* ================= UI ================= */
  searchText = '';
  showModal = false;
  editId: number | null = null;

  moduleForm!: FormGroup;

  /* ================= SERVICES ================= */
  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  ngOnInit() {
    this.moduleForm = this.fb.group({
      school_id: ['', Validators.required],
      branch_id: ['', Validators.required],
      student_id: ['', Validators.required],
      module_key: ['', Validators.required],
      module_name: ['', Validators.required],
      description: [''],
      status: ['active']
    });

    // Load data
    this.loadSchools();
    this.loadBranches();
    this.loadStudents();
    this.loadModules();

    // 🔥 SCHOOL CHANGE → FILTER BRANCHES
    this.moduleForm.get('school_id')?.valueChanges.subscribe(schoolId => {
      if (!schoolId) {
        this.filteredBranches = [];
        this.filteredStudents = [];
        this.moduleForm.patchValue({ branch_id: '', student_id: '' });
        return;
      }
      this.filteredBranches = this.branches.filter(b => b.school_id == schoolId);
      this.filteredStudents = [];
      this.moduleForm.patchValue({ branch_id: '', student_id: '' });
    });

    // 🔥 BRANCH CHANGE → FILTER STUDENTS
    this.moduleForm.get('branch_id')?.valueChanges.subscribe(branchId => {
      if (!branchId) {
        this.filteredStudents = [];
        this.moduleForm.patchValue({ student_id: '' });
        return;
      }
      this.filteredStudents = this.students.filter(s => s.branch_id == branchId);
      this.moduleForm.patchValue({ student_id: '' });

      const selectedBranch = this.branches.find(b => b.id == branchId);
      if (selectedBranch) {
        this.moduleForm.patchValue({ school_id: selectedBranch.school_id }, { emitEvent: false });
      }
    });

    // 🔥 STUDENT CHANGE → ENSURE SCHOOL & BRANCH
    this.moduleForm.get('student_id')?.valueChanges.subscribe(studentId => {
      if (!studentId) return;
      const selectedStudent = this.students.find(s => s.id == studentId);
      if (selectedStudent) {
        this.moduleForm.patchValue({
          school_id: selectedStudent.school_id,
          branch_id: selectedStudent.branch_id
        }, { emitEvent: false });
      }
    });
  }

  /* ================= LOAD DATA ================= */
  loadSchools() {
    this.service.getSchools().subscribe({
      next: (res: any) => this.schools = res.success && res.data?.data ? res.data.data : [],
      error: () => this.notify.error('Failed to load schools')
    });
  }

  loadBranches() {
    this.service.getBranches().subscribe({
      next: (res: any) => this.branches = res.success && res.data?.data ? res.data.data : [],
      error: () => this.notify.error('Failed to load branches')
    });
  }

  loadStudents() {
    this.service.getstudents().subscribe({
      next: (res: any) => this.students = res.success && res.data?.data ? res.data.data : [],
      error: () => this.notify.error('Failed to load students')
    });
  }

  loadModules() {
    this.service.getModules().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.modules = res.data?.data || [];
          this.applyFilter();
        }
      },
      error: () => this.notify.error('Failed to load modules')
    });
  }

  /* ================= SEARCH ================= */
  applyFilter() {
    const text = this.searchText.toLowerCase();
    this.filteredModules = this.modules.filter(m =>
      m.module_name.toLowerCase().includes(text) ||
      m.module_key.toLowerCase().includes(text)
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  /* ================= PAGINATION ================= */
  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedModules = this.filteredModules.slice(start, end);

    const totalPages = Math.ceil(this.filteredModules.length / this.pageSize);
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
    this.moduleForm.reset({ status: 'active', school_id: '', branch_id: '', student_id: '' });
    this.filteredBranches = [];
    this.filteredStudents = [];
    this.showModal = true;
  }

  openEdit(item: any) {
    this.editId = Number(item.id);

    this.filteredBranches = this.branches.filter(b => b.school_id == item.school_id);
    this.filteredStudents = this.students.filter(s => s.branch_id == item.branch_id);

    this.moduleForm.patchValue(item);
    this.showModal = true;
  }

  /* ================= SAVE ================= */
  save() {
    if (this.moduleForm.invalid) {
      this.notify.error('Please fill required fields');
      return;
    }

    const formValue = this.moduleForm.value;

    const payload = {
      ...formValue,
      school_id: Number(formValue.school_id),
      branch_id: Number(formValue.branch_id),
      student_id: Number(formValue.student_id)
    };

    console.log('Payload being sent:', payload); // ✅ Debug payload

    const request$ = this.editId
      ? this.service.updateModules(this.editId.toString(), payload)
      : this.service.createModules(payload);

    request$.subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success(this.editId ? 'Updated' : 'Created');
          this.showModal = false;
          this.loadModules();
        } else {
          console.error('API returned error:', res);
          this.notify.error(res.message || 'Failed to create/update module');
        }
      },
      error: (err) => {
        console.error('HTTP Error:', err);
        this.notify.error(err.error?.message || 'Server error');
      }
    });
  }

  /* ================= DELETE ================= */
  delete(id: number) {
    if (!confirm('Delete this module?')) return;
    this.service.deleteModules(id.toString()).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success('Deleted');
          this.loadModules();
        }
      },
      error: (err) => {
        console.error('HTTP Error on delete:', err);
        this.notify.error('Failed to delete module');
      }
    });
  }
}
