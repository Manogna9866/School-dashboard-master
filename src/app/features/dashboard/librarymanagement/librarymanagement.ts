import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-librarymanagement',
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './librarymanagement.html',
  styleUrl: './librarymanagement.scss',
})
export class Librarymanagement {
  schools: any[] = [];
branches: any[] = [];
filteredBranches: any[] = [];

books: any[] = [];
filteredBooks: any[] = [];
paginatedBooks: any[] = [];

pages: number[] = [];
currentPage = 1;
pageSize = 5;

searchText = '';
showModal = false;
editId: string | null = null;
loading = false;

bookForm!: FormGroup;

private service = inject(AuthService);
private fb = inject(FormBuilder);
private notify = inject(NotifyService);

ngOnInit() {

  this.bookForm = this.fb.group({
    school_id: ['', Validators.required],
    branch_id: ['', Validators.required],
    title: ['', Validators.required],
    author: ['', Validators.required],
    category: ['', Validators.required],
    isbn_number: ['', Validators.required],
    copies_total: ['', Validators.required],
    copies_available: ['', Validators.required],
    availability_status: ['Available', Validators.required],
    remarks: ['']
  });

  this.loadSchools();
  this.loadBranches();
  this.loadBooks();

  /* 🔥 SCHOOL CHANGE → FILTER BRANCHES */
  this.bookForm.get('school_id')?.valueChanges.subscribe(schoolId => {

    if (!schoolId) {
      this.filteredBranches = [];
      this.bookForm.patchValue({ branch_id: '' });
      return;
    }

    this.filteredBranches = this.branches.filter(
      (b: any) => b.school_id == schoolId
    );

    this.bookForm.patchValue({ branch_id: '' });
  });

  /* 🔥 BRANCH CHANGE → ENSURE SCHOOL MATCH */
  this.bookForm.get('branch_id')?.valueChanges.subscribe(branchId => {

    if (!branchId) return;

    const selectedBranch = this.branches.find(
      (b: any) => b.id == branchId
    );

    if (selectedBranch) {
      this.bookForm.patchValue({
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

loadBooks() {
  this.loading = true;

  this.service.getBooks().subscribe({
    next: (res: any) => {
      if (res.success) {
        this.books = Array.isArray(res.data?.data)
          ? res.data.data
          : [];
        this.applyFilter();
      } else {
        this.notify.error('Failed to load books');
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

  this.filteredBooks = this.books.filter(b =>
    b.title?.toLowerCase().includes(text) ||
    b.author?.toLowerCase().includes(text) ||
    b.category?.toLowerCase().includes(text) ||
    b.isbn_number?.includes(text)
  );

  this.currentPage = 1;
  this.updatePagination();
}

/* ================= PAGINATION ================= */

updatePagination() {
  const start = (this.currentPage - 1) * this.pageSize;
  const end = start + this.pageSize;

  this.paginatedBooks = this.filteredBooks.slice(start, end);

  const totalPages = Math.ceil(this.filteredBooks.length / this.pageSize);
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

  this.bookForm.reset({
    availability_status: 'Available'
  });

  this.filteredBranches = [];
  this.showModal = true;
}

openEdit(book: any) {
  this.editId = book.id;

  this.filteredBranches = this.branches.filter(
    (b: any) => b.school_id == book.school_id
  );

  this.bookForm.patchValue(book);
  this.showModal = true;
}

/* ================= SAVE ================= */

save() {

  if (this.bookForm.invalid) {
    this.notify.error('Please fill all required fields');
    return;
  }

  const payload = {
    ...this.bookForm.value,
    school_id: Number(this.bookForm.value.school_id),
    branch_id: Number(this.bookForm.value.branch_id),
    copies_total: Number(this.bookForm.value.copies_total),
    copies_available: Number(this.bookForm.value.copies_available)
  };

  this.loading = true;

  const request$ = this.editId
    ? this.service.updateBook(this.editId, payload)
    : this.service.createBook(payload);

  request$.subscribe({
    next: (res: any) => {
      if (res.success) {
        this.notify.success(this.editId ? 'Book updated' : 'Book created');
        this.showModal = false;
        this.loadBooks();
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
  if (!confirm('Delete this book?')) return;

  this.loading = true;

  this.service.deleteBook(id).subscribe({
    next: (res: any) => {
      if (res.success) {
        this.notify.success('Book deleted');
        this.loadBooks();
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
