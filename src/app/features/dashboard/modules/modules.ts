import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-modules',
  imports: [FormsModule,CommonModule,ReactiveFormsModule],
  templateUrl: './modules.html',
  styleUrl: './modules.scss',
})
export class Modules {
 modules: any[] = [];
  filteredModules: any[] = [];
  paginatedModules: any[] = [];

  currentPage = 1;
  pageSize = 6;
  pages: number[] = [];

  searchText = '';
  showModal = false;
  editId: number | null = null;

  moduleForm!: FormGroup;

  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  ngOnInit() {
    this.moduleForm = this.fb.group({
      module_key: ['', Validators.required],
      module_name: ['', Validators.required],
      description: [''],
      status: ['active']
    });

    this.loadModules();
  }

  /* ================= LOAD ================= */
  loadModules() {
    this.service.getModules().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.modules = res.data?.data || [];
          this.applyFilter();
        }
      }
    });
  }

  /* ================= SEARCH ================= */
  applyFilter() {
    const text = this.searchText.toLowerCase();

    this.filteredModules = this.modules.filter(m =>
      m.module_name.toLowerCase().includes(text) ||
      m.module_key.toLowerCase().includes(text)
    );

    this.currentPage = 1;
    this.updatePagination();
  }

  /* ================= PAGINATION ================= */
  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedModules = this.filteredModules.slice(start, end);

    const totalPages = Math.ceil(this.filteredModules.length / this.pageSize);
    this.pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  changePage(page: number) {
    if (page < 1 || page > this.pages.length) return;
    this.currentPage = page;
    this.updatePagination();
  }

  /* ================= ADD ================= */
  openAdd() {
    this.editId = null;
    this.moduleForm.reset({ status: 'active' });
    this.showModal = true;
  }

  /* ================= EDIT ================= */
  openEdit(item: any) {
    this.editId = Number(item.id);
    this.moduleForm.patchValue(item);
    this.showModal = true;
  }

  /* ================= SAVE ================= */
  save() {
    if (this.moduleForm.invalid) {
      this.notify.error('Please fill required fields');
      return;
    }

    const request$ = this.editId
      ? this.service.updateModules(this.editId.toString(), this.moduleForm.value)
      : this.service.createModules(this.moduleForm.value);

    request$.subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success(this.editId ? 'Updated' : 'Created');
          this.showModal = false;
          this.loadModules();
        }
      }
    });
  }

  /* ================= DELETE ================= */
  delete(id: number) {
    if (!confirm('Delete this module?')) return;

    this.service.deleteModules(id.toString()).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success('Deleted');
          this.loadModules();
        }
      }
    });
  }
}
