import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {MatButtonModule} from "@angular/material/button";
import {MatCardModule} from "@angular/material/card";

import {SignInComponent} from './sign-in.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
  ],
  declarations: [
    SignInComponent,
  ],
  exports: []
})
export class SignInModule {}
