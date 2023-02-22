import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SignInRedirectComponent } from './sign-in-redirect.component';

@NgModule({
  imports: [CommonModule, RouterModule, MatProgressSpinnerModule],
  declarations: [SignInRedirectComponent],
  exports: [],
})

export class SignInRedirectModule {}
