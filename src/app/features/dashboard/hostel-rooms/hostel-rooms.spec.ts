import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HostelRooms } from './hostel-rooms';

describe('HostelRooms', () => {
  let component: HostelRooms;
  let fixture: ComponentFixture<HostelRooms>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostelRooms]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HostelRooms);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
