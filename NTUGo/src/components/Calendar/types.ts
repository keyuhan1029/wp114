/**
 * 日曆相關類型定義
 */

export interface PersonalEventClient {
  _id: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  allDay?: boolean;
  source: 'manual' | 'ntu_imported';
}

export interface CombinedEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  allDay?: boolean;
  sourceType: 'ntu_official' | 'personal';
  personalId?: string; // 若是個人事件，對應 PersonalEvent _id
  personalSource?: 'manual' | 'ntu_imported';
}

export interface EditDialogState {
  open: boolean;
  mode: 'create' | 'edit';
  targetId?: string;
  title: string;
  description: string;
  location: string;
  startTime: string; // yyyy-MM-ddTHH:mm
  endTime: string; // yyyy-MM-ddTHH:mm
  allDay: boolean;
}

export interface ParsedIcsEvent {
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
}

