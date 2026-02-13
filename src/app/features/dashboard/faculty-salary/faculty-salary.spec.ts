import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacultySalary } from './faculty-salary';

describe('FacultySalary', () => {
  let component: FacultySalary;
  let fixture: ComponentFixture<FacultySalary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacultySalary]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacultySalary);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
