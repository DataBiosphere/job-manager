import {Component, Input, OnInit} from '@angular/core';

import {IndividualAttempt} from "../../../shared/model/IndividualAttempt";
import {JobStatus} from "../../../shared/model/JobStatus";
import {JobStatusIcon, objectNotEmpty} from "../../../shared/common";

@Component({
  selector: 'jm-attempt',
  templateUrl: './attempt.component.html',
  styleUrls: ['./attempt.component.css']
})
export class JobAttemptComponent implements OnInit {
  @Input() attempt: IndividualAttempt;
  @Input() jobId: string;

  ngOnInit() {
    if (this.attempt) {
      this.attempt.start = new Date(this.attempt.start);
      this.attempt.end = new Date(this.attempt.end);
    }
  }

  getStatusIcon(status: string): string {
    return JobStatusIcon[JobStatus[status]];
  }

  hasInputs(attempt: IndividualAttempt): boolean {
    return objectNotEmpty(attempt.inputs);
  }

  hasOutputs(attempt: IndividualAttempt): boolean {
    return objectNotEmpty(attempt.outputs);
  }

  hasFailures(attempt: IndividualAttempt): boolean {
    return objectNotEmpty(attempt.failureMessages);
  }

  getFailures(attempt: IndividualAttempt): string {
    if (this.hasFailures(attempt)) {
      return attempt.failureMessages.join('\n');
    }
  }
}
