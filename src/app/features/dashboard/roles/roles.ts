import { Auth } from './../../../layouts/auth/auth';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';
import { CommonModule } from '@angular/common';
import { form } from '@angular/forms/signals';

@Component({
  selector: 'app-roles',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './roles.html',
  styleUrl: './roles.scss',
})
export class Roles {
  roles: any[] = [];
  filteredRoles: any[] = [];
  paginatedRoles: any[] = [];

  showModal = false;
  editId: string | null = null;
  roleForm!: FormGroup;
  loading = false;

  // search + pagination
  searchText = '';
  currentPage = 1;
  pageSize = 5;

  private rolesService = inject(AuthService); // ✅ FIXED
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  ngOnInit() {
    this.roleForm = this.fb.group({
      role_name: ['', Validators.required],
      description: ['', Validators.required]
    });

    this.loadRoles();
  }

  loadRoles() {
    this.loading = true;

    this.rolesService.getRoles().subscribe({
      next: (res) => {
        if (res.success) {
          this.roles = res.data.data;
          this.applyFilter();
        } else {
          this.notify.error(res.message || 'Failed to load roles');
        }
        this.loading = false;
      },
      error: (err) => {
        this.notify.error(err.error?.message || 'Server error');
        this.loading = false;
      }
    });
  }

  /* ===== Search + Pagination ===== */
  applyFilter() {
    const text = this.searchText.toLowerCase();

    this.filteredRoles = this.roles.filter(r =>
      r.role_name.toLowerCase().includes(text) ||
      r.description.toLowerCase().includes(text)
    );

    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedRoles = this.filteredRoles.slice(start, end);
  }

  changePage(page: number) {
    this.currentPage = page;
    this.updatePagination();
  }

  totalPages(): number {
    return Math.ceil(this.filteredRoles.length / this.pageSize);
  }

  /* ===== Modal Logic ===== */
  openAdd() {
    this.editId = null;
    this.roleForm.reset();
    this.showModal = true;
  }

  openEdit(role: any) {
    this.editId = role.id;
    this.roleForm.patchValue({
      role_name: role.role_name,
      description: role.description
    });
    this.showModal = true;
  }

  save() {
    if (this.roleForm.invalid) {
      this.notify.error('Role name and description required');
      return;
    }

    this.loading = true;

    const request$ = this.editId
      ? this.rolesService.updateRole(this.editId, this.roleForm.value)
      : this.rolesService.createRole(this.roleForm.value);

    request$.subscribe({
      next: (res) => {
        if (res.success) {
          this.notify.success(res.message || 'Role saved successfully');
          this.showModal = false;
          this.roleForm.reset();
          this.loadRoles();
        } else {
          this.notify.error(res.message || 'Operation failed');
        }
        this.loading = false;
      },
      error: (err) => {
        this.notify.error(err.error?.message || 'Server error');
        this.loading = false;
      }
    });
  }

  delete(id: string) {
    if (!confirm('Delete this role?')) return;

    this.loading = true;

    this.rolesService.deleteRole(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.notify.success(res.message || 'Role deleted successfully');
          this.loadRoles();
        } else {
          this.notify.error(res.message || 'Failed to delete role');
        }
        this.loading = false;
      },
      error: (err) => {
        this.notify.error(err.error?.message || 'Server error');
        this.loading = false;
      }
    });
  }


}

