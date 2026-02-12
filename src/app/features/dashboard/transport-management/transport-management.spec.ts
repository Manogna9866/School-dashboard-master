import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransportManagement } from './transport-management';

describe('TransportManagement', () => {
  let component: TransportManagement;
  let fixture: ComponentFixture<TransportManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransportManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransportManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
