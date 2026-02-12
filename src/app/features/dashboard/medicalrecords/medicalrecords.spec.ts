import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Medicalrecords } from './medicalrecords';

describe('Medicalrecords', () => {
  let component: Medicalrecords;
  let fixture: ComponentFixture<Medicalrecords>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Medicalrecords]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Medicalrecords);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
