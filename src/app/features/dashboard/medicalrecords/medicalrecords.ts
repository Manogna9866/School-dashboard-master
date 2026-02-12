import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-medicalrecords',
  imports: [ReactiveFormsModule,FormsModule,CommonModule],
  templateUrl: './medicalrecords.html',
  styleUrl: './medicalrecords.scss',
})
export class Medicalrecords {
medicalRecords: any[] = [];
  filteredRecords: any[] = [];
  paginatedRecords: any[] = [];

  pages: number[] = [];
  currentPage = 1;
  pageSize = 5;

  searchText = '';
  showModal = false;
  editId: string | null = null;
  loading = false;

  medicalForm!: FormGroup;

  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  ngOnInit() {
    this.medicalForm = this.fb.group({
      school_id: ['1', Validators.required],
      branch_id: ['1', Validators.required],
      student_id: ['', Validators.required],
      medical_date: ['', Validators.required],
      medical_issues: ['', Validators.required],
      severity: ['Mild', Validators.required],
      first_aid_given: ['', Validators.required],
      referred_to_hospital: ['No', Validators.required],
      guardian_notified: ['Yes', Validators.required],
      remarks: ['']
    });

    this.loadMedical();
  }

  /* ================= LOAD ================= */
  loadMedical() {
    this.loading = true;

    this.service.getMedicalRecords().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.medicalRecords = Array.isArray(res.data?.data)
            ? res.data.data
            : [];

          this.applyFilter();
        } else {
          this.notify.error('Failed to load medical records');
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

    this.filteredRecords = this.medicalRecords.filter(m =>
      m.student_id?.toString().includes(text) ||
      m.medical_issues?.toLowerCase().includes(text) ||
      m.severity?.toLowerCase().includes(text) ||
      m.referred_to_hospital?.toLowerCase().includes(text)
    );

    this.currentPage = 1;
    this.updatePagination();
  }

  /* ================= PAGINATION ================= */
  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedRecords = this.filteredRecords.slice(start, end);

    const totalPages = Math.ceil(this.filteredRecords.length / this.pageSize);
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

    this.medicalForm.reset({
      school_id: '1',
      branch_id: '1',
      severity: 'Mild',
      referred_to_hospital: 'No',
      guardian_notified: 'Yes'
    });

    this.showModal = true;
  }

  openEdit(data: any) {
    this.editId = data.id;

    this.medicalForm.patchValue({
      ...data,
      medical_date: data.medical_date?.substring(0, 10) // YYYY-MM-DD
    });

    this.showModal = true;
  }

  /* ================= SAVE ================= */
  save() {

    if (this.medicalForm.invalid) {
      this.notify.error('Please fill all required fields');
      return;
    }

    const payload = {
      ...this.medicalForm.value,
      school_id: '1',
      branch_id: '1'
    };

    this.loading = true;

    const request$ = this.editId
      ? this.service.updateMedicalRecord(this.editId, payload)
      : this.service.createMedicalRecord(payload);

    request$.subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success(this.editId ? 'Medical updated' : 'Medical created');
          this.showModal = false;
          this.loadMedical();
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
    if (!confirm('Delete this medical record?')) return;

    this.loading = true;

    this.service.deleteMedicalRecord(id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success('Medical deleted');
          this.loadMedical();
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
