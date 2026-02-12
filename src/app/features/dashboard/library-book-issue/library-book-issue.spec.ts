import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibraryBookIssue } from './library-book-issue';

describe('LibraryBookIssue', () => {
  let component: LibraryBookIssue;
  let fixture: ComponentFixture<LibraryBookIssue>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibraryBookIssue]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LibraryBookIssue);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
