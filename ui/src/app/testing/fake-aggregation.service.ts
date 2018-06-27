import {AggregationResponse, JobStatus, TimeFrame} from "../shared/model/models";

export const TEST_AGGREGATION_RESPONSE: AggregationResponse =
  {
   aggregations: [
     {
       key: "anotherLabel",
       name: "AnotherLabel",
       entries: [
         {
           label: "labelValue1",
           statusCounts: {
             counts: [
               {
                 count: 2,
                 status: JobStatus.Succeeded
               },
               {
                 count: 1,
                 status: JobStatus.Failed
               }
             ]
           }
         },
         {
           label: "labelValue1",
           statusCounts: {
             counts: [
               {
                 count: 4,
                 status: JobStatus.Succeeded
               },
               {
                 count: 6,
                 status: JobStatus.Failed
               }
             ]
           }
         }
       ]
     },
     {
       key: "userId",
       name: "User",
       entries: [
         {
           label: "user1",
           statusCounts: {
             counts: [
               {
                 count: 5,
                 status: JobStatus.Succeeded
               },
               {
                 count: 6,
                 status: JobStatus.Failed
               }
             ]
           }
         },
         {
           label: "user2",
           statusCounts: {
             counts: [
               {
                 count: 8,
                 status: JobStatus.Succeeded
               },
               {
                 count: 11,
                 status: JobStatus.Failed
               }
             ]
           }
         }
       ],
     },

   ],
   summary: {
    counts: [
      {
        count: 10,
        status: JobStatus.Succeeded
      },
      {
        count: 3,
        status: JobStatus.Failed
      }
    ]
   }
  };

// This is the number of mat-card that would display on dashboard page,
// remember to change the number if you change the aggregationResponse above
export const CARD_NUM = 4;

export class FakeAggregationService {
  queryAggregations(timeFrame: TimeFrame, projectId: string): Promise<AggregationResponse> {
    return Promise.resolve(TEST_AGGREGATION_RESPONSE);
  }
}

