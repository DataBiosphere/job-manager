import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import {FormControl} from '@angular/forms';
import {
  MdAutocomplete,
  MdButton,
  MdCard,
  MdFormField,
  MdOption,
  MdSnackBar,
  MdSnackBarConfig
} from '@angular/material'
import {ActivatedRoute, Router} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';

import {AuthService} from '../core/auth.service';
import {ErrorMessageFormatterPipe} from '../shared/error-message-formatter.pipe';
import {ProjectsService} from './projects.service'

@Component({
  selector: 'jm-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css'],
})
export class ProjectsComponent implements OnInit {
  @ViewChild('auto') auto: ElementRef;
  projectsControl: FormControl;
  projectsObservable: Observable<any[]>;
  projects: any[];

  constructor(
    private readonly authService: AuthService,
    private readonly projectsService: ProjectsService,
    private readonly router: Router,
    private readonly viewContainer: ViewContainerRef,
    private errorBar: MdSnackBar) {}

  private getProject(name: string): any {
    if (this.projects) {
      for (let project of this.projects) {
        if (name == project.name) {
          return project;
        }
      }
    }
    return undefined;
  }

  private navigateToJobsPage(project: any) {
    this.router.navigate(['jobs'], {queryParams: {parentId: project.name}})
  }

  ngOnInit() {
    this.projectsControl = new FormControl();
    this.projectsControl.valueChanges
      .debounceTime(100)
      .subscribe(filter => this.updateProjects(filter));
  }

  handleError(error: any) {
    this.errorBar.open(
      new ErrorMessageFormatterPipe().transform(error),
      'Dismiss',
      {
        viewContainerRef: this.viewContainer,
        duration: 3000,
      });
  }

  updateProjects(filter: string) {
    filter = filter ? filter + '*' : '*';
    this.projectsObservable = Observable.fromPromise(
      this.projectsService.listProjects(filter)
        .then(projects => {
          this.projects = projects ? projects : [];
          // If the currently entered string is a valid job name, hide the
          // autocomplete menu so that the user can click the button
          return this.viewJobsEnabled()
            ? []
            : this.projects.map(project => project["name"]);
        })
      .catch(response => this.handleError(response))
    );
  }

  viewJobs() {
    let project = this.getProject(this.projectsControl.value);
    this.projectsService.getGenomicsEnabled(project.projectNumber).then(() => {
      this.navigateToJobsPage(project);
    }).catch(response => this.handleError(response))
  }

  viewJobsEnabled(): boolean {
    return this.getProject(this.projectsControl.value);
  }
}
