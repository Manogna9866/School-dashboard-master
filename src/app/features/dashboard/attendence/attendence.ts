import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';
import { NotifyService } from '../../../core/services/notify';

@Component({
  selector: 'app-attendence',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './attendence.html',
  styleUrl: './attendence.scss',
})
export class Attendence {
  /* ================= MASTER DATA ================= */
  schools: any[] = [];
  branches: any[] = [];
  classes: any[] = [];
  students: any[] = [];
  faculty: any[] = [];

  /* ================= ATTENDANCE ================= */
  attendance: any[] = [];
  filteredAttendance: any[] = [];
  paginatedAttendance: any[] = [];

  pages: number[] = [];
  currentPage = 1;
  pageSize = 5;

  searchText = '';
  showModal = false;
  editId: string | null = null;
  loading = false;

  attendanceForm!: FormGroup;

  private service = inject(AuthService);
  private fb = inject(FormBuilder);
  private notify = inject(NotifyService);

  /* ================= INIT ================= */
  ngOnInit(): void {

    this.attendanceForm = this.fb.group({
      school_id: ['', Validators.required],
      branch_id: ['', Validators.required],
      class_id: ['', Validators.required],
      date: ['', Validators.required],
      student_id: ['', Validators.required],
      faculty_id: [''],
      status: ['Present', Validators.required],
      remarks: [''],
      percentage_report: ['0.00', Validators.required],
    });
    this.loadstudents()
    this.loadSchools();
    this.loadClasses();
    this.loadAttendance();


    /* ===== CASCADE LISTENERS ===== */

    // School → Branch
    this.attendanceForm.get('school_id')?.valueChanges.subscribe(value => {
      if (value) {
        this.loadBranchesBySchool(value);
      } else {
        this.branches = [];
      }
      this.attendanceForm.patchValue({ branch_id: '', faculty_id: '' });
    });

    // Branch → Faculty
    this.attendanceForm.get('branch_id')?.valueChanges.subscribe(value => {
      if (value) {
        this.loadFacultyByBranch(value);
      } else {
        this.faculty = [];
      }
      this.attendanceForm.patchValue({ faculty_id: '' });
    });

    // Class → Students
    this.attendanceForm.get('school_id')?.valueChanges.subscribe(value => {

      this.attendanceForm.patchValue({
        branch_id: '',
        class_id: '',
        student_id: ''
      }, { emitEvent: false });

      if (value) {
        this.loadStudentsBySchool(value);
      } else {
        this.students = [];
      }

    });

  }

  /* ================= LOAD MASTER ================= */

  loadSchools() {
    this.service.getSchools().subscribe({
      next: (res: any) => {
        this.schools = res?.success ? res.data?.data || [] : [];
      },
      error: () => this.notify.error('Failed to load schools')
    });
  }

  loadClasses() {
    this.service.getClasses().subscribe({
      next: (res: any) => {
        this.classes = res?.success ? res.data?.data || [] : [];
      },
      error: () => this.notify.error('Failed to load classes')
    });
  }
  loadstudents() {
    this.service.getstudents().subscribe({
      next: (res: any) => {
        this.students = res?.success ? res.data?.data || [] : [];
      },
      error: () => this.notify.error('Failed to load classes')
    });
  }

  loadBranchesBySchool(schoolId: number) {
    this.service.getBranches().subscribe({
      next: (res: any) => {
        this.branches = res?.success
          ? res.data.data.filter((b: any) => b.school_id == schoolId)
          : [];
      },
      error: () => {
        this.branches = [];
        this.notify.error('Failed to load branches');
      }
    });
  }

  loadFacultyByBranch(branchId: number) {
    this.service.getfaculties().subscribe({
      next: (res: any) => {
        this.faculty = res?.success
          ? res.data.data.filter((f: any) => f.branch_id == branchId)
          : [];
      },
      error: () => {
        this.faculty = [];
        this.notify.error('Failed to load faculty');
      }
    });
  }

  loadStudentsBySchool(schoolId: any) {

    if (!schoolId) {
      this.students = [];
      return;
    }

    const sId = Number(schoolId);

    this.service.getstudents().subscribe({
      next: (res: any) => {

        const allStudents = res?.success ? res.data?.data || [] : [];

        this.students = allStudents.filter((s: any) =>
          Number(s.school_id) === sId
        );

        console.log('Filtered students:', this.students);
      },
      error: () => {
        this.students = [];
        this.notify.error('Failed to load students');
      }
    });
  }



  /* ================= ATTENDANCE ================= */

  loadAttendance() {
    this.loading = true;

    this.service.getattendences().subscribe({
      next: (res: any) => {
        this.attendance = res?.success && Array.isArray(res.data?.data)
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

    this.filteredAttendance = this.attendance.filter(a =>
      a.student_id?.toString().includes(text) ||
      a.status?.toLowerCase().includes(text) ||
      a.remarks?.toLowerCase().includes(text)
    );

    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedAttendance = this.filteredAttendance.slice(start, end);

    const totalPages = Math.ceil(this.filteredAttendance.length / this.pageSize);
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
    this.attendanceForm.reset({
      status: 'Present',
      percentage_report: '0.00'
    });
    this.showModal = true;
  }

  /* ✅ UPDATED EDIT METHOD WITH CASCADE SUPPORT */
  openEdit(att: any) {
    this.editId = att.id;
    this.showModal = true;

    // Load dependent dropdowns first
    this.loadBranchesBySchool(att.school_id);
    this.loadFacultyByBranch(att.branch_id);
    this.loadStudentsBySchool(att.school_id);

    // Then patch values
    this.attendanceForm.patchValue({
      school_id: att.school_id,
      branch_id: att.branch_id,
      class_id: att.class_id,
      date: att.date,
      student_id: att.student_id,
      faculty_id: att.faculty_id,
      status: att.status,
      remarks: att.remarks,
      percentage_report: att.percentage_report
    });
  }

  /* ================= SAVE ================= */

  save() {
    if (this.attendanceForm.invalid) {
      this.notify.error('Please fill all required fields');
      return;
    }

    const payload = this.attendanceForm.value;
    this.loading = true;

    const request$ = this.editId
      ? this.service.updateattendence(this.editId, payload)
      : this.service.createattendence(payload);

    request$.subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.notify.success(
            this.editId ? 'Attendance updated' : 'Attendance created'
          );
          this.showModal = false;
          this.loadAttendance();
        } else {
          this.notify.error(res?.message || 'Operation failed');
        }
        this.loading = false;
      },
      error: (err) => {
        this.notify.error(err?.error?.message || 'Server error');
        this.loading = false;
      }
    });
  }

  /* ================= DELETE ================= */

  delete(id: string) {
    if (!confirm('Delete this attendance?')) return;

    this.service.deleteattendence(id).subscribe({
      next: () => {
        this.notify.success('Attendance deleted');
        this.loadAttendance();
      },
      error: () => this.notify.error('Delete failed')
    });
  }
}
