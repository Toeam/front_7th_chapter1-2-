import { Event } from '../types';
import { getWeekDates, isDateInRange } from './dateUtils';

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getViewRange(currentDate: Date, view: 'week' | 'month'): { start: Date; end: Date } {
  if (view === 'week') {
    const week = getWeekDates(currentDate);
    const start = week[0];
    const end = new Date(
      week[6].getFullYear(),
      week[6].getMonth(),
      week[6].getDate(),
      23,
      59,
      59,
      999
    );
    return { start, end };
  }
  const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

// removed unused filterEventsByDateRange helper

function containsTerm(target: string, term: string) {
  return target.toLowerCase().includes(term.toLowerCase());
}

function searchEvents(events: Event[], term: string) {
  return events.filter(
    ({ title, description, location }) =>
      containsTerm(title, term) || containsTerm(description, term) || containsTerm(location, term)
  );
}

// Note: previously exported convenience wrappers were unused and removed

export function getFilteredEvents(
  events: Event[],
  searchTerm: string,
  currentDate: Date,
  view: 'week' | 'month'
): Event[] {
  const searchedEvents = searchEvents(events, searchTerm);

  // Determine range by view
  const { start: rangeStart, end: rangeEnd } = getViewRange(currentDate, view);

  const expanded: Event[] = [];

  for (const event of searchedEvents) {
    expandRepeatingEventOccurrences(event, rangeStart, rangeEnd, expanded);
  }

  return expanded;
}

function expandRepeatingEventOccurrences(
  event: Event,
  rangeStart: Date,
  rangeEnd: Date,
  out: Event[]
): void {
  const startDate = new Date(event.date);
  // 일부 호출자가 repeat 필드를 제공하지 않는 경우가 있어 방어적으로 기본값을 설정한다.
  const repeat = event.repeat ?? ({ type: 'none', interval: 0 } as Event['repeat']);
  const interval = repeat.interval ?? 1;
  const endLimit = repeat.endDate ? new Date(repeat.endDate) : null;
  type EventWithExceptions = { exceptions?: string[] };
  const withExceptions = event as unknown as EventWithExceptions;
  const exceptions: Set<string> | null = Array.isArray(withExceptions.exceptions)
    ? new Set<string>(withExceptions.exceptions)
    : null;

  const pushIfInRange = (d: Date) => {
    if (d < rangeStart || d > rangeEnd) return;
    if (endLimit && d > endLimit) return;
    const ymdStr = ymd(d);
    if (exceptions && exceptions.has(ymdStr)) return;
    out.push({ ...event, id: `${event.id}@${ymdStr}`, date: ymdStr });
  };

  if (repeat.type === 'none' || interval <= 0) {
    if (isDateInRange(startDate, rangeStart, rangeEnd)) {
      out.push(event);
    }
    return;
  }

  switch (repeat.type) {
    case 'daily':
      expandDaily(startDate, interval, rangeStart, rangeEnd, pushIfInRange);
      break;
    case 'weekly':
      expandWeekly(startDate, interval, rangeStart, rangeEnd, pushIfInRange);
      break;
    case 'monthly':
      expandMonthly(startDate, interval, rangeStart, rangeEnd, pushIfInRange);
      break;
    case 'yearly':
      expandYearly(startDate, interval, rangeStart, rangeEnd, pushIfInRange);
      break;
  }
}

function expandDaily(
  startDate: Date,
  interval: number,
  rangeStart: Date,
  rangeEnd: Date,
  pushIfInRange: (d: Date) => void
): void {
  const stepDays = interval;
  const first = new Date(startDate);
  if (first < rangeStart) {
    const diffDays = Math.ceil((rangeStart.getTime() - first.getTime()) / (24 * 60 * 60 * 1000));
    const increments = Math.floor(diffDays / stepDays) * stepDays;
    first.setDate(first.getDate() + increments);
    while (first < rangeStart) first.setDate(first.getDate() + stepDays);
  }
  for (let d = new Date(first); d <= rangeEnd; d.setDate(d.getDate() + stepDays)) {
    pushIfInRange(new Date(d));
  }
}

function expandWeekly(
  startDate: Date,
  interval: number,
  rangeStart: Date,
  rangeEnd: Date,
  pushIfInRange: (d: Date) => void
): void {
  const stepDays = 7 * interval;
  const first = new Date(startDate);
  if (first < rangeStart) {
    const diffDays = Math.ceil((rangeStart.getTime() - first.getTime()) / (24 * 60 * 60 * 1000));
    const increments = Math.floor(diffDays / stepDays) * stepDays;
    first.setDate(first.getDate() + increments);
    while (first < rangeStart) first.setDate(first.getDate() + stepDays);
  }
  for (let d = new Date(first); d <= rangeEnd; d.setDate(d.getDate() + stepDays)) {
    pushIfInRange(new Date(d));
  }
}

function expandMonthly(
  startDate: Date,
  interval: number,
  rangeStart: Date,
  rangeEnd: Date,
  pushIfInRange: (d: Date) => void
): void {
  const first = new Date(startDate);
  while (first < rangeStart) {
    first.setMonth(first.getMonth() + interval);
  }
  for (let d = new Date(first); d <= rangeEnd; d.setMonth(d.getMonth() + interval)) {
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = startDate.getDate();
    const lastDay = new Date(year, month + 1, 0).getDate();
    if (day > lastDay) {
      continue;
    }
    const occ = new Date(year, month, day);
    pushIfInRange(occ);
  }
}

function expandYearly(
  startDate: Date,
  interval: number,
  rangeStart: Date,
  rangeEnd: Date,
  pushIfInRange: (d: Date) => void
): void {
  const startYear = startDate.getFullYear();
  const month = startDate.getMonth();
  const day = startDate.getDate();
  const rangeStartYear = rangeStart.getFullYear();
  const rangeEndYear = rangeEnd.getFullYear();
  const yearsDiff = rangeStartYear - startYear;
  const k = yearsDiff > 0 ? Math.ceil(yearsDiff / interval) : 0;
  let year = startYear + k * interval;
  while (year <= rangeEndYear) {
    const lastDay = new Date(year, month + 1, 0).getDate();
    if (day <= lastDay) {
      const occ = new Date(year, month, day);
      pushIfInRange(occ);
    }
    year += interval;
  }
}
