import { AuthService } from './../../../core/auth/auth';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonEngine } from '@angular/ssr/node';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-school',
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './school.html',
  styleUrl: './school.scss',
})
export class School {
  schools: any[] = [];
  filteredSchools: any[] = [];
  paginatedSchools: any[] = [];
  selectedLogoFile: File | null = null;
  logoPreview: string | null = null;

  showModal = false;
  editId: string | null = null;
  loading = false;

  searchText = '';
  currentPage = 1;
  pageSize = 5;

  schoolForm!: FormGroup;
  apiBaseUrl = 'https://s2swebsolutions.in/S2SWebSchool/public'; // For logos

  private fb = inject(FormBuilder);
  private schoolsService = inject(AuthService);
  private notify = inject(NotifyService);

  ngOnInit() {
    this.schoolForm = this.fb.group({
      school_name: ['', Validators.required],
      school_code: ['', Validators.required],
      address: ['', Validators.required],
      type: ['', Validators.required],
      management: [],
      chairman_name: ['', Validators.required],
      contact_number: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      total_students: ['', Validators.required],
      total_teachers: ['', Validators.required],
      established_year: ['', Validators.required],

      status: ['active', Validators.required],
      logo: [''] // can be URL or file
    });

    this.loadSchools();
  }

  /* ---------------- LOAD ---------------- */
  loadSchools() {
    this.loading = true;
    this.schoolsService.getSchools().subscribe({
      next: (res) => {
        if (res.success) {
          this.schools = res.data.data;
          this.applyFilter();
        } else {
          this.notify.error(res.message || 'Failed to load schools');
        }
        this.loading = false;
      },
      error: () => {
        this.notify.error('Server error');
        this.loading = false;
      }
    });
  }

  /* ---------------- SEARCH ---------------- */
  applyFilter() {
    const text = this.searchText.toLowerCase();
    this.filteredSchools = this.schools.filter(s =>
      s.school_name.toLowerCase().includes(text) ||
      s.school_code.toLowerCase().includes(text) ||
      s.chairman_name.toLowerCase().includes(text)
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  /* ---------------- PAGINATION ---------------- */
  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedSchools = this.filteredSchools.slice(start, start + this.pageSize);
  }

  changePage(page: number) {
    this.currentPage = page;
    this.updatePagination();
  }

  totalPages() {
    return Math.ceil(this.filteredSchools.length / this.pageSize);
  }

  /* ---------------- MODAL ---------------- */
  openAdd() {
    this.editId = null;
    this.schoolForm.reset({ status: 'active' });
    this.selectedLogoFile = null;
    this.logoPreview = null;
    this.showModal = true;
  }


  openEdit(school: any) {
    this.editId = school.id;

    // DO NOT recreate form
    this.schoolForm.patchValue({
      school_name: school.school_name,
      school_code: school.school_code,
      address: school.address,
      type: school.type,
      management: school.management,
      chairman_name: school.chairman_name,
      contact_number: school.contact_number,
      email: school.email,
      total_students: school.total_students,
      total_teachers: school.total_teachers,
      established_year: school.established_year,
      status: school.status
    });

    this.logoPreview = school.logo
      ? this.apiBaseUrl + '/' + school.logo
      : null;

    this.selectedLogoFile = null;
    this.showModal = true;
  }



  onLogoChange(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.selectedLogoFile = file;

    // preview
    const reader = new FileReader();
    reader.onload = () => (this.logoPreview = reader.result as string);
    reader.readAsDataURL(file);
  }

  /* ---------------- SAVE ---------------- */
  save() {
    if (this.schoolForm.invalid) {
      this.notify.error('All required fields must be filled');
      return;
    }

    const formData = new FormData();

    // Append all form values safely
    Object.keys(this.schoolForm.value).forEach(key => {
      const value = this.schoolForm.value[key];
      if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    // Append logo file if selected
    if (this.selectedLogoFile) {
      formData.append('logo', this.selectedLogoFile);
    }

    // Laravel PUT workaround
    if (this.editId) {
      formData.append('_method', 'PUT');
    }

    // Use correct service method
    const request$ = this.editId
      ? this.schoolsService.updateSchool(this.editId, formData)
      : this.schoolsService.createSchool(formData);

    this.loading = true;
    request$.subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.notify.success(
            this.editId ? 'School updated successfully' : 'School created successfully'
          );
          this.afterSaveSuccess();
        } else {
          this.notify.error(res.message || 'Operation failed');
        }
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.notify.error('Server error');
      }
    });
  }

  /* Use the helper afterSaveSuccess */
 



  /* ---------- COMMON SUCCESS HANDLER ---------- */
  private afterSaveSuccess() {
    console.log('Resetting form & closing modal');

    this.showModal = false;
    this.schoolForm.reset({ status: 'active' });
    this.logoPreview = null;
    this.selectedLogoFile = null;

    this.loadSchools();
  }




  /* ---------------- DELETE ---------------- */
  delete(id: string) {
    if (!confirm('Delete this school?')) return;

    this.loading = true;

    this.schoolsService.deleteSchool(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.notify.success(res.message || 'School deleted successfully');
          this.loadSchools();
        } else {
          this.notify.error(res.message || 'Failed to delete school');
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
