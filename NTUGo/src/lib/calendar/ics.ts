import { PersonalEvent } from '@/lib/models/PersonalEvent';

function pad(num: number): string {
  return num.toString().padStart(2, '0');
}

function formatDateToIcs(dt: Date): string {
  return (
    dt.getUTCFullYear().toString() +
    pad(dt.getUTCMonth() + 1) +
    pad(dt.getUTCDate()) +
    'T' +
    pad(dt.getUTCHours()) +
    pad(dt.getUTCMinutes()) +
    pad(dt.getUTCSeconds()) +
    'Z'
  );
}

function escapeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

export function buildIcsForPersonalEvent(event: PersonalEvent): string {
  const uid =
    (event._id ? event._id.toString() : `${event.userId}-${event.title}`) +
    '@ntugo';
  const dtStart = formatDateToIcs(event.startTime);
  const dtEnd = formatDateToIcs(event.endTime);
  const dtStamp = formatDateToIcs(new Date());

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NTUGo//Calendar//ZH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `DTSTAMP:${dtStamp}`,
    `SUMMARY:${escapeText(event.title)}`,
    event.description ? `DESCRIPTION:${escapeText(event.description)}` : '',
    event.location ? `LOCATION:${escapeText(event.location)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].filter(Boolean);

  return lines.join('\r\n');
}


