import {Component, Input, OnInit} from '@angular/core';
import {StatusCounts} from "../../shared/model/StatusCounts";

@Component({
  selector: 'jm-total-summary',
  templateUrl: './total-summary.component.html',
  styleUrls: ['./total-summary.component.css']
})
export class TotalSummaryComponent implements OnInit {
  @Input() summary: StatusCounts;

  constructor() { }

  ngOnInit() {}

}
