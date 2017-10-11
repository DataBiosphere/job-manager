import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {JobMetadataResponse} from '../model/JobMetadataResponse';
import {TaskMetadata} from '../model/TaskMetadata';

@Component({
  templateUrl: './job-details.component.html',
  styleUrls: ['./job-details.component.css'],
})
export class JobDetailsComponent implements OnInit {
  private job: JobMetadataResponse;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.job = this.route.snapshot.data['job'];
  }

  hasTasks(): boolean {
    let tasks: TaskMetadata[] = this.job.tasks || [];
    return tasks.length > 0;
  }
}
