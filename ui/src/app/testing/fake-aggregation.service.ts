import {AggregationResponse, TimeFrame} from "../shared/model/models";

export class FakeAggregationService {
  constructor(public fakeAggregationResponse) {}

  queryAggregations(timeFrame: TimeFrame, projectId: string): Promise<AggregationResponse> {
    return Promise.resolve(this.fakeAggregationResponse);
  }
}

