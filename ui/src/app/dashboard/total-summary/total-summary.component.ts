import {Component, Input} from '@angular/core';
import {StatusCounts} from "../../shared/model/StatusCounts";

@Component({
  selector: 'jm-total-summary',
  templateUrl: './total-summary.component.html',
  styleUrls: ['./total-summary.component.css']
})
export class TotalSummaryComponent {
  @Input() summary: StatusCounts;

  constructor() {}
}
