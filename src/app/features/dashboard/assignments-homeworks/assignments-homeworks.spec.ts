import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignmentsHomeworks } from './assignments-homeworks';

describe('AssignmentsHomeworks', () => {
  let component: AssignmentsHomeworks;
  let fixture: ComponentFixture<AssignmentsHomeworks>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignmentsHomeworks]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignmentsHomeworks);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
