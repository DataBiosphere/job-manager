import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {MdButtonModule, MdCardModule} from '@angular/material';

import {SignInComponent} from './sign-in.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    MdButtonModule,
    MdCardModule,
  ],
  declarations: [
    SignInComponent,
  ],
  exports: []
})
export class SignInModule {}
