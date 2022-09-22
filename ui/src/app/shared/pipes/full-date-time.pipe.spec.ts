import { DatePipe } from '@angular/common';
import { async, TestBed } from '@angular/core/testing';
import { FullDateTimePipe } from "./full-date-time.pipe";


describe('FullDateTimeFormat', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        FullDateTimePipe
      ],
      providers: [
        DatePipe,
        FullDateTimePipe
      ]
    }).compileComponents();
  }));

  it('should transform full time properly', () => {
    let pipe = new FullDateTimePipe(new DatePipe('en-US'));
    let testDate: Date = new Date("1994-03-29T22:36:25");

    expect(pipe.transform(testDate))
      .toBe('Mar 29, 1994 10:36:25 PM');
  });

});
