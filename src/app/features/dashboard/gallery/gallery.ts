import { Component, inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gallery',
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './gallery.html',
  styleUrl: './gallery.scss',
})
export class Gallery {
   schools: any[] = [];
  branches: any[] = [];
  filteredBranches: any[] = [];

  gallery: any[] = [];
  filteredGallery: any[] = [];
  paginatedGallery: any[] = [];

  /* ================= PAGINATION ================= */

  pages: number[] = [];
  currentPage = 1;
  pageSize = 5;

  /* ================= UI STATE ================= */

  searchText = '';
  showModal = false;
  editId: string | null = null;
  loading = false;

  galleryForm!: FormGroup;
  selectedFile!: File;

  /* ================= INJECTION ================= */

  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  /* ================= INIT ================= */

  ngOnInit() {

    this.galleryForm = this.fb.group({
      school_id: ['', Validators.required],
      branch_id: ['', Validators.required],
      event_name: ['', Validators.required],
      image_title: ['', Validators.required],
      status: ['active', Validators.required],
    });

    this.loadSchools();
    this.loadBranches();
    this.loadGallery();

    /* 🔥 SCHOOL CHANGE → FILTER BRANCHES */
    this.galleryForm.get('school_id')?.valueChanges.subscribe(schoolId => {

      if (!schoolId) {
        this.filteredBranches = [];
        this.galleryForm.patchValue({ branch_id: '' });
        return;
      }

      this.filteredBranches = this.branches.filter(
        (b: any) => b.school_id == schoolId
      );

      this.galleryForm.patchValue({ branch_id: '' });
    });

    /* 🔥 BRANCH CHANGE → ENSURE SCHOOL MATCH */
    this.galleryForm.get('branch_id')?.valueChanges.subscribe(branchId => {

      if (!branchId) return;

      const selectedBranch = this.branches.find(
        (b: any) => b.id == branchId
      );

      if (selectedBranch) {
        this.galleryForm.patchValue({
          school_id: selectedBranch.school_id
        }, { emitEvent: false });
      }
    });
  }

  /* ================= LOAD DATA ================= */

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

  loadGallery() {
    this.loading = true;

    this.service.getGallery().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.gallery = Array.isArray(res.data?.data)
            ? res.data.data
            : [];
          this.applyFilter();
        } else {
          this.notify.error('Failed to load gallery');
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

    this.filteredGallery = this.gallery.filter(g =>
      g.event_name?.toLowerCase().includes(text) ||
      g.image_title?.toLowerCase().includes(text)
    );

    this.currentPage = 1;
    this.updatePagination();
  }

  /* ================= PAGINATION ================= */

  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedGallery = this.filteredGallery.slice(start, end);

    const totalPages = Math.ceil(this.filteredGallery.length / this.pageSize);
    this.pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  changePage(page: number) {
    if (page < 1 || page > this.pages.length) return;
    this.currentPage = page;
    this.updatePagination();
  }

  /* ================= FILE ================= */

  onFileChange(event: any) {
    this.selectedFile = event.target.files[0];
  }

  /* ================= MODAL ================= */

  openAdd() {
    this.editId = null;

    this.galleryForm.reset({
      status: 'active'
    });

    this.filteredBranches = [];
    this.selectedFile = undefined as any;

    this.showModal = true;
  }

  openEdit(gallery: any) {
    this.editId = gallery.id;

    this.filteredBranches = this.branches.filter(
      (b: any) => b.school_id == gallery.school_id
    );

    this.galleryForm.patchValue(gallery);
    this.showModal = true;
  }

  /* ================= SAVE ================= */

  save() {

    if (this.galleryForm.invalid) {
      this.notify.error('Please fill all required fields');
      return;
    }

    const formData = new FormData();

    Object.keys(this.galleryForm.value).forEach(key => {
      formData.append(key, this.galleryForm.value[key]);
    });

    if (this.selectedFile) {
      formData.append('attachment', this.selectedFile);
    }

    if (this.editId) {
      formData.append('_method', 'PUT');
    }

    this.loading = true;

    const request$ = this.editId
      ? this.service.updateGallery(this.editId, formData)
      : this.service.createGallery(formData);

    request$.subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success(this.editId ? 'Gallery updated' : 'Gallery created');
          this.showModal = false;
          this.loadGallery();
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
    if (!confirm('Delete this gallery record?')) return;

    this.loading = true;

    this.service.deleteGallery(id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success('Gallery deleted');
          this.loadGallery();
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
