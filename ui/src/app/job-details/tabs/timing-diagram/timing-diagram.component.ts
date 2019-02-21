import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {TaskMetadata} from "../../../shared/model/TaskMetadata";
import { GoogleChartInterface } from 'ng2-google-charts/google-charts-interfaces';

@Component({
  selector: 'jm-timing-diagram',
  templateUrl: './timing-diagram.component.html',
  styleUrls: ['./timing-diagram.component.css'],
})
export class JobTimingDiagramComponent implements OnInit {
  @Input() metadata: TaskMetadata[] = [];
  @Input('tabWidth') tabWidth;
  timelineChart: GoogleChartInterface;

  ngOnInit(): void {
    this.buildTimelineData(this.metadata);
  }

  buildTimelineData(metadata: TaskMetadata[]): void {
    this.timelineChart = {
      chartType: 'Timeline',
      dataTable: []
    };
    this.timelineChart.dataTable.push([
      {'type': 'string', 'id': 'Task'},
      {'type': 'string', 'id': 'Section'},
      {'type': 'date', 'purpose': 'Start', 'id': 'Start'},
      {'type': 'date', 'purpose': 'End', 'id': 'End'}
    ]);
    let chartRows = 1;

    metadata.forEach((task) => {
      if (task.name && task.start) {
        if (task.executionEvents) {
          task.executionEvents.forEach((event) => {
            this.timelineChart.dataTable.push(this.formatRow(task.name, event.name, event));
          });
        } else {
          this.timelineChart.dataTable.push(this.formatRow(task.name, task.name, task));
        }
        chartRows++;
      }
    });

    this.timelineChart.options = {
      timeline: {
        showRowLabels: false,
        showBarLabels: false
      },
      width: this.tabWidth - 65,
      height: (chartRows * 42) + 100,
      avoidOverlappingGridLines: false
    };
  }

  private formatRow(task, section, data) {
    if (data.end) {
      return [task, section, new Date(data.start), new Date(data.end)];
    }
    return [task, section, new Date(data.start), new Date()];
  }
}
