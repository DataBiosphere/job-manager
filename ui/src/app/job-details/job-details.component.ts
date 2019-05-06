import {ActivatedRoute, Router} from '@angular/router';
import {Component, OnInit, ViewChild} from '@angular/core';

import {JobMetadataResponse} from '../shared/model/JobMetadataResponse';
import {TaskMetadata} from '../shared/model/TaskMetadata';
import {JobTabsComponent} from "./tabs/tabs.component";
import {JobPanelsComponent} from "./panels/panels.component";
import {CapabilitiesResponse} from "../shared/model/CapabilitiesResponse";
import {DisplayField} from "../shared/model/DisplayField";
import {CapabilitiesService} from "../core/capabilities.service";

@Component({
  selector: 'jm-job-details',
  templateUrl: './job-details.component.html',
  styleUrls: ['./job-details.component.css'],
})
export class JobDetailsComponent implements OnInit {
  @ViewChild(JobTabsComponent) taskTabs;
  @ViewChild(JobPanelsComponent) jobPanels;
  public job: JobMetadataResponse;
  private readonly capabilities: CapabilitiesResponse;
  primaryLabels: DisplayField[];
  secondaryLabels: DisplayField[];

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly capabilitiesService: CapabilitiesService) {
    this.capabilities = capabilitiesService.getCapabilitiesSynchronous();
  }

  ngOnInit(): void {
    this.job = this.route.snapshot.data['job'];
    this.primaryLabels = this.capabilities.displayFields.filter(field => !field.secondary);
  }

  hasTabs(): boolean {
    if (this.objectNotEmpty(this.job.inputs) || this.objectNotEmpty(this.job.outputs) || this.objectNotEmpty(this.job.failures)) {
       return true;
    }
    if (this.job.extensions) {
      let tasks: TaskMetadata[] = this.job.extensions.tasks || [];
      return tasks.length > 0;
    }
  }

  handleClose(): void {
    this.router.navigate(['jobs'], {
      queryParams: {
        'q': this.route.snapshot.queryParams['q']
      }
    });
  }

  handleNavUp(): void {
    if (this.job.extensions.parentJobId) {
      this.router.navigate(['/jobs/' + this.job.extensions.parentJobId], {
        queryParams: {
          'q': this.route.snapshot.queryParams['q']
        },
        replaceUrl: true,
        skipLocationChange: false
      })
      .then(result => {
        this.handleNav();
      });
    }
  }

  handleNavDown(id: string): void {
    this.router.navigate(['/jobs/' + id], {
      queryParams: {
        'q': this.route.snapshot.queryParams['q']
      },
      replaceUrl: true,
      skipLocationChange: false
    })
    .then(result => {
      this.handleNav();
    });
  }

  hasResources(): boolean {
    return (this.job.extensions && (this.job.extensions.sourceFile || this.job.extensions.logs));
  }

  private handleNav() {
    this.job = this.route.snapshot.data['job'];
    this.jobPanels.job = this.job;
    this.jobPanels.setUpExtensions();
    if (this.taskTabs.failuresTable) {
      this.taskTabs.failuresTable.dataSource = this.job.failures;
    }
    if (this.jobPanels.jobFailures) {
      this.jobPanels.jobFailures.dataSource = this.job.failures.slice(0, this.jobPanels.numOfErrorsToShow);
    }
    if (this.job.extensions.tasks) {
      this.taskTabs.timingDiagram.buildTimelineData(this.job.extensions.tasks);
    }
  }

  private objectNotEmpty(object: object): boolean {
    return object && Object.keys(object).length !== 0;
  }
}
