import {Component, Input, OnInit} from '@angular/core';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';

import {AuthService} from '../../../core/auth.service';
import {ResourceUtils} from "../../../shared/utils/resource-utils";
import {GcsService} from "../../../core/gcs.service";
import {MatDialog} from "@angular/material/dialog";
import {MatSnackBar} from "@angular/material/snack-bar";
import {JobResourceContentsComponent} from "./resource-contents/resource-contents.component";
import {ErrorMessageFormatterPipe} from "../../../shared/pipes/error-message-formatter.pipe";
import {JsonPipe} from "@angular/common";
import {CapabilitiesResponse} from "../../../shared/model/CapabilitiesResponse";
import {CapabilitiesService} from "../../../core/capabilities.service";
import {SamService} from "../../../core/sam.service";
import {FileContents} from "../../../shared/model/FileContents";

@Component({
  selector: 'jm-debug-icons',
  templateUrl: './debug-icons.component.html',
  styleUrls: ['./debug-icons.component.css']
})
export class JobDebugIconsComponent implements OnInit {
  @Input() displayMessage: boolean;
  @Input() operationId: string;
  @Input() jobId: string;
  @Input() message: string;
  @Input() backendLog: string;
  @Input() directory: string;
  logFileData: Map<string, string> = new Map();
  private readonly canGetFileContents:boolean;
  private readonly capabilities: CapabilitiesResponse;
  private readonly gcpBatchOperationIdRegex = 
    new RegExp("^projects/\(?<projectId>[^/]+\)/locations/\(?<location>[^/]+\)/jobs/job-\(?<batchJobId>[-a-fA-F0-9]+\)$", "i");

  constructor(private readonly authService: AuthService,
              private readonly gcsService: GcsService,
              private readonly snackBar: MatSnackBar,
              private readonly sanitizer:DomSanitizer,
              public resourceContentsDialog: MatDialog,
              private readonly capabilitiesService: CapabilitiesService,
              private readonly samService: SamService) {
    this.capabilities = capabilitiesService.getCapabilitiesSynchronous();
    this.canGetFileContents = this.authService.gcsReadAccess ||
      (this.capabilities.authentication && this.capabilities.authentication.outsideAuth);
  }

  async ngOnInit(): Promise<void> {
    try {
      if (this.authService.isAuthenticated() && this.canGetFileContents) {
        if (this.backendLog) {
          this.getLogContents(this.backendLog).then((value) => {
            this.logFileData[this.getFileName(this.backendLog)] = value;
          }).catch(error => {
            this.handleError(error);
          });
        }
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  getResourceUrl(url: string): string {
    if (!url || !ResourceUtils.isResourceURL(url) || (this.canGetFileContents && !this.hasContents(this.getFileName(url)))) {
      return '';
    }
    return ResourceUtils.getResourceBrowserURL(url, this.authService.userEmail);
  }

  getDirectoryUrl(directory): SafeUrl {
    if (directory && ResourceUtils.isResourceURL(directory)) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(ResourceUtils.getDirectoryBrowserURL(directory, this.authService.userEmail));
    }
    return '';
  }

  hasContents(fileName: string): boolean {
    return Object.keys(this.logFileData).includes(fileName) && this.logFileData[fileName] != '';
  }

  // Corresponds to running in Terra with the PAPIv2 Google backend. Operation details
  // are requested from JM server, which gets them from Rawls, which gets them from GCP.
  // Users are shown a large JSON in a modal.
  hasBackendOperationalDetails(): boolean {
    return this.capabilities.authentication && this.capabilities.authentication.outsideAuth && !!this.operationId && !this.hasExternalOperationalDetails();
  }

  // Corresponds to running with the Google Batch backend. We link directly to the GCP console
  // to show users operation details. 
  hasExternalOperationalDetails(): boolean {
    return this.getOperationalDetailsUrl() != '';
  }

  showOrLinkTo(e: MouseEvent, url: string): void {
    e.stopPropagation();
    if (this.hasContents(this.getFileName(url))) {
      this.resourceContentsDialog.open(JobResourceContentsComponent, {
        disableClose: false,
        data: {
          resourceName: this.getFileTitle(url),
          resourceContents: this.logFileData[this.getFileName(url)],
          resourceLink: this.getResourceUrl(url),
          resourceType: 'text'
        }
      });
    } else if (url) {
      window.open(this.getResourceUrl(url));
    }
  }

  // If this is a GCP Batch operation, transform the operation id into a URL to the Batch job details page.
  // Example input: projects/broad-dsde-cromwell-dev/locations/us-central1/jobs/job-1a4f7cff-3f17-49bf-b9ef-48b8b09c0f39
  // Example output: https://console.cloud.google.com/batch/jobsDetail/regions/us-central1/jobs/job-1a4f7cff-3f17-49bf-b9ef-48b8b09c0f39/details?project=broad-dsde-cromwell-dev
  getOperationalDetailsUrl(): string {
    var match = this.gcpBatchOperationIdRegex.exec(this.operationId);
    if (match != null) {
      var projectId = match.groups.projectId;
      var location = match.groups.location;
      var batchJobId = match.groups.batchJobId;
      return `https://console.cloud.google.com/batch/jobsDetail/regions/${location}/jobs/job-${batchJobId}/details?project=${projectId}`;
    }
    else {
      return '';
    }
  }

  showOperationDetails(e: MouseEvent): void {
    e.stopPropagation();
    this.samService.getOperationDetails(this.jobId, this.operationId)
      .then((response) => {
        if (response && response.details) {
          this.resourceContentsDialog.open(JobResourceContentsComponent, {
            disableClose: false,
            data: {
              resourceName: this.operationId,
              resourceContents: new JsonPipe().transform(JSON.parse(response.details)),
              resourceLink: '',
              resourceType: 'json'
            }
          });
        }
    });
  }

  private async getLogContents(url: string): Promise<string> {
    const bucket = ResourceUtils.getResourceBucket(url);
    const object = ResourceUtils.getResourceObject(url);
    if (this.authService.gcsReadAccess) {
      try {
        return await this.gcsService.readObject(bucket, object)
          .then(data => data);
      } catch (error) {
        this.handleError(error);
      }
    }
    else if (this.capabilities.authentication.outsideAuth) {
      try {
        return await this.samService.getFileTail(bucket, object)
          .then((data: FileContents) => {
            if (data && data.contents) {
              if (data.truncated) {
                return '...\n\n' + data.contents;
              }
              return data.contents;
            } else {
              return '';
            }
          });
      } catch (error) {
        this.handleError(error);
      }
    }
  }

  private getFileName(filePath: string): string {
    if (filePath) {
      const fileParts = filePath.split('/');
      return fileParts.pop();
    }
  }

  private getFileTitle(filePath: string): string {
    if (filePath) {
      const fileParts = filePath.split('/');
      return fileParts.slice(-2).join('/');
    }

  }

  handleError(error: any) {
    this.snackBar.open(
      new ErrorMessageFormatterPipe().transform(error),
      'Dismiss');
  }
}
