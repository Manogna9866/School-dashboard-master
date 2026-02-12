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

  pages: number[] = [];
  currentPage = 1;
  pageSize = 5;

  searchText = '';
  showModal = false;
  editId: string | null = null;
  loading = false;

  feeForm!: FormGroup;

  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  ngOnInit() {
    this.feeForm = this.fb.group({
      school_id: ['1', Validators.required],
      branch_id: ['1', Validators.required],
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

    this.loadFees();
  }

  /* ================= LOAD ================= */
  loadFees() {
    this.loading = true;

    this.service.getfees().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.fees = Array.isArray(res.data?.data)
            ? res.data.data
            : [];

          this.applyFilter();
        } else {
          this.notify.error('Failed to load fee records');
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
    this.feeForm.reset({
      school_id: '1',
      branch_id: '1',
      is_installment: '0'
    });
    this.showModal = true;
  }

  openEdit(fee: any) {
    this.editId = fee.id;
    this.feeForm.patchValue(fee);
    this.showModal = true;
  }

  /* ================= SAVE ================= */
  save() {
    if (this.feeForm.invalid) {
      this.notify.error('Please fill all required fields');
      return;
    }

    const payload = this.feeForm.value;
    this.loading = true;

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
          this.notify.error('Operation failed');
        }
        this.loading = false;
      },
      error: () => {
        this.notify.error('Server error');
        this.loading = false;
      }
    });
  }

  /* ================= DELETE ================= */
  delete(id: string) {
    if (!confirm('Delete this fee record?')) return;

    this.loading = true;
    this.service.deletefee(id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success('Fee deleted');
          this.loadFees();
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
