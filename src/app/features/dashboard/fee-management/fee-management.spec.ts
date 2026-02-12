import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeeManagement } from './fee-management';

describe('FeeManagement', () => {
  let component: FeeManagement;
  let fixture: ComponentFixture<FeeManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeeManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FeeManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
