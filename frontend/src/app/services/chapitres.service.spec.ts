import { TestBed } from '@angular/core/testing';

import { ChapitresService } from './chapitres.service';

describe('ChapitresService', () => {
  let service: ChapitresService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChapitresService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
