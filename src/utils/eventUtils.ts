import { Event } from '../types';
import { getWeekDates, isDateInRange } from './dateUtils';

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getViewRange(currentDate: Date, view: 'week' | 'month'): { start: Date; end: Date } {
  if (view === 'week') {
    const week = getWeekDates(currentDate);
    const start = week[0];
    const end = new Date(week[6].getFullYear(), week[6].getMonth(), week[6].getDate(), 23, 59, 59, 999);
    return { start, end };
  }
  const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function filterEventsByDateRange(events: Event[], start: Date, end: Date): Event[] {
  return events.filter((event) => {
    const eventDate = new Date(event.date);
    return isDateInRange(eventDate, start, end);
  });
}

function containsTerm(target: string, term: string) {
  return target.toLowerCase().includes(term.toLowerCase());
}

function searchEvents(events: Event[], term: string) {
  return events.filter(
    ({ title, description, location }) =>
      containsTerm(title, term) || containsTerm(description, term) || containsTerm(location, term)
  );
}

function filterEventsByDateRangeAtWeek(events: Event[], currentDate: Date) {
  const weekDates = getWeekDates(currentDate);
  return filterEventsByDateRange(events, weekDates[0], weekDates[6]);
}

function filterEventsByDateRangeAtMonth(events: Event[], currentDate: Date) {
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );
  return filterEventsByDateRange(events, monthStart, monthEnd);
}

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
    const startDate = new Date(event.date);
    const repeat = event.repeat;
    const interval = repeat.interval ?? 1;
    const endLimit = repeat.endDate ? new Date(repeat.endDate) : null;

    const pushIfInRange = (d: Date) => {
      if (d < rangeStart || d > rangeEnd) return;
      if (endLimit && d > endLimit) return;
      expanded.push({ ...event, id: `${event.id}@${ymd(d)}`, date: ymd(d) });
    };

    if (repeat.type === 'none' || interval <= 0) {
      // Non-repeating: include if within range
      if (isDateInRange(startDate, rangeStart, rangeEnd)) {
        expanded.push(event);
      }
      continue;
    }

    switch (repeat.type) {
      case 'daily': {
        const stepDays = interval;
        // Find first occurrence >= rangeStart
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
        break;
      }
      case 'weekly': {
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
        break;
      }
      case 'monthly': {
        const first = new Date(startDate);
        // Move to the first month in or after rangeStart
        while (first < rangeStart) {
          first.setMonth(first.getMonth() + interval);
        }
        for (let d = new Date(first); d <= rangeEnd; d.setMonth(d.getMonth() + interval)) {
          const year = d.getFullYear();
          const month = d.getMonth();
          const day = startDate.getDate();
          const lastDay = new Date(year, month + 1, 0).getDate();
          if (day > lastDay) {
            // Skip months without this day (e.g., 31st)
            continue;
          }
          const occ = new Date(year, month, day);
          pushIfInRange(occ);
        }
        break;
      }
      case 'yearly': {
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
        break;
      }
    }
  }

  return expanded;
}
