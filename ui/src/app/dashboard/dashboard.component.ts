import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {AggregationResponse} from "../shared/model/AggregationResponse";

@Component({
  selector: 'jm-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  aggregationResponse: AggregationResponse;

  constructor(private readonly activatedRoute: ActivatedRoute) {
    this.aggregationResponse = this.activatedRoute.snapshot.data['aggregations'];
  }

  ngOnInit() {

  }

}
