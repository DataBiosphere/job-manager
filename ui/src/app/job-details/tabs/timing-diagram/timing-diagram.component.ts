import { Component, Input, OnInit } from '@angular/core';
import { GoogleChartInterface } from 'ng2-google-charts/ng2-google-charts';
import { TaskMetadata } from "../../../shared/model/TaskMetadata";

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
      if (task.shards && task.executionEvents) {
        task.executionEvents.forEach((event) => {
              this.timelineChart.dataTable.push(this.formatRow(task.name + ' shard ' + event.shardIndex + ' attempt ' + event.attemptNumber, event.name, event));
          });
        chartRows = chartRows + task.shards.length;
      } else if (task.name && task.start && task.executionEvents) {
          task.executionEvents.forEach((event) => {
            this.timelineChart.dataTable.push(this.formatRow(task.name + ' attempt ' + event.attemptNumber, event.name, event));
          });
        chartRows++;
      }
    });

    this.timelineChart.options = {
      timeline: {
        showRowLabels: false,
        showBarLabels: false
      },
      width: this.tabWidth - 65,
      height: (chartRows * 42) + 120,
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
