import {ActivatedRoute, Router} from '@angular/router';
import {Component, OnInit, ViewChild} from '@angular/core';

import {JobMetadataResponse} from '../shared/model/JobMetadataResponse';
import {TaskMetadata} from '../shared/model/TaskMetadata';
import {JobTabsComponent} from "./tabs/tabs.component";
import {JobPanelsComponent} from "./panels/panels.component";
import {SettingsService} from "../core/settings.service";
import {URLSearchParamsUtils} from "../shared/utils/url-search-params.utils";

@Component({
  selector: 'jm-job-details',
  templateUrl: './job-details.component.html',
  styleUrls: ['./job-details.component.css'],
})
export class JobDetailsComponent implements OnInit {
  @ViewChild(JobTabsComponent) taskTabs;
  @ViewChild(JobPanelsComponent) jobPanels;
  public job: JobMetadataResponse;

  projectId: string;
  primaryLabels: string[] = [];

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly settingsService: SettingsService) {}

  ngOnInit(): void {
    this.job = this.route.snapshot.data['job'];
    const req = URLSearchParamsUtils.unpackURLSearchParams(this.route.snapshot.queryParams['q']);
    this.projectId = req.extensions.projectId || '';
    if (this.settingsService.getSavedSettingValue('displayColumns', this.projectId)) {
      this.primaryLabels = this.settingsService.getSavedSettingValue('displayColumns', this.projectId).filter(field => field.match('labels.')).map(field => field.replace('labels.',''));
    } else {
      this.primaryLabels = Object.keys(this.job.labels);
    }
  }

  hasTabs(): boolean {
    if (this.objectNotEmpty(this.job.inputs) || this.objectNotEmpty(this.job.outputs) || this.objectNotEmpty(this.job.failures) || this.objectNotEmpty(this.job.labels)) {
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
