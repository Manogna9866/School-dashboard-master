import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-library-book-issue',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './library-book-issue.html',
  styleUrl: './library-book-issue.scss',
})
export class LibraryBookIssue {
  issues: any[] = [];
  filteredIssues: any[] = [];
  paginatedIssues: any[] = [];

  pages: number[] = [];
  currentPage = 1;
  pageSize = 5;

  searchText = '';
  showModal = false;
  editId: string | null = null;
  loading = false;

  issueForm!: FormGroup;

  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  ngOnInit() {
    this.issueForm = this.fb.group({
      school_id: ['1', Validators.required],
      branch_id: ['1', Validators.required],
      book_id: ['', Validators.required],
      student_id: ['', Validators.required],
      subject_name: ['', Validators.required],
      issue_date: ['', Validators.required],
      due_date: ['', Validators.required],
      return_date: [''],
      return_status: ['Issued', Validators.required],
      fine_amount: ['0'],
      issued_by: ['', Validators.required],
      remarks: ['']
    });

    this.loadIssues();
  }

  /* ================= LOAD ================= */
  loadIssues() {
    this.loading = true;

    this.service.getLibraryBookIssues().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.issues = Array.isArray(res.data?.data)
            ? res.data.data
            : [];

          this.applyFilter();
        } else {
          this.notify.error('Failed to load records');
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

    this.filteredIssues = this.issues.filter(i =>
      i.student_id?.toString().includes(text) ||
      i.book_id?.toString().includes(text) ||
      i.subject_name?.toLowerCase().includes(text) ||
      i.return_status?.toLowerCase().includes(text)
    );

    this.currentPage = 1;
    this.updatePagination();
  }

  /* ================= PAGINATION ================= */
  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedIssues = this.filteredIssues.slice(start, end);

    const totalPages = Math.ceil(this.filteredIssues.length / this.pageSize);
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

    this.issueForm.reset({
      school_id: '1',
      branch_id: '1',
      return_status: 'Issued',
      fine_amount: 0,
      issued_by: '1'
    });

    this.showModal = true;
  }


  openEdit(data: any) {
    this.editId = data.id;

    this.issueForm.patchValue({
      ...data,
      issue_date: data.issue_date?.substring(0, 10),
      due_date: data.due_date?.substring(0, 10),
      return_date: data.return_date ? data.return_date.substring(0, 10) : ''
    });

    this.showModal = true;
  }

  /* ================= SAVE ================= */
  save() {

    if (this.issueForm.invalid) {
      console.log(this.issueForm.value);
      this.notify.error('Please fill all required fields');
      return;
    }

    const formValue = this.issueForm.value;

    const payload = {
      school_id: '1',
      branch_id: '1',
      book_id: formValue.book_id,
      student_id: formValue.student_id,
      subject_name: formValue.subject_name,
      issue_date: formValue.issue_date,
      due_date: formValue.due_date,
      return_date: formValue.return_date || null,
      return_status: formValue.return_status,
      fine_amount: parseFloat(formValue.fine_amount || 0),
      issued_by: formValue.issued_by,
      remarks: formValue.remarks
    };

    this.loading = true;

    const request$ = this.editId
      ? this.service.updateLibraryBookIssue(this.editId, payload)
      : this.service.createLibraryBookIssue(payload);

    request$.subscribe({
      next: (res: any) => {
        console.log(res);

        if (res.success) {
          this.notify.success(this.editId ? 'Updated successfully' : 'Added successfully');
          this.showModal = false;
          this.loadIssues();
        } else {
          this.notify.error(res.message || 'Operation failed');
        }

        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.notify.error('Server error');
        this.loading = false;
      }
    });
  }


  /* ================= DELETE ================= */
  delete(id: string) {
    if (!confirm('Delete this record?')) return;

    this.loading = true;

    this.service.deleteLibraryBookIssue(id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success('Deleted successfully');
          this.loadIssues();
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
