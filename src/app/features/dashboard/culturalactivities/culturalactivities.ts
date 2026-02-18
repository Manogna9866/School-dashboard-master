import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-culturalactivities',
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './culturalactivities.html',
  styleUrls: ['./culturalactivities.scss'],

})
export class Culturalactivities {
  schools: any[] = [];
  branches: any[] = [];
  classes: any[] = [];
  filteredBranches: any[] = [];

  activities: any[] = [];
  filteredActivities: any[] = [];
  paginatedActivities: any[] = [];

  file: File | null = null;

  pages: number[] = [];
  currentPage = 1;
  pageSize = 5;
  searchText = '';
  showModal = false;
  editId: string | null = null;
  loading = false;

  activityForm!: FormGroup;

  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);
  private service = inject(AuthService);

  ngOnInit() {
    this.activityForm = this.fb.group({
      school_id: ['', Validators.required],
      branch_id: ['', Validators.required],
      class_id: ['', Validators.required],
      event_name: ['', Validators.required],
      date_time: ['', Validators.required],
      venue: ['', Validators.required],
      category: ['', Validators.required],
      awards_recognitions: [''],
      description: [''],
      coordinator_name: ['', Validators.required],
      status: ['upcoming'],
      attachment_type: ['image']
    });

    this.loadSchools();
    this.loadBranches();
    this.loadClasses();
    this.loadActivities();

    // Filter branches when school changes
    this.activityForm.get('school_id')?.valueChanges.subscribe(schoolId => {
      this.filteredBranches = this.branches.filter(b => b.school_id == schoolId);
      this.activityForm.patchValue({ branch_id: '' });
    });
  }

  loadSchools() {
    this.service.getSchools().subscribe({
      next: (res: any) => this.schools = res.success && res.data?.data ? res.data.data : [],
      error: () => this.notify.error('Failed to load schools')
    });
  }

  loadBranches() {
    this.service.getBranches().subscribe({
      next: (res: any) => this.branches = res.success && res.data?.data ? res.data.data : [],
      error: () => this.notify.error('Failed to load branches')
    });
  }

  loadClasses() {
    this.service.getClasses().subscribe({
      next: (res: any) => this.classes = res.success && res.data?.data ? res.data.data : [],
      error: () => this.notify.error('Failed to load classes')
    });
  }

  loadActivities() {
    this.service.getculturalactivities().subscribe({
      next: (res: any) => {
        this.activities = res.success && res.data?.data ? res.data.data : [];
        this.applyFilter();
      },
      error: () => this.notify.error('Server error')
    });
  }

  applyFilter() {
    const text = this.searchText.toLowerCase();
    this.filteredActivities = this.activities.filter(a =>
      a.event_name?.toLowerCase().includes(text) ||
      a.category?.toLowerCase().includes(text) ||
      a.coordinator_name?.toLowerCase().includes(text)
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
    if (page < 1 || page > this.pages.length) return;
    this.currentPage = page;
    this.updatePagination();
  }

  openAdd() {
    this.editId = null;
    this.file = null;
    this.activityForm.reset({ status: 'upcoming', attachment_type: 'image' });
    this.filteredBranches = [];
    this.showModal = true;
  }

  openEdit(item: any) {

    // ✅ Set edit id
    this.editId = item.id;

    // ✅ Filter branches
    this.filteredBranches =
      this.branches.filter(b => b.school_id == item.school_id);

    // ✅ Convert API date → input format
    const formattedDate = item.date_time
      ? new Date(item.date_time.replace(' ', 'T'))
        .toISOString()
        .slice(0, 16)
      : '';

    // ✅ Patch form
    this.activityForm.patchValue({
      school_id: item.school_id,
      branch_id: item.branch_id,
      class_id: item.class_id,
      event_name: item.event_name,
      date_time: formattedDate,
      venue: item.venue,
      category: item.category,
      awards_recognitions: item.awards_recognitions,
      description: item.description,
      coordinator_name: item.coordinator_name,
      status: item.status,
      attachment_type: item.attachment_type
    });

    this.showModal = true;
  }


  onFileSelected(event: any) {
    this.file = event.target.files[0];
  }

  save() {

    if (this.activityForm.invalid) {
      this.notify.error('Please fill all required fields');
      return;
    }

    const payload: any = { ...this.activityForm.value };

    // ✅ Convert date back to API format
    if (payload.date_time) {
      payload.date_time =
        payload.date_time.replace('T', ' ') + ':00';
    }

    const formData = new FormData();

    Object.keys(payload).forEach(key => {
      if (payload[key] !== null && payload[key] !== undefined) {
        formData.append(key, payload[key].toString());
      }
    });

    if (this.file) {
      formData.append('attachment', this.file);
    }

    const request$ = this.editId
      ? this.service.updateculturalactivity(this.editId, formData)
      : this.service.createculturalactivity(formData);

    this.loading = true;

    request$.subscribe({
      next: (res: any) => {

        if (res.success) {
          this.notify.success(
            this.editId
              ? 'Activity updated successfully'
              : 'Activity created successfully'
          );

          this.showModal = false;
          this.loadActivities();
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
    if (!confirm('Delete this activity?')) return;
    this.loading = true;
    this.service.deleteculturalactivity(id).subscribe({
      next: (res: any) => {
        if (res.success) this.notify.success('Activity deleted');
        else this.notify.error('Delete failed');
        this.loadActivities();
        this.loading = false;
      },
      error: () => {
        this.notify.error('Server error');
        this.loading = false;
      }
    });
  }
}

