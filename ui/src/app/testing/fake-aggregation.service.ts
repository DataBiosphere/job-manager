import {AggregationResponse, JobStatus, TimeFrame} from "../shared/model/models";

const aggregationResponse: AggregationResponse =
  {
   aggregations: [
     {
       key: "Owner",
       entries: [
         {
           label: "owner1",
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
           label: "owner2",
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
       key: "User",
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

export class FakeAggregationService {
  queryAggregations(timeFrame: TimeFrame, projectId: string): Promise<AggregationResponse> {
    return Promise.resolve(aggregationResponse);
  }
}

