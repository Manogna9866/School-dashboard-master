import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotifyService } from '../../../core/services/notify';
import { Auth } from '../../../layouts/auth/auth';
import { AuthService } from '../../../core/auth/auth';

@Component({
  selector: 'app-fee-management',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './fee-management.html',
  styleUrl: './fee-management.scss',
})
export class FeeManagement {
  fees: any[] = [];
  filteredFees: any[] = [];
  paginatedFees: any[] = [];

  /* ================= MASTER DATA ================= */
  schools: any[] = [];
  branches: any[] = [];
  classes: any[] = [];
  students: any[] = [];

  filteredBranches: any[] = [];
  filteredClasses: any[] = [];
  filteredStudents: any[] = [];

  /* ================= PAGINATION ================= */
  pages: number[] = [];
  currentPage = 1;
  pageSize = 5;

  /* ================= UI STATE ================= */
  searchText = '';
  showModal = false;
  editId: string | null = null;
  loading = false;

  /* ================= FORM ================= */
  feeForm!: FormGroup;

  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  /* ================= INIT ================= */
  ngOnInit() {
    this.initForm();
    this.loadMasters();
    this.loadFees();
    this.setupDropdownListeners();
  }

  initForm() {
    this.feeForm = this.fb.group({
      school_id: ['', Validators.required],
      branch_id: ['', Validators.required],
      academic_year: ['', Validators.required],
      class_id: ['', Validators.required],
      student_id: ['', Validators.required],
      fee_type: ['', Validators.required],
      installment_no: [''],
      is_installment: ['0'],
      amount_due: ['', Validators.required],
      amount_paid: ['0'],
      discount: ['0'],
      late_fee: ['0'],
      due_date: ['', Validators.required],
      payment_date: [''],
      payment_status: ['', Validators.required],
      payment_method: [''],
      transaction_id: [''],
      receipt_number: [''],
      remarks: ['']
    });
  }

  /* ================= LOAD MASTER DATA ================= */

  loadMasters() {
    this.loadSchools();
    this.loadBranches();
    this.loadClasses();
    this.loadStudents();
  }

  loadSchools() {
    this.service.getSchools().subscribe((res: any) => {
      this.schools = res.data?.data || [];
    });
  }

  loadBranches() {
    this.service.getBranches().subscribe((res: any) => {
      this.branches = res.data?.data || [];
    });
  }

  loadClasses() {
    this.service.getClasses().subscribe((res: any) => {
      this.classes = res.data?.data || [];
    });
  }

  loadStudents() {
    this.service.getstudents().subscribe((res: any) => {
      this.students = res.data?.data || [];
    });
  }

  /* ================= CASCADING DROPDOWNS ================= */

  setupDropdownListeners() {

    // School → Branch
    this.feeForm.get('school_id')?.valueChanges.subscribe(schoolId => {
      this.filteredBranches = this.branches.filter(
        b => b.school_id == schoolId
      );

      this.filteredClasses = [];
      this.filteredStudents = [];

      this.feeForm.patchValue({
        branch_id: '',
        class_id: '',
        student_id: ''
      });
    });

    // Branch → Class
    this.feeForm.get('branch_id')?.valueChanges.subscribe(branchId => {
      this.filteredClasses = this.classes.filter(
        c => c.branch_id == branchId
      );

      this.filteredStudents = [];

      this.feeForm.patchValue({
        class_id: '',
        student_id: ''
      });
    });

    // Class → Student
    this.feeForm.get('class_id')?.valueChanges.subscribe(classId => {
      this.filteredStudents = this.students.filter(
        s => s.class_id == classId
      );

      this.feeForm.patchValue({
        student_id: ''
      });
    });
  }

  /* ================= LOAD FEES ================= */

  loadFees() {
    this.loading = true;

    this.service.getfees().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.fees = res.data?.data || [];
          this.applyFilter();
        } else {
          this.notify.error('Failed to load fees');
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

    this.filteredFees = this.fees.filter(f =>
      f.fee_type?.toLowerCase().includes(text) ||
      f.student_id?.toString().includes(text) ||
      f.receipt_number?.toLowerCase().includes(text) ||
      f.payment_status?.toLowerCase().includes(text)
    );

    this.currentPage = 1;
    this.updatePagination();
  }

  /* ================= PAGINATION ================= */

  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedFees = this.filteredFees.slice(start, end);

    const totalPages = Math.ceil(this.filteredFees.length / this.pageSize);
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
    this.filteredBranches = [];
    this.filteredClasses = [];
    this.filteredStudents = [];

    this.feeForm.reset({
      is_installment: '0',
      amount_paid: '0',
      discount: '0',
      late_fee: '0'
    });

    this.showModal = true;
  }


  openEdit(fee: any) {
    this.editId = fee.id;

    // Load dependent dropdowns
    this.filteredBranches = this.branches.filter(
      b => b.school_id == fee.school_id
    );

    this.filteredClasses = this.classes.filter(
      c => c.branch_id == fee.branch_id
    );

    this.filteredStudents = this.students.filter(
      s => s.class_id == fee.class_id
    );

    this.feeForm.patchValue(fee);
    this.showModal = true;
  }

  /* ================= SAVE ================= */

  save() {
    console.log('Form Valid:', this.feeForm.valid);
    console.log('Form Value:', this.feeForm.value);
    if (this.feeForm.invalid) {
      this.notify.error('Please fill all required fields');
      return;
    }
    console.log('Submitting...');
    const payload = { ...this.feeForm.value };

    const request$ = this.editId
      ? this.service.updatefee(this.editId, payload)
      : this.service.createfee(payload);

    request$.subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success(this.editId ? 'Fee updated' : 'Fee created');
          this.showModal = false;
          this.searchText = '';
          this.loadFees();
        } else {
          this.notify.error(res.message || 'Operation failed');
        }
      },
      error: () => this.notify.error('Server error')
    });
  }

  /* ================= DELETE ================= */

  delete(id: string) {
    if (!confirm('Delete this fee record?')) return;

    this.service.deletefee(id).subscribe((res: any) => {
      if (res.success) {
        this.notify.success('Fee deleted');
        this.loadFees();
      } else {
        this.notify.error('Delete failed');
      }
    });
  }
}
