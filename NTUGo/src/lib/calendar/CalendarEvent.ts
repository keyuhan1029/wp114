export type CalendarSourceType =
  | 'ntu_official'
  | 'personal'
  | 'recommendation';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string; // ISO 字串，方便在前後端之間傳遞
  endTime: string; // ISO 字串
  allDay?: boolean;
  sourceType: CalendarSourceType;
}

export interface CalendarQueryRange {
  from?: string; // ISO 日期或日期時間
  to?: string;
}


