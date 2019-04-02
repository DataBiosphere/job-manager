import {Component, Input, OnInit} from '@angular/core';

import {AuthService} from '../../../core/auth.service';
import {ActivatedRoute} from "@angular/router";
import {IndividualAttempt} from "../../../shared/model/IndividualAttempt";

@Component({
  selector: 'jm-attempt',
  templateUrl: './attempt.component.html',
  styleUrls: ['./attempt.component.css']
})
export class JobAttemptComponent implements OnInit {
  @Input() attempt: IndividualAttempt;

  constructor(private authService: AuthService,
              private readonly route: ActivatedRoute) {
  }

  ngOnInit() {
    this.attempt = this.route.snapshot.data['attempt'];
  }
}
