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
  timelineChart: GoogleChartInterface;

  ngOnInit(): void {
    this.buildTimelineData(this.metadata);
  }

  buildTimelineData(metadata: TaskMetadata[]): void {
    this.timelineChart = {
      chartType: 'Timeline',
      dataTable: []
    };
    this.timelineChart.dataTable.push(['Num', 'Name', 'Start', 'End']);
    let counter = 1;

    metadata.forEach((task) => {
      if (task.name && task.start) {
        if (task.end) {
          this.timelineChart.dataTable.push([counter.toString(), task.name, task.start, task.end]);
        } else {
          this.timelineChart.dataTable.push([counter.toString(), task.name, task.start, new Date()]);
        }
        counter++;
      }
    })
    this.timelineChart.options = {
      title: 'Tasks',
      width: 800,
      height: counter * 50
    };
  }
}
