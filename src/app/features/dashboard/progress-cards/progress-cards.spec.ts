import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressCards } from './progress-cards';

describe('ProgressCards', () => {
  let component: ProgressCards;
  let fixture: ComponentFixture<ProgressCards>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressCards]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProgressCards);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
