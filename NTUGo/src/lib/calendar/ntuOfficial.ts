import { CalendarDataSource } from './dataSource';
import { CalendarEvent, CalendarQueryRange } from './CalendarEvent';

/**
 * NTU 官方行事曆資料來源
 *
 * 使用臺大官方提供的 iCalendar (.ics) 檔作為來源，例如：
 *   NTU_CALENDAR_ICS_URL=https://ppt.cc/fXxnLx
 *
 * 範例可參考：[臺大行事曆 ICS](https://ppt.cc/fXxnLx)
 */
export class NTUOfficialCalendarSource implements CalendarDataSource {
  private icsUrl: string;

  constructor(icsUrl?: string) {
    const envUrl =
      process.env.NTU_CALENDAR_ICS_URL || process.env.NTU_CALENDAR_CSV_URL;
    if (!icsUrl && !envUrl) {
      throw new Error(
        '請在環境變數中設定 NTU_CALENDAR_ICS_URL（或暫時使用 NTU_CALENDAR_CSV_URL）'
      );
    }
    this.icsUrl = icsUrl || (envUrl as string);
  }

  async getEvents(range: CalendarQueryRange): Promise<CalendarEvent[]> {
    const res = await fetch(this.icsUrl, {
      // 允許快取幾分鐘即可，避免每次都打遠端
      next: { revalidate: 300 },
    } as RequestInit);

    if (!res.ok) {
      console.error('讀取 NTU 行事曆失敗', res.status, res.statusText);
      return [];
    }

    const text = await res.text();
    const events = this.parseIcs(text);

    const fromDate = range.from ? new Date(range.from) : null;
    const toDate = range.to ? new Date(range.to) : null;

    // 查詢與時間範圍有交集的事件：
    // 事件開始時間 <= 查詢結束時間 AND 事件結束時間 >= 查詢開始時間
    return events.filter((e) => {
      const start = new Date(e.startTime);
      const end = new Date(e.endTime);
      // 事件結束時間必須 >= 查詢開始時間
      if (fromDate && end < fromDate) return false;
      // 事件開始時間必須 <= 查詢結束時間
      if (toDate && start > toDate) return false;
      return true;
    });
  }

  private parseIcs(text: string): CalendarEvent[] {
    // 先處理行折疊：ICS 規格中，以空白開頭的行代表上一行的延續
    const rawLines = text.split(/\r?\n/);
    const unfoldedLines: string[] = [];
    for (const line of rawLines) {
      if (line.startsWith(' ') || line.startsWith('\t')) {
        // 接到上一行
        if (unfoldedLines.length > 0) {
          unfoldedLines[unfoldedLines.length - 1] += line.slice(1);
        }
      } else {
        unfoldedLines.push(line);
      }
    }

    const events: CalendarEvent[] = [];
    let current: Record<string, string> | null = null;

    for (const line of unfoldedLines) {
      if (line.startsWith('BEGIN:VEVENT')) {
        current = {};
        continue;
      }
      if (line.startsWith('END:VEVENT')) {
        if (current) {
          const ev = this.convertIcsFieldsToEvent(current);
          if (ev) {
            events.push(ev);
          }
        }
        current = null;
        continue;
      }
      if (!current) continue;

      const idx = line.indexOf(':');
      if (idx === -1) continue;

      const keyPart = line.slice(0, idx); // e.g. DTSTART;VALUE=DATE
      const value = line.slice(idx + 1);

      const key = keyPart.split(';')[0].toUpperCase(); // 取出 DTSTART / DTEND / SUMMARY 等
      current[key] = value;
    }

    return events;
  }

  private convertIcsFieldsToEvent(
    fields: Record<string, string>
  ): CalendarEvent | null {
    const summary = fields['SUMMARY']?.trim();
    const dtStartRaw = fields['DTSTART']?.trim();
    const dtEndRaw = fields['DTEND']?.trim();

    if (!summary || !dtStartRaw) return null;

    const { date: start, allDay } = this.parseIcsDate(dtStartRaw);
    const { date: end } = this.parseIcsDate(dtEndRaw || dtStartRaw);
    if (!start || !end) return null;

    const id = fields['UID']
      ? fields['UID'].trim()
      : `${start.toISOString()}_${summary}`;

    const description = fields['DESCRIPTION']?.trim() || '';
    const location = fields['LOCATION']?.trim() || '';

    return {
      id,
      title: summary,
      description,
      location,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      allDay,
      sourceType: 'ntu_official',
    };
  }

  /**
   * 處理兩種常見格式：
   * - VALUE=DATE: 20241202 （全天）
   * - 20251202T093227Z 或 20251202T093227
   */
  private parseIcsDate(raw: string): { date: Date | null; allDay: boolean } {
    if (!raw) return { date: null, allDay: false };

    // 僅日期（全天）
    const dateOnlyMatch = raw.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (dateOnlyMatch) {
      const [, y, m, d] = dateOnlyMatch;
      const dt = new Date(
        Number(y),
        Number(m) - 1,
        Number(d),
        0,
        0,
        0,
        0
      );
      return { date: dt, allDay: true };
    }

    // 含時間（可能帶 Z）
    const dateTimeMatch = raw.match(
      /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/
    );
    if (dateTimeMatch) {
      const [, y, m, d, hh, mm, ss] = dateTimeMatch;
      const dt = new Date(
        Number(y),
        Number(m) - 1,
        Number(d),
        Number(hh),
        Number(mm),
        Number(ss),
        0
      );
      return { date: dt, allDay: false };
    }

    // 最後嘗試直接 new Date
    const fallback = new Date(raw);
    if (!isNaN(fallback.getTime())) {
      return { date: fallback, allDay: false };
    }

    return { date: null, allDay: false };
  }
}


