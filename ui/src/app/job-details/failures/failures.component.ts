import {Component, Input, OnInit} from '@angular/core';
import {JobMetadataResponse} from "../../shared/model/JobMetadataResponse";
import {FailureMessage} from "../../shared/model/FailureMessage";
import {DataSource} from '@angular/cdk/collections';

@Component({
  selector: 'jm-failures',
  templateUrl: './failures.component.html',
  styleUrls: ['./failures.component.css']
})
export class JobFailuresComponent implements OnInit {
  @Input() job: JobMetadataResponse;
  displayedColumns: string[] = ['name', 'message', 'links'];
  dataSource: FailureMessage[] | null;


  constructor() { }

  ngOnInit() {
    this.dataSource = this.job.failures;
  }

}
