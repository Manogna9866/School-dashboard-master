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
  transports: any[] = [];
  filteredTransports: any[] = [];
  paginatedTransports: any[] = [];

  pages: number[] = [];
  currentPage = 1;
  pageSize = 5;

  searchText = '';
  showModal = false;
  editId: string | null = null;
  loading = false;

  transportForm!: FormGroup;

  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  ngOnInit() {
    this.transportForm = this.fb.group({
      school_id: ['1', Validators.required],
      branch_id: ['1', Validators.required],
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


    this.loadTransport();
  }

  /* ================= LOAD ================= */
  loadTransport() {
    this.loading = true;

    this.service.getTransports().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.transports = Array.isArray(res.data?.data)
            ? res.data.data
            : [];

          this.applyFilter();
        } else {
          this.notify.error('Failed to load transport records');
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
      school_id: '1',
      branch_id: '1',
      transport_status: 'Active'
    });

    this.showModal = true;
  }


  openEdit(data: any) {
    this.editId = data.id;
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

    const formatTime = (time: string) => {
      if (!time) return null;
      return time.length === 5 ? time + ':00' : time;
      // if HH:mm → add seconds
      // if already HH:mm:ss → keep as is
    };

    const payload = {
      ...formValue,
      school_id: '1',
      branch_id: '1',
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
      error: (err) => {
        console.error(err);
        this.notify.error('Server error');
        this.loading = false;
      }
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
      error: () => {
        this.notify.error('Server error');
        this.loading = false;
      }
    });
  }
}
