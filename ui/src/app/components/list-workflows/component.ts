import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Params} from '@angular/router';

import {JobMonitorService} from '../../job-monitor.service'
import {Workflow, Status} from '../../models/workflow'

@Component({templateUrl: './component.html'})
export class ListWorkflowsComponent implements OnInit {
  private workflows: Workflow[] = [];
  private selectedWorkflows: Workflow[] = [];
  private active: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private jobMonitorService: JobMonitorService
  ) {}
  ngOnInit(): void {
    this.jobMonitorService.listAllWorkflows()
      .then(response => this.workflows = response.results);
  }

  toggleSelect(workflow: Workflow): void {
    if (this.isSelected(workflow)) {
      this.selectedWorkflows
        .splice(this.selectedWorkflows.indexOf(workflow), 1);
    } else {
      this.selectedWorkflows.push(workflow);
    }
  }

  toggleActive(active: boolean): void {
    if (this.active != active) {
      this.active = active;
      this.selectedWorkflows = [];
    }

  }

  areRunning(workflows: Workflow[]): boolean {
    for (let workflow of workflows) {
      if (workflow.status != Status.running) {
        return false;
      }
    }
    return true;
  }

  areActive(workflows: Workflow[]): boolean {
    for (let workflow of workflows) {
      if (this.isFinished(workflow)) {
        return false;
      }
    }
    return true;
  }

  shouldDisplayWorkflow(workflow: Workflow): boolean {
    return this.isFinished(workflow) != this.active;
  }

  private isFinished(workflow: Workflow): boolean {
    return workflow.status == Status.aborting ||
      workflow.status == Status.failed ||
      workflow.status == Status.succeeded ||
      workflow.status == Status.aborted;
  }

  getStatusUrl(status: Status): string {
    switch(status) {
      case Status.submitted:
        return "https://www.gstatic.com/images/icons/material/system/1x/file_upload_grey600_24dp.png";
      case Status.running:
        return "https://www.gstatic.com/images/icons/material/system/1x/autorenew_grey600_24dp.png";
      case Status.paused:
        return "https://www.gstatic.com/images/icons/material/system/1x/pause_grey600_24dp.png";
      case Status.aborting:
        return "https://www.gstatic.com/images/icons/material/system/1x/report_problem_grey600_24dp.png";
      case Status.failed:
        return "https://www.gstatic.com/images/icons/material/system/1x/close_grey600_24dp.png";
      case Status.aborted:
        return "https://www.gstatic.com/images/icons/material/system/1x/report_problem_grey600_24dp.png";
      case Status.succeeded:
        return "https://www.gstatic.com/images/icons/material/system/1x/done_grey600_24dp.png";
    }
  }

  onPauseWorkflow(workflow: Workflow): void {
    this.onPauseWorkflows([workflow]);
  }

  onPauseWorkflows(workflows: Workflow[]): void {
    // TODO(alanhwang): Add this to the API and then implement here
    for (let workflow of workflows) {
      workflow.status = Status.paused;
    }
    this.selectedWorkflows = [];
  }

  onAbortWorkflow(workflow: Workflow): void {
    this.jobMonitorService.abortWorkflow(workflow.id)
      .then(response => workflow.status = response.status);
  }

  onAbortWorkflows(workflows: Workflow[]): void {
    for (let workflow of workflows) {
      this.onAbortWorkflow(workflow);
    }
    this.selectedWorkflows = [];
  }

  onGroupWorkflows(workflows: Workflow[]): void {
    // TODO (Implement)
  }

  isSelected(workflow: Workflow): boolean {
    return this.selectedWorkflows.indexOf(workflow) > -1;
  }
}
