import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacultyLeave } from './faculty-leave';

describe('FacultyLeave', () => {
  let component: FacultyLeave;
  let fixture: ComponentFixture<FacultyLeave>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacultyLeave]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacultyLeave);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
