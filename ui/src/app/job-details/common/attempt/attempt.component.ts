import {Component, Input, OnInit} from '@angular/core';

import {AuthService} from '../../../core/auth.service';
import {ActivatedRoute} from "@angular/router";
import {IndividualAttempt} from "../../../shared/model/IndividualAttempt";
import {JobStatus} from "../../../shared/model/JobStatus";
import {JobStatusIcon} from "../../../shared/common";

@Component({
  selector: 'jm-attempt',
  templateUrl: './attempt.component.html',
  styleUrls: ['./attempt.component.css']
})
export class JobAttemptComponent implements OnInit {
  @Input() attempt: IndividualAttempt;

  constructor(private authService: AuthService,
              private readonly route: ActivatedRoute) {
  }

  ngOnInit() {
    if (this.attempt) {
      this.attempt.start = new Date(this.attempt.start);
      this.attempt.end = new Date(this.attempt.end);
    }
  }

  getStatusIcon(status: string): string {
    return JobStatusIcon[JobStatus[status]];
  }
}
