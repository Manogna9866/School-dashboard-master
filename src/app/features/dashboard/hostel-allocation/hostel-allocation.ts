import { filter } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-hostel-allocation',
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './hostel-allocation.html',
  styleUrl: './hostel-allocation.scss',
})
export class HostelAllocation {
  schools: any[] = [];
  branches: any[] = [];
  rooms: any[] = [];
  students: any[] = [];

  filteredBranches: any[] = [];
  filteredRooms: any[] = [];
  filteredStudents: any[] = [];

  /* ================= TABLE DATA ================= */

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

  /* ================= INIT ================= */

  ngOnInit() {

    this.allocationForm = this.fb.group({
      school_id: ['', Validators.required],
      branch_id: ['', Validators.required],
      room_id: ['', Validators.required],
      student_id: ['', Validators.required],
      allocation_date: ['', Validators.required],
      vacate_date: [''],
      allocation_status: ['allocated', Validators.required],
      remarks: ['']
    });

    this.loadSchools();
    this.loadBranches();
    this.loadRooms();
    this.loadStudents();
    this.loadAllocations();

    /* 🔥 SCHOOL CHANGE → FILTER BRANCH */
    this.allocationForm.get('school_id')?.valueChanges.subscribe(schoolId => {

      if (!schoolId) {
        this.filteredBranches = [];
        this.filteredRooms = [];
        this.filteredStudents = [];
        return;
      }

      this.filteredBranches = this.branches.filter(
        (b: any) => b.school_id == schoolId
      );

      this.allocationForm.patchValue({
        branch_id: '',
        room_id: '',
        student_id: ''
      });
    });

    /* 🔥 BRANCH CHANGE → FILTER ROOM + STUDENTS */
    this.allocationForm.get('branch_id')?.valueChanges.subscribe(branchId => {

      if (!branchId) return;

      this.filteredRooms = this.rooms.filter(
        (r: any) => r.branch_id == branchId
      );

      this.filteredStudents = this.students.filter(
        (s: any) => s.branch_id == branchId
      );

      this.allocationForm.patchValue({
        room_id: '',
        student_id: ''
      });
    });
  }

  /* ================= LOAD METHODS ================= */

  loadSchools() {
    this.service.getSchools().subscribe({
      next: (res: any) => {
        this.schools = res.success && res.data?.data ? res.data.data : [];
      },
      error: () => this.notify.error('Failed to load schools')
    });
  }

  loadBranches() {
    this.service.getBranches().subscribe({
      next: (res: any) => {
        this.branches = res.success && res.data?.data ? res.data.data : [];
      },
      error: () => this.notify.error('Failed to load branches')
    });
  }

  loadRooms() {
    this.service.getHostelRooms().subscribe({
      next: (res: any) => {
        this.rooms = res.success && res.data?.data ? res.data.data : [];
      },
      error: () => this.notify.error('Failed to load rooms')
    });
  }

  loadStudents() {
    this.service.getstudents().subscribe({
      next: (res: any) => {
        this.students = res.success && res.data?.data ? res.data.data : [];
      },
      error: () => this.notify.error('Failed to load students')
    });
  }

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
      allocation_status: 'allocated'
    });

    this.filteredBranches = [];
    this.filteredRooms = [];
    this.filteredStudents = [];

    this.showModal = true;
  }

  openEdit(data: any) {

    this.editId = data.id;

    this.filteredBranches = this.branches.filter(
      (b: any) => b.school_id == data.school_id
    );

    this.filteredRooms = this.rooms.filter(
      (r: any) => r.branch_id == data.branch_id
    );

    this.filteredStudents = this.students.filter(
      (s: any) => s.branch_id == data.branch_id
    );

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

    const payload = {
      ...this.allocationForm.value,
      school_id: Number(this.allocationForm.value.school_id),
      branch_id: Number(this.allocationForm.value.branch_id),
      room_id: Number(this.allocationForm.value.room_id),
      student_id: Number(this.allocationForm.value.student_id),
      vacate_date: this.allocationForm.value.vacate_date || null
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

  delete(id: string) {
    if (!confirm('Delete this allocation?')) return;

    this.service.deleteHostelAllocation(id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success('Deleted successfully');
          this.loadAllocations();
        } else {
          this.notify.error('Delete failed');
        }
      },
      error: () => this.notify.error('Server error')
    });
  }
}


