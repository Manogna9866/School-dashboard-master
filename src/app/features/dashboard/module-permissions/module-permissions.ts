import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';

@Component({
  selector: 'app-module-permissions',
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './module-permissions.html',
  styleUrl: './module-permissions.scss',
})
export class ModulePermissions {

  // modules: any[] = []; // For dropdown
  // permissionsList: any[] = []; // For table
  // roles: any[] = [];
  // filteredPermissions: any[] = [];
  // paginatedPermissions: any[] = [];
  // pages: number[] = [];
  // currentPage = 1;
  // pageSize = 5;
  // searchText = '';
  // showModal = false;
  // editId: string | null = null;
  // permissionForm!: FormGroup;

  // private service = inject(AuthService);
  // private fb = inject(FormBuilder);
  // private notify = inject(NotifyService);

  // ngOnInit() {
  //   this.permissionForm = this.fb.group({
  //     role_id: ['', Validators.required],
  //     module_key: ['', Validators.required],
  //     create: [false],
  //     update: [false],
  //     delete: [false],
  //     index: [false],
  //     show: [false]
  //   });

  //   this.loadRoles();
  //   this.loadModulePermissions();
  // }

  // loadRoles() {
  //   this.service.getRoles().subscribe({
  //     next: (res: any) => {
  //       this.roles = res.success ? (res.data?.data || res.data || []) : [];
  //     },
  //     error: () => this.notify.error('Failed to load roles')
  //   });
  // }

  // loadModulePermissions(roleId: number = 1) {
  //   this.service.getModulePermissions().subscribe({
  //     next: (res: any) => {
  //       if (res.success) {
  //         // Parse permissions_json
  //         this.permissionsList = res.data.map((m: any) => ({
  //           id: m.id,
  //           role_id: m.role_id,
  //           module_key: m.module_key,
  //           module_name: m.module_name,
  //           permissions: JSON.parse(m.permissions_json || '{}')
  //         }));

  //         // Populate dropdown modules (unique)
  //         this.modules = Array.from(new Set(this.permissionsList.map(m => m.module_name)))
  //           .map(name => {
  //             const m = this.permissionsList.find(p => p.module_name === name);
  //             return { module_name: name, module_key: m.module_key };
  //           });

  //         this.applyFilter();
  //       } else {
  //         this.notify.error('Failed to load module permissions');
  //       }
  //     },
  //     error: () => this.notify.error('Server error while loading module permissions')
  //   });
  // }

  // applyFilter() {
  //   const text = this.searchText.toLowerCase();
  //   this.filteredPermissions = this.permissionsList.filter(m =>
  //     m.module_name.toLowerCase().includes(text) ||
  //     this.getRoleName(m.role_id).toLowerCase().includes(text)
  //   );
  //   this.currentPage = 1;
  //   this.updatePagination();
  // }

  // updatePagination() {
  //   const start = (this.currentPage - 1) * this.pageSize;
  //   const end = start + this.pageSize;
  //   this.paginatedPermissions = this.filteredPermissions.slice(start, end);
  //   this.pages = Array.from({ length: Math.ceil(this.filteredPermissions.length / this.pageSize) }, (_, i) => i + 1);
  // }

  // changePage(page: number) {
  //   if (page < 1 || page > this.pages.length) return;
  //   this.currentPage = page;
  //   this.updatePagination();
  // }

  // openAdd() {
  //   this.editId = null;
  //   this.permissionForm.reset({
  //     role_id: '',
  //     module_key: '',
  //     create: false,
  //     update: false,
  //     delete: false,
  //     index: false,
  //     show: false
  //   });
  //   this.showModal = true;
  // }

  // openEdit(perm: any) {
  //   this.editId = perm.id;
  //   this.permissionForm.patchValue({
  //     role_id: perm.role_id,
  //     module_key: perm.module_key,
  //     create: !!perm.permissions.create,
  //     update: !!perm.permissions.update,
  //     delete: !!perm.permissions.delete,
  //     index: !!perm.permissions.index,
  //     show: !!perm.permissions.show
  //   });
  //   this.showModal = true;
  // }

  // save() {
  //   if (this.permissionForm.invalid) return this.notify.error('Fill required fields');

  //   const form = this.permissionForm.value;
  //   const payload = {
  //     role_id: Number(form.role_id),
  //     module_key: form.module_key,
  //     permissions: {
  //       create: !!form.create,
  //       update: !!form.update,
  //       delete: !!form.delete,
  //       index: !!form.index,
  //       show: !!form.show
  //     }
  //   };

  //   const request$ = this.editId
  //     ? this.service.updateModulePermission(this.editId, payload)
  //     : this.service.createModulePermission(payload);

  //   request$.subscribe({
  //     next: (res: any) => {
  //       if (res.success) {
  //         this.notify.success(this.editId ? 'Updated' : 'Created');
  //         this.showModal = false;
  //         this.loadModulePermissions();
  //       } else {
  //         this.notify.error(res.message || 'Failed');
  //       }
  //     },
  //     error: (err) => this.notify.error(err.error?.message || 'Server error')
  //   });
  // }

  // delete(id: string) {
  //   if (!confirm('Delete permission?')) return;
  //   this.service.deleteModulePermission(id).subscribe({
  //     next: (res: any) => {
  //       if (res.success) {
  //         this.notify.success('Deleted');
  //         this.loadModulePermissions();
  //       } else this.notify.error('Failed to delete');
  //     },
  //     error: () => this.notify.error('Server error')
  //   });
  // }

  // getRoleName(role_id: number) {
  //   return this.roles.find(r => r.id === role_id)?.role_name || 'Unknown';
  // }
}


