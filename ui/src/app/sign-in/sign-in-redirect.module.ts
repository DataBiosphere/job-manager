import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";

import { SignInRedirectComponent } from './sign-in-redirect.component';

@NgModule({
  imports: [CommonModule, RouterModule],
  declarations: [SignInRedirectComponent],
  exports: [],
})

export class SignInRedirectModule {}
