import {TestBed, async, inject} from '@angular/core/testing';

import {ShortDateTimePipe} from './short-date-time.pipe';
import {DatePipe} from '@angular/common';

describe('ShortDateTimeFormat', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ShortDateTimePipe
      ],
      providers: [
        DatePipe,
        ShortDateTimePipe
      ]
    }).compileComponents();
  }));

  it('should transform current time without day', inject([DatePipe],
    (datePipe) => {
      let pipe = new ShortDateTimePipe('en-US');
      let testDate: Date = new Date();

      expect(pipe.transform(testDate))
        .toBe(datePipe.transform(testDate, 'shortTime'));
  }));

  it('should transform previous time with day', () => {
    let pipe = new ShortDateTimePipe('en-US');
    let testDate: Date = new Date("1994-03-29T22:36:25");

    expect(pipe.transform(testDate))
      .toBe('Mar 29 · 10:36 PM');
  });

});
