import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-students',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './students.html',
  styleUrl: './students.scss',
})
export class Students {
   students: any[] = [];
  filteredStudents: any[] = [];
  paginatedStudents: any[] = [];
  schools: any[] = [];
  branches: any[] = [];

  pages: number[] = [];
  currentPage = 1;
  pageSize = 5;

  searchText = '';
  showModal = false;
  editId: string | null = null;
  loading = false;

  studentForm!: FormGroup;

  selectedFile: File | null = null;
  photoPreview: string | null = null;

  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  ngOnInit() {
    this.studentForm = this.fb.group({
      school_id: ['', Validators.required],
      branch_id: ['', Validators.required],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      gender: ['', Validators.required],
      date_of_birth: ['', Validators.required],
      aadhaar_number: [''],
      class_id: ['', Validators.required],
      roll_number: ['', Validators.required],
      phone_number: ['', Validators.required],
      email: ['', Validators.required],
      address: ['', Validators.required],
      admission_date: ['', Validators.required],
      status: ['Active', Validators.required],
      profile_photo: ['']
    });

    this.loadSchools();
    this.loadStudents();

    // 🔥 School change auto load branches
    this.studentForm.get('school_id')?.valueChanges.subscribe((schoolId) => {
      if (schoolId) {
        this.loadBranchesBySchool(Number(schoolId));
      } else {
        this.branches = [];
        this.studentForm.patchValue({ branch_id: '' });
      }
    });
  }

  /* ================= FILE ================= */

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.photoPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  /* ================= LOAD ================= */

  loadSchools() {
    this.service.getSchools().subscribe({
      next: (res: any) => {
        this.schools = res.success && res.data?.data ? res.data.data : [];
      },
      error: () => this.notify.error('Failed to load schools')
    });
  }

  loadBranchesBySchool(schoolId: number) {
    this.service.getBranches().subscribe({
      next: (res: any) => {
        if (res.success && res.data?.data) {
          this.branches = res.data.data.filter(
            (b: any) => Number(b.school_id) === Number(schoolId)
          );
        } else {
          this.branches = [];
        }
      },
      error: () => {
        this.notify.error('Failed to load branches');
        this.branches = [];
      }
    });
  }

  loadStudents() {
    this.loading = true;

    this.service.getstudents().subscribe({
      next: (res: any) => {
        this.students = res.success && Array.isArray(res.data?.data)
          ? res.data.data
          : [];

        this.applyFilter();
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

    this.filteredStudents = this.students.filter(s =>
      `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase().includes(text) ||
      (s.roll_number || '').toString().includes(text) ||
      (s.class_id || '').toString().includes(text)
    );

    this.currentPage = 1;
    this.updatePagination();
  }

  /* ================= PAGINATION ================= */

  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedStudents = this.filteredStudents.slice(start, end);

    const totalPages = Math.ceil(this.filteredStudents.length / this.pageSize);
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
    this.branches = [];
    this.selectedFile = null;
    this.photoPreview = null;

    this.studentForm.reset({
      status: 'Active'
    });

    this.showModal = true;
  }

  openEdit(student: any) {
    this.editId = student.id;
    this.showModal = true;

    // 🔥 Load branches for selected school
    if (student.school_id) {
      this.loadBranchesBySchool(Number(student.school_id));
    }

    this.studentForm.patchValue({
      school_id: student.school_id,
      branch_id: student.branch_id,
      first_name: student.first_name,
      last_name: student.last_name,
      gender: student.gender,
      date_of_birth: student.date_of_birth,
      aadhaar_number: student.aadhaar_number,
      class_id: student.class_id,
      roll_number: student.roll_number,
      phone_number: student.phone_number,
      email: student.email,
      address: student.address,
      admission_date: student.admission_date,
      status: student.status
    });

    // 🔥 Show existing profile photo
    if (student.profile_photo) {
      this.photoPreview = student.profile_photo;
    }
  }

  /* ================= SAVE ================= */

  save() {

    if (this.studentForm.invalid) {
      this.notify.error('Please fill all required fields');
      return;
    }

    this.loading = true;

    const formValues = this.studentForm.value;
    const formData = new FormData();

    formData.append('school_id', String(Number(formValues.school_id)));
    formData.append('branch_id', String(Number(formValues.branch_id)));
    formData.append('class_id', String(Number(formValues.class_id)));

    formData.append('first_name', formValues.first_name || '');
    formData.append('last_name', formValues.last_name || '');
    formData.append('gender', formValues.gender || '');
    formData.append('date_of_birth', formValues.date_of_birth || '');
    formData.append('aadhaar_number', formValues.aadhaar_number || '');
    formData.append('roll_number', formValues.roll_number || '');
    formData.append('phone_number', formValues.phone_number || '');
    formData.append('email', formValues.email || '');
    formData.append('address', formValues.address || '');
    formData.append('admission_date', formValues.admission_date || '');
    formData.append('status', formValues.status || 'Active');

    formData.append('discontinuation_status', 'No');
    formData.append('rejoined', 'No');

    if (this.selectedFile) {
      formData.append('profile_photo', this.selectedFile);
    }

    const request$ = this.editId
      ? this.service.updatestudent(this.editId, formData)
      : this.service.createstudent(formData);

    request$.subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success(this.editId ? 'Student updated' : 'Student added');
          this.showModal = false;
          this.selectedFile = null;
          this.photoPreview = null;
          this.searchText = '';
          this.loadStudents();
        } else {
          this.notify.error(res.message || 'Operation failed');
        }
        this.loading = false;
      },
      error: (err) => {
        console.error("Student Save Error:", err);
        this.notify.error(err?.error?.message || 'Server error');
        this.loading = false;
      }
    });
  }

  /* ================= DELETE ================= */

  delete(id: string) {
    if (!confirm('Delete this student?')) return;

    this.loading = true;

    this.service.deletestudent(id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success('Student deleted');
          this.loadStudents();
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
