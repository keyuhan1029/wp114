import { CalendarEvent, CalendarQueryRange } from './CalendarEvent';

export interface CalendarDataSource {
  /**
   * 取得指定區間內的事件
   */
  getEvents(range: CalendarQueryRange): Promise<CalendarEvent[]>;
}


