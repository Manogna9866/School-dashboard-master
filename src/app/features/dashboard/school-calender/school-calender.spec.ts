import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchoolCalender } from './school-calender';

describe('SchoolCalender', () => {
  let component: SchoolCalender;
  let fixture: ComponentFixture<SchoolCalender>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchoolCalender]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SchoolCalender);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
