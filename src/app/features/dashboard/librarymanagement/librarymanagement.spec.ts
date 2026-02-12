import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Librarymanagement } from './librarymanagement';

describe('Librarymanagement', () => {
  let component: Librarymanagement;
  let fixture: ComponentFixture<Librarymanagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Librarymanagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Librarymanagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
