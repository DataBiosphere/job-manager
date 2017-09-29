import {Component, OnInit} from '@angular/core';
import {JobMonitorService} from '../../job-monitor.service';
import {ActivatedRoute} from '@angular/router';
import {JobMetadataResponse} from '../../model/JobMetadataResponse';

@Component({
  templateUrl: './job-details.component.html',
  styleUrls: ['./job-details.component.css'],
})
export class JobDetailsComponent implements OnInit {
  private job: JobMetadataResponse = {
    id: "",
    status: null,
    tasks: [],
    submission: null,
    start: null
  };

  constructor(
    private route: ActivatedRoute,
    private jobMonitorService: JobMonitorService
  ) {}

  ngOnInit(): void {
    this.jobMonitorService.getJob(this.route.snapshot.params['id'])
      .then(response => this.job = response);
  }
}
