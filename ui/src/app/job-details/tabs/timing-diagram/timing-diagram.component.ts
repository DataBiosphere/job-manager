import {Component, Input, OnInit} from '@angular/core';
import {
  ChartReadyEvent,
  ChartErrorEvent,
  ChartSelectEvent,
  ChartMouseOverEvent,
  ChartMouseOutEvent
} from 'ng2-google-charts';
import { GoogleChartInterface } from 'ng2-google-charts/google-charts-interfaces';
import {TaskMetadata} from "../../../shared/model/TaskMetadata";

@Component({
  selector: 'jm-timing-diagram',
  templateUrl: './timing-diagram.component.html',
  styleUrls: ['./timing-diagram.component.css'],
})
export class JobTimingDiagramComponent implements OnInit {
  @Input() metadata: TaskMetadata[] = [];
  timelineChart: object;

  constructor(
  ) {}

  ngOnInit(): void {
    let dates = [['Name', 'From', 'To']];
    this.metadata.forEach((task) => {
      dates.push([task.name, task.start, task.end]);
    })
    this.timelineChart = {
      chartType: 'Timeline',
      dataTable: dates
    };
    console.log(this.timelineChart);
  }

}
