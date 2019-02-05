import {Component, Input, OnInit} from '@angular/core';
import {TaskMetadata} from "../../../shared/model/TaskMetadata";
import { GoogleChartInterface } from 'ng2-google-charts/google-charts-interfaces';

@Component({
  selector: 'jm-timing-diagram',
  templateUrl: './timing-diagram.component.html',
  styleUrls: ['./timing-diagram.component.css'],
})
export class JobTimingDiagramComponent implements OnInit {
  @Input() metadata: TaskMetadata[] = [];
  timelineChart: GoogleChartInterface = {
    chartType: 'Timeline',
    dataTable: []
  };

  ngOnInit(): void {
    this.timelineChart.dataTable.push(['Name', 'From', 'To']);
    this.metadata.forEach((task) => {
      this.timelineChart.dataTable.push([task.name, task.start, task.end]);
    })
  }
}
