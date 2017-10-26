import {RouterModule} from '@angular/router';
import {
  RouterTestingModule
} from '@angular/router/testing';
import {TestBed, async} from '@angular/core/testing';

import {AppComponent} from './app.component';
import {JobListComponent} from './job-list/job-list.component';
import {JobDetailsComponent} from './job-details/job-details.component';
import {JobDetailsResolver} from './job-details/job-details-resolver.service';
import {JobListModule} from './job-list/job-list.module';
import {JobDetailsModule} from './job-details/job-details.module';

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent
      ],
      imports: [
        JobListModule,
        JobDetailsModule,
        RouterTestingModule.withRoutes([
          {path: '', redirectTo: 'jobs', pathMatch: 'full'},
          {path: 'jobs', component:JobListComponent},
          {path: 'jobs/:id', component: JobDetailsComponent, resolve: {
            job: JobDetailsResolver
          }},
        ])
      ]
    }).compileComponents();
  }));
  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
  it(`should have as title 'Job Manager'`, async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('Job Manager');
  }));
});
