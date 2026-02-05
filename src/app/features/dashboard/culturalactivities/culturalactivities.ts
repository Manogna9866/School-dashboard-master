import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-culturalactivities',
  imports: [FormsModule,CommonModule,ReactiveFormsModule],
  templateUrl: './culturalactivities.html',
  styleUrl: './culturalactivities.scss',
})
export class Culturalactivities {
activities: any[] = [];
  paginatedActivities: any[] = [];
  searchText = '';
  showModal = false;
  editId: string | null = null;
  loading = false;
  currentPage = 1;
  pageSize = 5;
  pages: number[] = [];

  culturalForm!: FormGroup;
  selectedFile: File | null = null;

  private fb = inject(FormBuilder);
  private service = inject(AuthService);
  private notify = inject(NotifyService);

  ngOnInit() {
    this.culturalForm = this.fb.group({
      school_id: ['1', Validators.required],
      branch_id: ['1', Validators.required],
      class_id: ['', Validators.required],
      event_name: ['', Validators.required],
      date_time: ['', Validators.required],
      venue: ['', Validators.required],
      category: ['', Validators.required],
      awards_recognitions: [''],
      description: [''],
      coordinator_name: [''],
      attachment: [''],
      attachment_type: ['image'],
      status: ['upcoming', Validators.required]
    });

    this.loadActivities();
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const type = file.type.startsWith('image') ? 'image' : 'video';
      this.culturalForm.patchValue({ attachment_type: type });
    }
  }

  loadActivities() {
    this.loading = true;
    this.service.getculturalactivities().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.activities = res.data?.data || [];
          this.applyFilter();
        }
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  applyFilter() {
    const text = this.searchText.toLowerCase();
    this.paginatedActivities = this.activities.filter(a =>
      a.event_name?.toLowerCase().includes(text) ||
      a.category?.toLowerCase().includes(text) ||
      a.status?.toLowerCase().includes(text)
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedActivities = this.activities.slice(start, end);

    const totalPages = Math.ceil(this.activities.length / this.pageSize);
    this.pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  changePage(page: number) {
    if (page < 1 || page > this.pages.length) return;
    this.currentPage = page;
    this.updatePagination();
  }

  openAdd() {
    this.editId = null;
    this.culturalForm.reset({
      school_id: '1',
      branch_id: '1',
      status: 'upcoming',
      attachment_type: 'image'
    });
    this.showModal = true;
  }

  openEdit(activity: any) {
    this.editId = activity.id;
    this.culturalForm.patchValue(activity);
    this.showModal = true;
  }

  save() {
    if (this.culturalForm.invalid) {
      this.notify.error('All required fields must be filled');
      return;
    }

    const formData = new FormData();
    Object.entries(this.culturalForm.value).forEach(([key, value]) => {
      formData.append(key, value as any);
    });

    if (this.selectedFile) formData.append('attachment', this.selectedFile);

    this.loading = true;
    const request$ = this.editId
      ? this.service.updateculturalactivity(this.editId, formData)
      : this.service.createculturalactivity(formData);

    request$.subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.notify.success(
            this.editId ? 'Activity updated' : 'Activity created'
          );
          this.showModal = false;
          this.selectedFile = null;
          this.searchText = '';
          this.loadActivities();
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
    if (!confirm('Delete this activity?')) return;

    this.service.deleteculturalactivity(id).subscribe({
      next: () => {
        this.activities = this.activities.filter(a => a.id !== id);
        this.applyFilter();
        this.notify.success('Deleted successfully');
      }
    });
  }
}
