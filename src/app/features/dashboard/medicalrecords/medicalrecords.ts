import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-medicalrecords',
  imports: [ReactiveFormsModule,FormsModule,CommonModule],
  templateUrl: './medicalrecords.html',
  styleUrl: './medicalrecords.scss',
})
export class Medicalrecords {
schools: any[] = [];
  branches: any[] = [];
  students: any[] = [];

  filteredBranches: any[] = [];
  filteredStudents: any[] = [];

  medicalRecords: any[] = [];
  filteredRecords: any[] = [];
  paginatedRecords: any[] = [];

  /* ================= PAGINATION ================= */
  pages: number[] = [];
  currentPage = 1;
  pageSize = 5;

  /* ================= UI STATE ================= */
  searchText = '';
  showModal = false;
  editId: string | null = null;
  loading = false;

  medicalForm!: FormGroup;

  /* ================= INJECTION ================= */
  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  /* ================= INIT ================= */
  ngOnInit() {
    this.medicalForm = this.fb.group({
      school_id: ['', Validators.required],
      branch_id: ['', Validators.required],
      student_id: ['', Validators.required],
      medical_date: ['', Validators.required],
      medical_issues: ['', Validators.required],
      severity: ['Mild', Validators.required],
      first_aid_given: ['', Validators.required],
      referred_to_hospital: ['No', Validators.required],
      guardian_notified: ['Yes', Validators.required],
      remarks: ['']
    });

    this.loadSchools();
    this.loadBranches();
    this.loadStudents();
    this.loadMedical();

    /* 🔥 SCHOOL CHANGE → FILTER BRANCHES */
    this.medicalForm.get('school_id')?.valueChanges.subscribe(schoolId => {
      if (!schoolId) {
        this.filteredBranches = [];
        this.filteredStudents = [];
        this.medicalForm.patchValue({ branch_id: '', student_id: '' });
        return;
      }

      this.filteredBranches = this.branches.filter(b => b.school_id == schoolId);
      this.filteredStudents = [];
      this.medicalForm.patchValue({ branch_id: '', student_id: '' });
    });

    /* 🔥 BRANCH CHANGE → FILTER STUDENTS */
    this.medicalForm.get('branch_id')?.valueChanges.subscribe(branchId => {
      if (!branchId) {
        this.filteredStudents = [];
        this.medicalForm.patchValue({ student_id: '' });
        return;
      }

      this.filteredStudents = this.students.filter(s => s.branch_id == branchId);
      this.medicalForm.patchValue({ student_id: '' });

      const selectedBranch = this.branches.find(b => b.id == branchId);
      if (selectedBranch) {
        this.medicalForm.patchValue({ school_id: selectedBranch.school_id }, { emitEvent: false });
      }
    });

    /* 🔥 STUDENT CHANGE → ENSURE SCHOOL & BRANCH */
    this.medicalForm.get('student_id')?.valueChanges.subscribe(studentId => {
      if (!studentId) return;

      const selectedStudent = this.students.find(s => s.id == studentId);
      if (selectedStudent) {
        this.medicalForm.patchValue({
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

  loadMedical() {
    this.loading = true;
    this.service.getMedicalRecords().subscribe({
      next: (res: any) => {
        this.medicalRecords = res.success && Array.isArray(res.data?.data) ? res.data.data : [];
        this.applyFilter();
        this.loading = false;
      },
      error: () => { this.notify.error('Server error'); this.loading = false; }
    });
  }

  /* ================= SEARCH ================= */
  applyFilter() {
    const text = this.searchText.toLowerCase();
    this.filteredRecords = this.medicalRecords.filter(m =>
      m.student_id?.toString().includes(text) ||
      m.medical_issues?.toLowerCase().includes(text) ||
      m.severity?.toLowerCase().includes(text) ||
      m.referred_to_hospital?.toLowerCase().includes(text)
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  /* ================= PAGINATION ================= */
  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedRecords = this.filteredRecords.slice(start, end);

    const totalPages = Math.ceil(this.filteredRecords.length / this.pageSize);
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
    this.medicalForm.reset({
      school_id: '',
      branch_id: '',
      student_id: '',
      severity: 'Mild',
      referred_to_hospital: 'No',
      guardian_notified: 'Yes'
    });
    this.filteredBranches = [];
    this.filteredStudents = [];
    this.showModal = true;
  }

  openEdit(data: any) {
    this.editId = data.id;

    this.filteredBranches = this.branches.filter(b => b.school_id == data.school_id);
    this.filteredStudents = this.students.filter(s => s.branch_id == data.branch_id);

    this.medicalForm.patchValue({
      ...data,
      medical_date: data.medical_date?.substring(0, 10)
    });
    this.showModal = true;
  }

  /* ================= SAVE ================= */
  save() {
    if (this.medicalForm.invalid) {
      this.notify.error('Please fill all required fields');
      return;
    }

    const formValue = this.medicalForm.value;
    const payload = {
      ...formValue,
      school_id: Number(formValue.school_id),
      branch_id: Number(formValue.branch_id),
      student_id: Number(formValue.student_id)
    };

    this.loading = true;
    const request$ = this.editId
      ? this.service.updateMedicalRecord(this.editId, payload)
      : this.service.createMedicalRecord(payload);

    request$.subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success(this.editId ? 'Medical updated' : 'Medical created');
          this.showModal = false;
          this.loadMedical();
        } else {
          this.notify.error(res.message || 'Operation failed');
        }
        this.loading = false;
      },
      error: () => { this.notify.error('Server error'); this.loading = false; }
    });
  }

  /* ================= DELETE ================= */
  delete(id: string) {
    if (!confirm('Delete this medical record?')) return;
    this.loading = true;

    this.service.deleteMedicalRecord(id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success('Medical deleted');
          this.loadMedical();
        } else {
          this.notify.error('Delete failed');
        }
        this.loading = false;
      },
      error: () => { this.notify.error('Server error'); this.loading = false; }
    });
  }

}
