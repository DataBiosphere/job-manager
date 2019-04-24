import {Component, Inject, OnInit, ViewChild} from "@angular/core";
import {MAT_DIALOG_DATA} from "@angular/material";
import {JobManagerService} from "../../../core/job-manager.service";
import {TaskShard} from "../../../shared/model/TaskShard";
import {JobStatus} from "../../../shared/model/JobStatus";
import {JobStatusIcon} from "../../../shared/common";

@Component({
  selector: 'jm-scattered-attempts-component',
  templateUrl: 'scattered-attempts.component.html',
  styleUrls: ['scattered-attempts.component.css']
})
export class JobScatteredAttemptsComponent implements OnInit {
  @ViewChild('dialogContainer') dialogContainer: HTMLElement;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly jobManagerService: JobManagerService) {
  }

  ngOnInit(): void {
    // this.dialogContainer.hidden = true;
    // if (this.data.shardsData) {
    //   this.dialogContainer.hidden = false;
    // }
  }

  getShardAttempts(shard: TaskShard) {
    this.jobManagerService.getShardAttempts(this.data.shardsData.taskId, this.data.shardsData.taskName, shard.shardIndex).then((response) => {
      shard.attemptsData = response.attempts;
    });
  }

  getStatusIcon(status: JobStatus): string {
    return JobStatusIcon[status];
  }
}
