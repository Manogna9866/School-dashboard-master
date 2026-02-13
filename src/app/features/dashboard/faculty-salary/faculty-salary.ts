import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-faculty-salary',
  imports: [ReactiveFormsModule,FormsModule,CommonModule],
  templateUrl: './faculty-salary.html',
  styleUrl: './faculty-salary.scss',
})
export class FacultySalary {
 salary: any[] = [];
  filteredSalary: any[] = [];
  paginatedSalary: any[] = [];

  pages: number[] = [];
  currentPage = 1;
  pageSize = 5;

  searchText = '';
  showModal = false;
  editId: string | null = null;
  loading = false;

  salaryForm!: FormGroup;

  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  ngOnInit() {

    this.salaryForm = this.fb.group({
      school_id: ['', Validators.required],
      branch_id: ['', Validators.required],
      faculty_id: ['', Validators.required],
      salary_month: ['', Validators.required],
      salary_type: ['', Validators.required],
      basic_salary: ['', Validators.required],
      allowances: ['0'],
      deductions: ['0'],
      net_salary: ['', Validators.required],
      payment_date: ['', Validators.required],
      payment_method: ['', Validators.required],
      payment_status: ['Pending'],
      processed_by: [''],
      remarks: [''],
      status: ['active'],
     
    });

    this.loadSalary();
  }

  /* LOAD */
  loadSalary() {
    this.service.getFacultySalaries().subscribe((res: any) => {
      if (res.success) {
        this.salary = Array.isArray(res.data?.data) ? res.data.data : [];
        this.applyFilter();
      }
    });
  }

  /* SEARCH */
  applyFilter() {
    const text = this.searchText.toLowerCase();

    this.filteredSalary = this.salary.filter(s =>
      s.salary_month?.toLowerCase().includes(text) ||
      s.faculty_id?.toString().includes(text) ||
      s.payment_status?.toLowerCase().includes(text)
    );

    this.currentPage = 1;
    this.updatePagination();
  }

  /* PAGINATION */
  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedSalary = this.filteredSalary.slice(start, end);

    const totalPages = Math.ceil(this.filteredSalary.length / this.pageSize);
    this.pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  changePage(page: number) {
    if (page < 1 || page > this.pages.length) return;
    this.currentPage = page;
    this.updatePagination();
  }

  /* ADD */
  openAdd() {
    this.editId = null;
    this.salaryForm.reset({
      payment_status: 'Pending',
      status: 'active',
     
    });
    this.showModal = true;
  }

  /* EDIT */
  openEdit(row: any) {
    this.editId = row.id;
    this.salaryForm.patchValue(row);
    this.showModal = true;
  }

  /* SAVE */
  save() {

    // if (this.salaryForm.invalid) {
    //   this.notify.error('Fill all required fields');
    //   return;
    // }

    const payload = this.salaryForm.value;

    const request$ = this.editId
      ? this.service.updateFacultySalary(this.editId, payload)
      : this.service.createFacultySalary(payload);

    request$.subscribe((res: any) => {
      if (res.success) {
        this.notify.success(this.editId ? 'Updated successfully' : 'Created successfully');
        this.showModal = false;
        this.loadSalary();
      }
    });
  }

  /* DELETE */
  delete(id: string) {
    if (!confirm('Delete this salary record?')) return;

    this.service.deleteFacultySalary(id).subscribe((res: any) => {
      if (res.success) {
        this.notify.success('Deleted successfully');
        this.loadSalary();
      }
    });
  }
}
