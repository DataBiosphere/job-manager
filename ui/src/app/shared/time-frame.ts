import {TimeFrame} from "./model/TimeFrame";

export const stringToTimeFrameMap: Map<String, TimeFrame> = new Map([
  ['HOURS_1', TimeFrame.HOURS1],
  ['HOURS_8', TimeFrame.HOURS8],
  ['HOURS_24', TimeFrame.HOURS24],
  ['DAYS_7', TimeFrame.DAYS7],
  ['DAYS_30', TimeFrame.DAYS30],
  ['ALL_TIME', TimeFrame.ALLTIME],
]);

export const timeFrameToDescriptionMap = new Map<TimeFrame, string> ([
  [TimeFrame.HOURS1, 'in past 1 hour'],
  [TimeFrame.HOURS8, 'in past 8 hours'],
  [TimeFrame.HOURS24, 'in past 24 hours'],
  [TimeFrame.DAYS7, 'in past 7 days'],
  [TimeFrame.DAYS30, 'in past 30 days'],
  [TimeFrame.ALLTIME, 'in past all time'],
]);

/**
 * The default time frame of jobs aggregation on dashboard page
 */
export const defaultTimeFrame = TimeFrame.DAYS7;
