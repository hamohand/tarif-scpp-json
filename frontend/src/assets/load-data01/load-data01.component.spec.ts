import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadData01Component } from './load-data01.component';

describe('LoadData01Component', () => {
  let component: LoadData01Component;
  let fixture: ComponentFixture<LoadData01Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadData01Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LoadData01Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
