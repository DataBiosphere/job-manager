import {TestBed, async} from '@angular/core/testing';

import {DurationPipe} from './duration.pipe';

describe('DurationPipe', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        DurationPipe
      ],
      providers: [
        DurationPipe
      ]
    }).compileComponents();
  }));


  it('should transform a start and end time into a duration ', () => {
    let pipe = new DurationPipe();
    let start: Date = new Date("1994-03-29T20:30:25");
    let end: Date = new Date("1994-03-29T22:45:25");

    expect(pipe.transform(start, end))
      .toBe('2h 15m');
  });

});
