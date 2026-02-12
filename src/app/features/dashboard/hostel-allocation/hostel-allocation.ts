import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-hostel-allocation',
  imports: [ReactiveFormsModule,FormsModule,CommonModule],
  templateUrl: './hostel-allocation.html',
  styleUrl: './hostel-allocation.scss',
})
export class HostelAllocation {


  allocations: any[] = [];
  filteredAllocations: any[] = [];
  paginatedAllocations: any[] = [];

  pages: number[] = [];
  currentPage = 1;
  pageSize = 5;

  searchText = '';
  showModal = false;
  editId: string | null = null;
  loading = false;

  allocationForm!: FormGroup;

  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  ngOnInit() {
    this.allocationForm = this.fb.group({
      school_id: ['1', Validators.required],
      branch_id: ['1', Validators.required],
      room_id: ['', Validators.required],
      student_id: ['', Validators.required],
      allocation_date: ['', Validators.required],
      vacate_date: [''],
      allocation_status: ['allocated', Validators.required],
      remarks: ['']
    });

    this.loadAllocations();
  }

  /* ================= LOAD ================= */
  loadAllocations() {
    this.loading = true;

    this.service.getHostelAllocations().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.allocations = Array.isArray(res.data?.data)
            ? res.data.data
            : [];

          this.applyFilter();
        } else {
          this.notify.error('Failed to load allocations');
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

    this.filteredAllocations = this.allocations.filter(a =>
      a.student_id?.toString().includes(text) ||
      a.room_id?.toString().includes(text) ||
      a.allocation_status?.toLowerCase().includes(text)
    );

    this.currentPage = 1;
    this.updatePagination();
  }

  /* ================= PAGINATION ================= */
  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedAllocations = this.filteredAllocations.slice(start, end);

    const totalPages = Math.ceil(this.filteredAllocations.length / this.pageSize);
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

    this.allocationForm.reset({
      school_id: '1',
      branch_id: '1',
      allocation_status: 'allocated'
    });

    this.showModal = true;
  }

  openEdit(data: any) {
    this.editId = data.id;

    this.allocationForm.patchValue({
      ...data,
      allocation_date: data.allocation_date?.substring(0, 10),
      vacate_date: data.vacate_date ? data.vacate_date.substring(0, 10) : ''
    });

    this.showModal = true;
  }

  /* ================= SAVE ================= */
  save() {

    if (this.allocationForm.invalid) {
      this.notify.error('Please fill all required fields');
      return;
    }

    const formValue = this.allocationForm.value;

    const payload = {
      school_id: '1',
      branch_id: '1',
      room_id: formValue.room_id,
      student_id: formValue.student_id,
      allocation_date: formValue.allocation_date,
      vacate_date: formValue.vacate_date || null,
      allocation_status: formValue.allocation_status,
      remarks: formValue.remarks
    };

    this.loading = true;

    const request$ = this.editId
      ? this.service.updateHostelAllocation(this.editId, payload)
      : this.service.createHostelAllocation(payload);

    request$.subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success(this.editId ? 'Updated successfully' : 'Added successfully');
          this.showModal = false;
          this.loadAllocations();
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

  /* ================= DELETE ================= */
  delete(id: string) {
    if (!confirm('Delete this allocation?')) return;

    this.loading = true;

    this.service.deleteHostelAllocation(id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success('Deleted successfully');
          this.loadAllocations();
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
