import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HostelAllocation } from './hostel-allocation';

describe('HostelAllocation', () => {
  let component: HostelAllocation;
  let fixture: ComponentFixture<HostelAllocation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostelAllocation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HostelAllocation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
