import {Component, Inject, ViewChild} from "@angular/core";
import {MAT_DIALOG_DATA} from "@angular/material";
import {JobManagerService} from "../../../core/job-manager.service";
import {Shard} from "../../../shared/model/Shard";
import {JobStatus} from "../../../shared/model/JobStatus";
import {JobStatusIcon, objectNotEmpty} from "../../../shared/common";

@Component({
  selector: 'jm-scattered-attempts-component',
  templateUrl: 'scattered-attempts.component.html',
  styleUrls: ['scattered-attempts.component.css']
})
export class JobScatteredAttemptsComponent {
  @ViewChild('dialogContainer') dialogContainer: HTMLElement;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly jobManagerService: JobManagerService) {
  }

  getShardAttempts(shard: Shard) {
    this.jobManagerService.getShardAttempts(this.data.shardsData.taskId, this.data.shardsData.taskName, shard.shardIndex).then((response) => {
      shard.attemptsData = response.attempts;
    });
  }

  getStatusIcon(status: JobStatus): string {
    return JobStatusIcon[status];
  }

  hasFailures(shard: Shard): boolean {
    return objectNotEmpty(shard.failureMessages);
  }

  getFailures(shard: Shard): string {
    if (this.hasFailures(shard)) {
      return shard.failureMessages.join('\n');
    }
  }

  getJobId(): string {
    return this.data.shardsData.taskId;
  }
}
