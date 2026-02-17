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
   schools: any[] = [];
  branches: any[] = [];
  filteredBranches: any[] = [];

  books: any[] = [];
  filteredBooksList: any[] = [];

  students: any[] = [];
  filteredStudents: any[] = [];

  /* ================= ISSUE LIST ================= */

  issues: any[] = [];
  filteredIssues: any[] = [];
  paginatedIssues: any[] = [];

  pages: number[] = [];
  currentPage = 1;
  pageSize = 5;

  searchText = '';
  showModal = false;

  // ✅ FIXED TYPE
  editId: string | null = null;

  loading = false;

  issueForm!: FormGroup;

  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  /* ================= INIT ================= */

  ngOnInit(): void {

    this.issueForm = this.fb.group({
      school_id: [null, Validators.required],
      branch_id: [null, Validators.required],
      book_id: [null, Validators.required],
      student_id: [null, Validators.required],
      subject_name: ['', Validators.required],
      issue_date: ['', Validators.required],
      due_date: ['', Validators.required],
      return_date: [null],
      return_status: ['Issued', Validators.required],
      fine_amount: [0],
      issued_by: [null, Validators.required],
      remarks: ['']
    });

    this.loadSchools();
    this.loadBranches();
    this.loadBooks();
    this.loadStudents();
    this.loadIssues();

    /* SCHOOL CHANGE */
    this.issueForm.get('school_id')?.valueChanges.subscribe((schoolId: any) => {

      if (!schoolId) {
        this.filteredBranches = [];
        this.filteredBooksList = [];
        this.filteredStudents = [];
        return;
      }

      this.filteredBranches = this.branches.filter(
        (b: any) => Number(b.school_id) === Number(schoolId)
      );

      this.issueForm.patchValue({
        branch_id: null,
        book_id: null,
        student_id: null
      });
    });

    /* BRANCH CHANGE */
    this.issueForm.get('branch_id')?.valueChanges.subscribe((branchId: any) => {

      if (!branchId) {
        this.filteredBooksList = [];
        this.filteredStudents = [];
        return;
      }

      this.filteredBooksList = this.books.filter(
        (b: any) => Number(b.branch_id) === Number(branchId)
      );

      this.filteredStudents = this.students.filter(
        (s: any) => Number(s.branch_id) === Number(branchId)
      );

      this.issueForm.patchValue({
        book_id: null,
        student_id: null
      });
    });
  }

  /* ================= LOAD METHODS ================= */

  loadSchools() {
    this.service.getSchools().subscribe({
      next: (res: any) => {
        this.schools = res.success && res.data?.data ? res.data.data : [];
      },
      error: () => this.notify.error('Failed to load schools')
    });
  }

  loadBranches() {
    this.service.getBranches().subscribe({
      next: (res: any) => {
        this.branches = res.success && res.data?.data ? res.data.data : [];
      },
      error: () => this.notify.error('Failed to load branches')
    });
  }

  loadBooks() {
    this.service.getBooks().subscribe({
      next: (res: any) => {
        this.books = res.success && res.data?.data ? res.data.data : [];
      },
      error: () => this.notify.error('Failed to load books')
    });
  }

  loadStudents() {
    this.service.getstudents().subscribe({
      next: (res: any) => {
        this.students = res.success && res.data?.data ? res.data.data : [];
      },
      error: () => this.notify.error('Failed to load students')
    });
  }

  loadIssues() {
    this.loading = true;

    this.service.getLibraryBookIssues().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.issues = Array.isArray(res.data?.data) ? res.data.data : [];
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

  /* ================= SEARCH + PAGINATION ================= */

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
      school_id: null,
      branch_id: null,
      book_id: null,
      student_id: null,
      return_status: 'Issued',
      fine_amount: 0,
      issued_by: null
    });

    this.filteredBranches = [];
    this.filteredBooksList = [];
    this.filteredStudents = [];

    this.showModal = true;
  }

  openEdit(issue: any) {

    // ✅ IMPORTANT FIX
    this.editId = issue.id?.toString();

    this.filteredBranches = this.branches.filter(
      (b: any) => Number(b.school_id) === Number(issue.school_id)
    );

    this.filteredBooksList = this.books.filter(
      (b: any) => Number(b.branch_id) === Number(issue.branch_id)
    );

    this.filteredStudents = this.students.filter(
      (s: any) => Number(s.branch_id) === Number(issue.branch_id)
    );

    this.issueForm.patchValue({
      ...issue,
      issue_date: issue.issue_date?.substring(0, 10),
      due_date: issue.due_date?.substring(0, 10),
      return_date: issue.return_date ? issue.return_date.substring(0, 10) : null
    });

    this.showModal = true;
  }

  /* ================= SAVE ================= */

  save() {

    if (this.issueForm.invalid) {
      this.notify.error('Please fill all required fields');
      return;
    }

    const payload = {
      ...this.issueForm.value,
      school_id: Number(this.issueForm.value.school_id),
      branch_id: Number(this.issueForm.value.branch_id),
      book_id: Number(this.issueForm.value.book_id),
      student_id: Number(this.issueForm.value.student_id),
      fine_amount: Number(this.issueForm.value.fine_amount || 0),
      issued_by: Number(this.issueForm.value.issued_by),
      return_date: this.issueForm.value.return_date || null
    };

    this.loading = true;

    const request$ = this.editId !== null
      ? this.service.updateLibraryBookIssue(this.editId, payload)
      : this.service.createLibraryBookIssue(payload);

    request$.subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success(this.editId ? 'Updated successfully' : 'Added successfully');
          this.showModal = false;
          this.loadIssues();
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

  delete(id: number) {

    if (!confirm('Delete this record?')) return;

    this.service.deleteLibraryBookIssue(id.toString()).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success('Deleted successfully');
          this.loadIssues();
        } else {
          this.notify.error('Delete failed');
        }
      },
      error: () => this.notify.error('Server error')
    });
  }
}


