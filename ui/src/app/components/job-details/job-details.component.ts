import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {JobMetadataResponse} from '../../model/JobMetadataResponse';

@Component({
  templateUrl: './job-details.component.html',
  styleUrls: ['./job-details.component.css'],
})
export class JobDetailsComponent implements OnInit {
  private job: JobMetadataResponse;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // this.route.data
    //   .subscribe((data: {job: JobMetadataResponse}) => {
    //     this.job = data.job;
    //   })
    this.job = this.route.snapshot.data['job'];
  }
}
