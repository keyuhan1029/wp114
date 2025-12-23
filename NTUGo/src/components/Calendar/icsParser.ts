/**
 * ICS 文件解析器
 */

import { ParsedIcsEvent } from './types';

/**
 * 簡易 ICS 解析器，從 .ics 文字中提取 VEVENT
 */
export function parseIcsFile(icsText: string): ParsedIcsEvent[] {
  const results: ParsedIcsEvent[] = [];

  // 展開折行（ICS 標準：以空白或 tab 開頭的行是前一行的延續）
  const unfoldedText = icsText.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
  const lines = unfoldedText.split(/\r?\n/);

  let inEvent = false;
  let currentEvent: {
    summary?: string;
    description?: string;
    location?: string;
    dtstart?: string;
    dtend?: string;
    allDay?: boolean;
  } = {};

  for (const line of lines) {
    if (line.startsWith('BEGIN:VEVENT')) {
      inEvent = true;
      currentEvent = {};
      continue;
    }
    if (line.startsWith('END:VEVENT')) {
      inEvent = false;
      if (currentEvent.summary && currentEvent.dtstart) {
        const start = parseIcsDate(currentEvent.dtstart);
        const end = currentEvent.dtend
          ? parseIcsDate(currentEvent.dtend)
          : start;
        if (start) {
          results.push({
            title: currentEvent.summary,
            description: currentEvent.description,
            location: currentEvent.location,
            startTime: start.toISOString(),
            endTime: (end || start).toISOString(),
            allDay: !!currentEvent.allDay,
          });
        }
      }
      continue;
    }
    if (!inEvent) continue;

    // 解析屬性
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const keyPart = line.substring(0, colonIdx);
    const value = line.substring(colonIdx + 1);

    // keyPart 可能包含參數，例如 DTSTART;VALUE=DATE
    const keyName = keyPart.split(';')[0].toUpperCase();

    switch (keyName) {
      case 'SUMMARY':
        currentEvent.summary = value;
        break;
      case 'DESCRIPTION':
        currentEvent.description = value.replace(/\\n/g, '\n').replace(/\\,/g, ',');
        break;
      case 'LOCATION':
        currentEvent.location = value;
        break;
      case 'DTSTART':
        currentEvent.dtstart = line; // 保留完整行以便解析參數
        if (keyPart.includes('VALUE=DATE')) {
          currentEvent.allDay = true;
        }
        break;
      case 'DTEND':
        currentEvent.dtend = line;
        break;
    }
  }

  return results;
}

/**
 * 解析 ICS 日期格式
 */
function parseIcsDate(line: string): Date | null {
  // line 格式如：DTSTART;VALUE=DATE:20241202 或 DTSTART:20241202T100000Z
  const colonIdx = line.indexOf(':');
  if (colonIdx === -1) return null;
  const value = line.substring(colonIdx + 1).trim();

  // 全天格式：YYYYMMDD
  if (/^\d{8}$/.test(value)) {
    const y = parseInt(value.substring(0, 4), 10);
    const m = parseInt(value.substring(4, 6), 10) - 1;
    const d = parseInt(value.substring(6, 8), 10);
    return new Date(y, m, d);
  }

  // 日期時間格式：YYYYMMDDTHHMMSS 或 YYYYMMDDTHHMMSSZ
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
  if (match) {
    const [, y, mo, d, h, mi, s] = match;
    if (value.endsWith('Z')) {
      return new Date(
        Date.UTC(
          parseInt(y, 10),
          parseInt(mo, 10) - 1,
          parseInt(d, 10),
          parseInt(h, 10),
          parseInt(mi, 10),
          parseInt(s, 10)
        )
      );
    } else {
      return new Date(
        parseInt(y, 10),
        parseInt(mo, 10) - 1,
        parseInt(d, 10),
        parseInt(h, 10),
        parseInt(mi, 10),
        parseInt(s, 10)
      );
    }
  }

  return null;
}

