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
  viewJobsEnabled = true;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly projectsService: ProjectsService,
    private readonly viewContainer: ViewContainerRef,
    private errorBar: MdSnackBar) {}

  private validProject(projectId: string): boolean {
    if (this.projects) {
      for (let project of this.projects) {
        if (projectId == project.projectId) {
          return true;
        }
      }
    }
    return false;
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
    filter = filter ? filter + '*' : '.*';
    this.viewJobsEnabled = true;
    this.projectsObservable = Observable.fromPromise(
      this.projectsService.listProjects(filter)
        .then(listView => {
          this.projects = listView.results ? listView.results : [];
          // If the currently entered string is a valid project ID, hide the
          // autocomplete menu so that the user can click the button
          this.viewJobsEnabled = this.validProject(this.projectsControl.value)
            || !listView.exhaustive;
          return !this.viewJobsEnabled || this.projects.length > 1 ?
            this.projects.map(project => project.projectId) : [];})
        .catch(response => this.handleError(response))
    );
  }

  navigateJobs() {
    let extras = {queryParams: {parentId: this.projectsControl.value}}
    this.router.navigate(['jobs'], extras)
  }
}
