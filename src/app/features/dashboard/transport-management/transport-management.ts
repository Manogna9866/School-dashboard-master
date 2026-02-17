import { Component, inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-transport-management',
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './transport-management.html',
  styleUrl: './transport-management.scss',
})
export class TransportManagement {
  schools: any[] = [];
  branches: any[] = [];
  students: any[] = [];

  filteredBranches: any[] = [];
  filteredStudents: any[] = [];

  transports: any[] = [];
  filteredTransports: any[] = [];
  paginatedTransports: any[] = [];

  /* ================= PAGINATION ================= */
  pages: number[] = [];
  currentPage = 1;
  pageSize = 5;

  /* ================= UI STATE ================= */
  searchText = '';
  showModal = false;
  editId: string | null = null;
  loading = false;

  transportForm!: FormGroup;

  /* ================= INJECTION ================= */
  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  /* ================= INIT ================= */
  ngOnInit() {

    this.transportForm = this.fb.group({
      school_id: ['', Validators.required],
      branch_id: ['', Validators.required],
      student_id: ['', Validators.required],
      route_number: ['', Validators.required],
      bus_number: ['', Validators.required],
      driver_name: ['', Validators.required],
      driver_contact: ['', Validators.required],
      pickup_point: ['', Validators.required],
      drop_point: ['', Validators.required],
      pickup_time: ['', Validators.required],
      drop_time: ['', Validators.required],
      transport_fee: ['', Validators.required],
      transport_status: ['Active', Validators.required],
      remarks: ['']
    });

    this.loadSchools();
    this.loadBranches();
    this.loadStudents();
    this.loadTransport();

    /* 🔥 SCHOOL CHANGE → FILTER BRANCHES */
    this.transportForm.get('school_id')?.valueChanges.subscribe(schoolId => {
      if (!schoolId) {
        this.filteredBranches = [];
        this.filteredStudents = [];
        this.transportForm.patchValue({ branch_id: '', student_id: '' });
        return;
      }

      this.filteredBranches = this.branches.filter(b => b.school_id == schoolId);
      this.filteredStudents = [];
      this.transportForm.patchValue({ branch_id: '', student_id: '' });
    });

    /* 🔥 BRANCH CHANGE → FILTER STUDENTS */
    this.transportForm.get('branch_id')?.valueChanges.subscribe(branchId => {
      if (!branchId) {
        this.filteredStudents = [];
        this.transportForm.patchValue({ student_id: '' });
        return;
      }

      this.filteredStudents = this.students.filter(s => s.branch_id == branchId);
      this.transportForm.patchValue({ student_id: '' });

      const selectedBranch = this.branches.find(b => b.id == branchId);
      if (selectedBranch) {
        this.transportForm.patchValue({ school_id: selectedBranch.school_id }, { emitEvent: false });
      }
    });

    /* 🔥 STUDENT CHANGE → ENSURE SCHOOL & BRANCH */
    this.transportForm.get('student_id')?.valueChanges.subscribe(studentId => {
      if (!studentId) return;

      const selectedStudent = this.students.find(s => s.id == studentId);
      if (selectedStudent) {
        this.transportForm.patchValue({
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

  loadTransport() {
    this.loading = true;
    this.service.getTransports().subscribe({
      next: (res: any) => {
        this.transports = res.success && Array.isArray(res.data?.data) ? res.data.data : [];
        this.applyFilter();
        this.loading = false;
      },
      error: () => { this.notify.error('Server error'); this.loading = false; }
    });
  }

  /* ================= SEARCH ================= */
  applyFilter() {
    const text = this.searchText.toLowerCase();
    this.filteredTransports = this.transports.filter(t =>
      t.student_id?.toString().includes(text) ||
      t.route_number?.toLowerCase().includes(text) ||
      t.bus_number?.toLowerCase().includes(text) ||
      t.driver_name?.toLowerCase().includes(text) ||
      t.transport_status?.toLowerCase().includes(text)
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  /* ================= PAGINATION ================= */
  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedTransports = this.filteredTransports.slice(start, end);

    const totalPages = Math.ceil(this.filteredTransports.length / this.pageSize);
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
    this.transportForm.reset({
      school_id: '',
      branch_id: '',
      student_id: '',
      transport_status: 'Active'
    });
    this.filteredBranches = [];
    this.filteredStudents = [];
    this.showModal = true;
  }

  openEdit(data: any) {
    this.editId = data.id;

    this.filteredBranches = this.branches.filter(b => b.school_id == data.school_id);
    this.filteredStudents = this.students.filter(s => s.branch_id == data.branch_id);

    this.transportForm.patchValue(data);
    this.showModal = true;
  }

  /* ================= SAVE ================= */
  save() {
    if (this.transportForm.invalid) {
      this.notify.error('Please fill all required fields');
      return;
    }

    const formValue = this.transportForm.value;
    const formatTime = (time: string) => time?.length === 5 ? time + ':00' : time;

    const payload = {
      ...formValue,
      school_id: Number(formValue.school_id),
      branch_id: Number(formValue.branch_id),
      student_id: Number(formValue.student_id),
      pickup_time: formatTime(formValue.pickup_time),
      drop_time: formatTime(formValue.drop_time),
      transport_fee: parseFloat(formValue.transport_fee)
    };

    this.loading = true;

    const request$ = this.editId
      ? this.service.updateTransport(this.editId, payload)
      : this.service.createTransport(payload);

    request$.subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success(this.editId ? 'Transport updated' : 'Transport created');
          this.showModal = false;
          this.loadTransport();
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
    if (!confirm('Delete this transport record?')) return;
    this.loading = true;

    this.service.deleteTransport(id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success('Transport deleted');
          this.loadTransport();
        } else {
          this.notify.error('Delete failed');
        }
        this.loading = false;
      },
      error: () => { this.notify.error('Server error'); this.loading = false; }
    });
  }
}
