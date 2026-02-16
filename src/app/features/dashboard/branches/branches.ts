import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-branches',
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './branches.html',
  styleUrl: './branches.scss',
})
export class Branches {
  branches: any[] = [];
  filteredBranches: any[] = [];
  paginatedBranches: any[] = [];
  schools: any[] = [];

  /* ================= PAGINATION ================= */
  pages: number[] = [];
  currentPage = 1;
  pageSize = 5;

  /* ================= UI ================= */
  searchText = '';
  showModal = false;
  editId: string | null = null;
  loading = false;

  /* ================= FORM ================= */
  branchForm!: FormGroup;

  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  /* ================= INIT ================= */
  ngOnInit() {
    this.branchForm = this.fb.group({
      school_id: ['', Validators.required],
      branch_code: ['', Validators.required],
      branch_name: ['', Validators.required],
      principal_name: ['', Validators.required],
      contact_email: ['', [Validators.required, Validators.email]],
      contact_phone: ['', Validators.required],
      established_year: [''],   // ✅ ADD THIS
      address: ['', Validators.required],
      remarks: [''],            // ✅ ADD THIS
      status: ['active', Validators.required],
    });

    this.loadSchools();
    this.loadBranches();
  }

  /* ================= LOAD ================= */
  loadBranches() {
    this.loading = true;

    this.service.getBranches().subscribe({
      next: (res: any) => {
        if (res.success) {

          // ✅ SAFE HANDLING FOR ALL API SHAPES
          if (Array.isArray(res.data)) {
            this.branches = res.data;
          } else if (Array.isArray(res.data?.data)) {
            this.branches = res.data.data;
          } else if (typeof res.data === 'object' && res.data !== null) {
            this.branches = [res.data];
          } else {
            this.branches = [];
          }

          this.applyFilter();
        } else {
          this.notify.error('Failed to load branches');
        }

        this.loading = false;
      },
      error: () => {
        this.notify.error('Server error');
        this.loading = false;
      }
    });
  }
  loadSchools() {
    this.service.getSchools().subscribe({
      next: (res: any) => {
        console.log("Schools API:", res);

        if (res.success && res.data?.data) {
          this.schools = res.data.data;
        } else {
          this.schools = [];
        }

        console.log("Schools array:", this.schools);
      },
      error: (err) => {
        console.error("School API error:", err);
        this.notify.error('Failed to load schools');
      }
    });
  }


  /* ================= SEARCH ================= */
  applyFilter() {
    if (!Array.isArray(this.branches)) {
      this.filteredBranches = [];
      this.paginatedBranches = [];
      return;
    }

    const text = this.searchText.toLowerCase();

    this.filteredBranches = this.branches.filter(b =>
      (b.branch_name || '').toLowerCase().includes(text) ||
      (b.branch_code || '').toLowerCase().includes(text) ||
      (b.principal_name || '').toLowerCase().includes(text)
    );

    this.currentPage = 1;
    this.updatePagination();
  }

  /* ================= PAGINATION ================= */
  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedBranches = this.filteredBranches.slice(start, end);

    const totalPages = Math.ceil(this.filteredBranches.length / this.pageSize);
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
    this.branchForm.reset({
      status: 'active'
    });
    this.showModal = true;
  }


  openEdit(branch: any) {
    this.editId = branch.id;
    this.branchForm.patchValue(branch);
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  /* ================= SAVE ================= */
  save() {
    if (this.branchForm.invalid) {
      this.notify.error('All fields are required');
      return;
    }

    const payload = {
      ...this.branchForm.value,
      school_id: Number(this.branchForm.value.school_id)
    };

    console.log("Sending payload:", payload);

    const request$ = this.editId
      ? this.service.updateBranch(this.editId, payload)
      : this.service.createBranch(payload);

    request$.subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success(this.editId ? 'Branch updated' : 'Branch created');
          this.showModal = false;
          this.loadBranches();
        } else {
          this.notify.error(res.message || 'Operation failed');
        }
      }
    });
  }


  /* ================= DELETE ================= */
  delete(id: string) {
    if (!confirm('Delete this branch?')) return;

    this.loading = true;
    this.service.deleteBranch(id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success('Branch deleted');
          this.loadBranches();
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
