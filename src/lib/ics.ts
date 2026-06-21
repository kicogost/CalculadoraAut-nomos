import { formatEur } from '../engine';
import type { Obligation } from './obligations';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** ISO date (YYYY-MM-DD) → ICS all-day date (YYYYMMDD). */
function icsDate(iso: string): string {
  return iso.replace(/-/g, '');
}

/** Next day for an all-day DTEND (exclusive). */
function nextDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + 1));
  return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}`;
}

function icsStamp(now: Date): string {
  return (
    `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
    `T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`
  );
}

/** Escape a text value per RFC 5545. */
function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/**
 * Build an .ics calendar with one all-day event per (non-informational) tax
 * obligation, each with reminders 7 and 2 days before. The user imports this
 * into their own calendar, which then reminds them — no backend needed, works
 * when the app is closed.
 */
export function obligationsToIcs(obligations: Obligation[], now: Date): string {
  const stamp = icsStamp(now);
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Calculadora Autonomos//ES//',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const o of obligations) {
    const amount = o.informational ? 'informativo' : formatEur(o.amountCents);
    const summary = `${o.model} · ${o.label} (${amount})`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${o.id}-${o.dueDate}@calculadora-autonomos`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${icsDate(o.dueDate)}`,
      `DTEND;VALUE=DATE:${nextDay(o.dueDate)}`,
      `SUMMARY:${esc(summary)}`,
      `DESCRIPTION:${esc(o.explanation)}`,
      'BEGIN:VALARM',
      'TRIGGER:-P7D',
      'ACTION:DISPLAY',
      `DESCRIPTION:${esc(`Recordatorio (7 días): ${summary}`)}`,
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-P2D',
      'ACTION:DISPLAY',
      `DESCRIPTION:${esc(`Recordatorio (2 días): ${summary}`)}`,
      'END:VALARM',
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  // RFC 5545 line endings.
  return lines.join('\r\n');
}

/** Days from `now` until an ISO date (negative = past). */
export function daysUntil(iso: string, now: Date): number {
  const [y, m, d] = iso.split('-').map(Number);
  const due = Date.UTC(y, m - 1, d);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((due - today) / 86_400_000);
}
