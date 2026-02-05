import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Examscrores } from './examscrores';

describe('Examscrores', () => {
  let component: Examscrores;
  let fixture: ComponentFixture<Examscrores>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Examscrores]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Examscrores);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
