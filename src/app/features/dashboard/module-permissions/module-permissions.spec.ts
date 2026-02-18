import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModulePermissions } from './module-permissions';

describe('ModulePermissions', () => {
  let component: ModulePermissions;
  let fixture: ComponentFixture<ModulePermissions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModulePermissions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModulePermissions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
