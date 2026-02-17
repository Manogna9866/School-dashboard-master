import { Component, inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hostel-rooms',
  imports: [ReactiveFormsModule,CommonModule,FormsModule],
  templateUrl: './hostel-rooms.html',
  styleUrl: './hostel-rooms.scss',
})
export class HostelRooms {
 schools: any[] = [];
  branches: any[] = [];
  filteredBranches: any[] = [];

  rooms: any[] = [];
  filteredRooms: any[] = [];
  paginatedRooms: any[] = [];

  pages: number[] = [];
  currentPage = 1;
  pageSize = 5;

  searchText = '';
  showModal = false;
  editId: string | null = null;
  loading = false;

  roomForm!: FormGroup;

  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  /* ================= INIT ================= */

  ngOnInit() {

    this.roomForm = this.fb.group({
      school_id: ['', Validators.required],
      branch_id: ['', Validators.required],
      hostel_name: ['', Validators.required],
      room_number: ['', Validators.required],
      capacity: ['', Validators.required],
      room_type: ['', Validators.required],
      availability: ['available', Validators.required],
      warden_name: ['', Validators.required],
      warden_contact: ['', Validators.required],
      remarks: ['']
    });

    this.loadSchools();
    this.loadBranches();
    this.loadRooms();

    /* 🔥 SCHOOL CHANGE → FILTER BRANCHES */
    this.roomForm.get('school_id')?.valueChanges.subscribe(schoolId => {

      if (!schoolId) {
        this.filteredBranches = [];
        this.roomForm.patchValue({ branch_id: '' });
        return;
      }

      this.filteredBranches = this.branches.filter(
        (b: any) => b.school_id == schoolId
      );

      this.roomForm.patchValue({ branch_id: '' });
    });

    /* 🔥 BRANCH CHANGE → AUTO SET SCHOOL */
    this.roomForm.get('branch_id')?.valueChanges.subscribe(branchId => {

      if (!branchId) return;

      const selectedBranch = this.branches.find(
        (b: any) => b.id == branchId
      );

      if (selectedBranch) {
        this.roomForm.patchValue({
          school_id: selectedBranch.school_id
        }, { emitEvent: false });
      }
    });
  }

  /* ================= LOAD ================= */

  loadSchools() {
    this.service.getSchools().subscribe({
      next: (res: any) => {
        this.schools = res.success && res.data?.data
          ? res.data.data
          : [];
      },
      error: () => this.notify.error('Failed to load schools')
    });
  }

  loadBranches() {
    this.service.getBranches().subscribe({
      next: (res: any) => {
        this.branches = res.success && res.data?.data
          ? res.data.data
          : [];
      },
      error: () => this.notify.error('Failed to load branches')
    });
  }

  loadRooms() {
    this.loading = true;

    this.service.getHostelRooms().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.rooms = Array.isArray(res.data?.data)
            ? res.data.data
            : [];
          this.applyFilter();
        } else {
          this.notify.error('Failed to load hostel rooms');
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

    this.filteredRooms = this.rooms.filter(r =>
      r.hostel_name?.toLowerCase().includes(text) ||
      r.room_number?.toLowerCase().includes(text) ||
      r.room_type?.toLowerCase().includes(text) ||
      r.availability?.toLowerCase().includes(text) ||
      r.warden_name?.toLowerCase().includes(text)
    );

    this.currentPage = 1;
    this.updatePagination();
  }

  /* ================= PAGINATION ================= */

  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedRooms = this.filteredRooms.slice(start, end);

    const totalPages = Math.ceil(this.filteredRooms.length / this.pageSize);
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

    this.roomForm.reset({
      availability: 'available'
    });

    this.filteredBranches = [];
    this.showModal = true;
  }

  openEdit(room: any) {

    this.editId = room.id;

    this.filteredBranches = this.branches.filter(
      (b: any) => b.school_id == room.school_id
    );

    this.roomForm.patchValue(room);
    this.showModal = true;
  }

  /* ================= SAVE ================= */

  save() {

    if (this.roomForm.invalid) {
      this.notify.error('Please fill all required fields');
      return;
    }

    const payload = {
      ...this.roomForm.value,
      school_id: Number(this.roomForm.value.school_id),
      branch_id: Number(this.roomForm.value.branch_id),
      capacity: Number(this.roomForm.value.capacity)
    };

    this.loading = true;

    const request$ = this.editId
      ? this.service.updateHostelRoom(this.editId, payload)
      : this.service.createHostelRoom(payload);

    request$.subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success(this.editId ? 'Room updated' : 'Room created');
          this.showModal = false;
          this.loadRooms();
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

    if (!confirm('Delete this hostel room?')) return;

    this.loading = true;

    this.service.deleteHostelRoom(id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success('Room deleted');
          this.loadRooms();
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
