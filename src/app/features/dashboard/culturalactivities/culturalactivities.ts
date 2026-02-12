import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-culturalactivities',
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './culturalactivities.html',
  styleUrl: './culturalactivities.scss',
})
export class Culturalactivities {
  activities: any[] = [];
  filteredActivities: any[] = [];
  paginatedActivities: any[] = [];

  branches: any[] = [];
  classes: any[] = [];
  faculty: any[] = [];

  culturalForm!: FormGroup;
  selectedFile: File | null = null;

  searchText = '';
  showModal = false;
  editId: string | null = null;
  loading = false;

  currentPage = 1;
  pageSize = 5;
  pages: number[] = [];

  private fb = inject(FormBuilder);
  private service = inject(AuthService);
  private notify = inject(NotifyService);

  ngOnInit(): void {
    this.initForm();
    this.loadActivities();
    this.loadBranches();
    this.loadClasses();
   
  }

  initForm() {
    this.culturalForm = this.fb.group({
      school_id: ['1', Validators.required],
      branch_id: ['', Validators.required],
      class_id: ['', Validators.required],
      event_name: ['', Validators.required],
      category: ['', Validators.required],
      date_time: ['', Validators.required],
      venue: ['', Validators.required],
      status: ['upcoming', Validators.required],
      description: [''],
      awards_recognitions: [''],
      coordinator_name: [''],
      attachment_type: ['image']
    });
  }

  // ===== FILE =====
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    this.selectedFile = file;

    this.culturalForm.patchValue({
      attachment_type: file.type.startsWith('image') ? 'image' : 'video'
    });
  }

  // ===== LOADERS =====
  loadActivities() {
    this.loading = true;
    this.service.getculturalactivities().subscribe({
      next: (res: any) => {
        this.activities = res?.data?.data ?? [];
        this.applyFilter();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadBranches() {
    this.service.getBranches().subscribe((res: any) => {
      const data = res?.data?.data;
      this.branches = Array.isArray(data) ? data : [];
    });
  }


  loadClasses() {
    this.service.getClasses().subscribe((res: any) => {
      const data = res?.data?.data;
      this.classes = Array.isArray(data) ? data : [];
    });
  }


 


  // ===== FILTER + PAGINATION =====
  applyFilter() {
    const text = this.searchText.toLowerCase();
    this.filteredActivities = this.activities.filter(a =>
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

    this.paginatedActivities = this.filteredActivities.slice(start, end);
    const totalPages = Math.ceil(this.filteredActivities.length / this.pageSize);
    this.pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  changePage(page: number) {
    this.currentPage = page;
    this.updatePagination();
  }

  // ===== MODAL =====
  openAdd() {
    this.editId = null;
    this.selectedFile = null;

    this.culturalForm.reset({
      school_id: '1',
      status: 'upcoming',
      attachment_type: 'image'
    });

    this.showModal = true;
  }

  openEdit(activity: any) {
    this.editId = activity.id;
    this.selectedFile = null;

    this.culturalForm.patchValue({
      ...activity,
      branch_id: activity.branch_id,
      class_id: activity.class_id
    });

    this.showModal = true;
  }

  // ===== SAVE =====
  save() {
    if (this.culturalForm.invalid) {
      this.notify.error('Please fill required fields');
      return;
    }

    const formData = new FormData();

    Object.entries(this.culturalForm.value).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value as any);
      }
    });

    if (this.selectedFile) {
      formData.append('attachment', this.selectedFile);
    }

    const api$ = this.editId
      ? this.service.updateculturalactivity(this.editId, formData)
      : this.service.createculturalactivity(formData);

    api$.subscribe({
      next: () => {
        this.notify.success(this.editId ? 'Updated successfully' : 'Created successfully');
        this.showModal = false;
        this.loadActivities();
      },
      error: () => this.notify.error('Operation failed')
    });
  }

  // ===== DELETE =====
  delete(id: string) {
    if (!confirm('Delete this activity?')) return;

    this.service.deleteculturalactivity(id).subscribe(() => {
      this.activities = this.activities.filter(a => a.id !== id);
      this.applyFilter();
      this.notify.success('Deleted');
    });
  }
}
