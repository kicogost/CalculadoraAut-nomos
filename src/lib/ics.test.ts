import { describe, it, expect } from 'vitest';
import { eurToCents } from '../engine';
import type { Obligation } from './obligations';
import { obligationsToIcs, daysUntil } from './ics';

const ob: Obligation = {
  id: '303-1',
  model: 'Modelo 303',
  label: 'IVA 1T',
  dueDate: '2026-04-20',
  amountCents: eurToCents(1234.5),
  informational: false,
  explanation: 'IVA repercutido menos soportado.',
};

describe('obligationsToIcs', () => {
  const ics = obligationsToIcs([ob], new Date(Date.UTC(2026, 0, 1)));

  it('wraps a valid VCALENDAR/VEVENT', () => {
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('DTSTART;VALUE=DATE:20260420');
    expect(ics).toContain('DTEND;VALUE=DATE:20260421');
  });

  it('includes the model + amount in the summary', () => {
    expect(ics).toMatch(/SUMMARY:Modelo 303 · IVA 1T/);
  });

  it('adds 7-day and 2-day reminders', () => {
    expect(ics).toContain('TRIGGER:-P7D');
    expect(ics).toContain('TRIGGER:-P2D');
  });

  it('uses CRLF line endings', () => {
    expect(ics.includes('\r\n')).toBe(true);
  });
});

describe('daysUntil', () => {
  it('counts whole days to a future date', () => {
    expect(daysUntil('2026-04-20', new Date(Date.UTC(2026, 3, 10)))).toBe(10);
  });
  it('is zero on the due date', () => {
    expect(daysUntil('2026-04-20', new Date(Date.UTC(2026, 3, 20)))).toBe(0);
  });
  it('is negative for past dates', () => {
    expect(daysUntil('2026-04-20', new Date(Date.UTC(2026, 3, 25)))).toBe(-5);
  });
});
