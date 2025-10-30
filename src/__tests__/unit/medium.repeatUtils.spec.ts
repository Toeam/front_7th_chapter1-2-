import { describe, it, expect } from 'vitest';

import { getFilteredEvents } from '../../utils/eventUtils';

// 테스트는 명세를 기반으로 작성되었으며 현재 구현은 반복 확장을 하지 않으므로 RED가 예상됩니다.

describe('반복 일정 확장 - eventUtils.getFilteredEvents', () => {
  const makeEvent = (overrides: Partial<any> = {}) => ({
    id: 'e1',
    title: '반복 테스트',
    date: '2025-01-31',
    startTime: '09:00',
    endTime: '10:00',
    description: '',
    location: '',
    category: '업무',
    repeat: { type: 'none', endDate: undefined, ...overrides.repeat },
    notificationTime: 10,
    ...overrides,
  });

  it('매월 반복: 31일 시작 시 31일이 있는 달에만 표시되고 2월 등에는 표시되지 않는다', () => {
    const events = [
      makeEvent({ date: '2025-01-31', repeat: { type: 'monthly' } }),
    ];

    // 2025-02 월 뷰: 2월에는 31일이 없으므로 표시되지 않아야 한다
    const feb = new Date('2025-02-01');
    const febFiltered = getFilteredEvents(events as any, '', feb, 'month');
    expect(febFiltered.some((e: any) => e.date === '2025-02-28' || e.date === '2025-02-29')).toBe(
      false
    );

    // 2025-03 월 뷰: 3월 31일에는 표시되어야 한다 (현재 구현에서는 확장 없음 → RED)
    const mar = new Date('2025-03-01');
    const marFiltered = getFilteredEvents(events as any, '', mar, 'month');
    expect(marFiltered.some((e: any) => e.date === '2025-03-31')).toBe(true);
  });

  it('매년 반복: 2024-02-29 시작 시 다음 윤년(2028-02-29)에만 표시된다', () => {
    const events = [
      makeEvent({ date: '2024-02-29', repeat: { type: 'yearly' } }),
    ];

    // 2025-02 월 뷰: 표시되지 않음
    const y2025Feb = new Date('2025-02-01');
    const filtered2025 = getFilteredEvents(events as any, '', y2025Feb, 'month');
    expect(filtered2025.some((e: any) => e.date === '2025-02-28' || e.date === '2025-02-29')).toBe(
      false
    );

    // 2028-02 월 뷰: 2028-02-29에 표시 (현재 구현에서는 확장 없음 → RED)
    const y2028Feb = new Date('2028-02-01');
    const filtered2028 = getFilteredEvents(events as any, '', y2028Feb, 'month');
    expect(filtered2028.some((e: any) => e.date === '2028-02-29')).toBe(true);
  });

  it('매주 반복: 시작 주가 아닌 다음 주에도 동일 요일로 표시된다', () => {
    const events = [
      makeEvent({ date: '2025-10-01', repeat: { type: 'weekly' } }), // 2025-10-01은 수요일
    ];

    // 다음 주(2025-10-08 수요일이 포함된 주) 주간 뷰에서 표시되어야 함 (현재 구현에서는 확장 없음 → RED)
    const nextWeek = new Date('2025-10-08');
    const filtered = getFilteredEvents(events as any, '', nextWeek, 'week');

    expect(filtered.some((e: any) => e.date === '2025-10-08')).toBe(true);
  });

  it('종료일(endDate) 이전에는 표시되고 종료일 이후에는 표시되지 않는다', () => {
    const events = [
      makeEvent({
        date: '2025-01-31',
        repeat: { type: 'monthly', endDate: '2025-03-31' },
      }),
    ];

    // 종료일이 포함된 2025-03 월 뷰에는 표시되어야 함 (현재 구현에서는 확장 없음 → RED)
    const mar = new Date('2025-03-01');
    const marchFiltered = getFilteredEvents(events as any, '', mar, 'month');
    expect(marchFiltered.some((e: any) => e.date === '2025-03-31')).toBe(true);

    // 2025-04 월 뷰: 종료일 이후라면 더 이상 표시되지 않음
    const apr = new Date('2025-04-01');
    const aprilFiltered = getFilteredEvents(events as any, '', apr, 'month');
    expect(aprilFiltered.length).toBe(0);
  });

});
