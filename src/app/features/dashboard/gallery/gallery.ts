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
  gallery: any[] = [];
  filteredGallery: any[] = [];
  paginatedGallery: any[] = [];

  pages: number[] = [];
  currentPage = 1;
  pageSize = 5;

  searchText = '';
  showModal = false;
  editId: string | null = null;
  loading = false;

  galleryForm!: FormGroup;
  selectedFile!: File;



  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  ngOnInit() {
    this.galleryForm = this.fb.group({
      school_id: ['1', Validators.required],
      branch_id: ['1', Validators.required],
      event_name: ['', Validators.required],
      image_title: ['', Validators.required],
      status: ['active', Validators.required],
    });

    this.loadGallery();
  }

  /* ================= LOAD ================= */
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
      g.event_name.toLowerCase().includes(text) ||
      g.image_title.toLowerCase().includes(text)
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
      school_id: '1',
      branch_id: '1',
      status: 'active'
    });
    this.showModal = true;
  }

  openEdit(gallery: any) {
    this.editId = gallery.id;
    this.galleryForm.patchValue(gallery);
    this.showModal = true;
  }

  /* ================= SAVE ================= */
  save() {
    if (this.galleryForm.invalid) {
      this.notify.error('All required fields must be filled');
      return;
    }

    const formData = new FormData();

    Object.keys(this.galleryForm.value).forEach(key => {
      formData.append(key, this.galleryForm.value[key]);
    });

    if (this.selectedFile) {
      formData.append('attachment', this.selectedFile);
    }

    // 👇 IMPORTANT FOR LARAVEL
    if (this.editId) {
      formData.append('_method', 'PUT');
    }

    const request$ = this.editId
      ? this.service.updateGallery(this.editId, formData)
      : this.service.createGallery(formData);

    request$.subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success(this.editId ? 'Gallery updated' : 'Gallery created');
          this.showModal = false;
          this.searchText = '';
          this.selectedFile = undefined as any;
          this.loadGallery();
        } else {
          this.notify.error(res.message || 'Operation failed');
        }
      },
      error: (err) => {
        console.log(err);
        this.notify.error('Server error');
      }
    });
  }


  /* ================= DELETE ================= */
  delete(id: string) {
    if (!confirm('Delete this gallery record?')) return;

    this.service.deleteGallery(id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success('Gallery deleted');
          this.loadGallery();
        } else {
          this.notify.error('Delete failed');
        }
      },
      error: () => this.notify.error('Server error')
    });
  }
}
