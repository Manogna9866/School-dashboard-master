import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Culturalactivities } from './culturalactivities';

describe('Culturalactivities', () => {
  let component: Culturalactivities;
  let fixture: ComponentFixture<Culturalactivities>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Culturalactivities]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Culturalactivities);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
