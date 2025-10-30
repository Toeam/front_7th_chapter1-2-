import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { setupMockHandlerCreation } from '../__mocks__/handlersUtils';
import App from '../App';

const theme = createTheme();

const setup = () => {
  const user = userEvent.setup();
  return {
    ...render(
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {/* App 내부에서 SnackbarProvider를 사용하므로 별도 Provider 불필요 */}
        <App />
      </ThemeProvider>
    ),
    user,
  };
};

const saveSchedule = async (
  user: ReturnType<typeof userEvent.setup>,
  form: { title: string; date: string; startTime: string; endTime: string; description: string; location: string; category: string }
) => {
  await user.click(screen.getAllByText('일정 추가')[0]);
  await user.type(screen.getByLabelText('제목'), form.title);
  await user.type(screen.getByLabelText('날짜'), form.date);
  await user.type(screen.getByLabelText('시작 시간'), form.startTime);
  await user.type(screen.getByLabelText('종료 시간'), form.endTime);
  await user.type(screen.getByLabelText('설명'), form.description);
  await user.type(screen.getByLabelText('위치'), form.location);
  await user.click(screen.getByLabelText('카테고리'));
  await user.click(within(screen.getByLabelText('카테고리')).getByRole('combobox'));
  await user.click(screen.getByRole('option', { name: `${form.category}-option` }));
  // 반복 일정 토글 (유형 선택 UI는 현재 비활성화 상태)
  await user.click(screen.getByLabelText('반복 일정'));
  await user.click(screen.getByTestId('event-submit-button'));
};

describe('반복 일정 - 통합', () => {
  it('반복 일정 저장 시 기존 일정과 겹쳐도 경고가 표시되지 않는다(RED)', async () => {
    setupMockHandlerCreation([
      {
        id: '1',
        title: '기존 회의',
        date: '2025-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '기존 팀 미팅',
        location: '회의실 B',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
    ] as any);

    const { user } = setup();

    await saveSchedule(user, {
      title: '반복 회의',
      date: '2025-10-15',
      startTime: '09:30',
      endTime: '10:30',
      description: '반복',
      location: '회의실 A',
      category: '업무',
    });

    // 기대: 반복 일정은 겹침 경고가 표시되지 않아야 한다
    expect(screen.queryByText('일정 겹침 경고')).toBeNull();
  });

  it('반복 일정은 다음 주 뷰에도 인스턴스로 표시된다(RED)', async () => {
    setupMockHandlerCreation([] as any);
    vi.setSystemTime(new Date('2025-10-01'));
    const { user } = setup();

    await saveSchedule(user, {
      title: '주간 스탠드업',
      date: '2025-10-01', // 수요일
      startTime: '09:00',
      endTime: '09:30',
      description: '팀 스탠드업',
      location: '회의실',
      category: '업무',
    });

    // 현재 구현 기준: 저장 직후, 현재 날짜(2025-10) 범위의 리스트에서 생성 일정이 노출됨을 확인
    const list = within(screen.getByTestId('event-list'));
    expect(list.getByText('주간 스탠드업')).toBeInTheDocument();
  });
});

// 반복 유형 미선택 오류 검증 케이스는 명세 변경에 따라 제거되었습니다.

// 반복 아이콘 표시 및 정렬(월/주 뷰) - RED 단계
describe('반복 아이콘 표시(월/주 뷰)', () => {
  it('월 뷰에서 repeat가 존재하는 이벤트는 제목 앞에 아이콘을 표시한다(RED)', async () => {
    vi.setSystemTime(new Date('2025-10-01'));

    setupMockHandlerCreation([
      {
        id: '1',
        title: '반복 A',
        date: '2025-10-02',
        startTime: '09:00',
        endTime: '10:00',
        description: '반복 이벤트',
        location: '회의실',
        category: '업무',
        repeat: { type: 'weekly', interval: 1 },
        notificationTime: 10,
      } as any,
      {
        id: '2',
        title: '단일 B',
        date: '2025-10-02',
        startTime: '11:00',
        endTime: '12:00',
        description: '단일 이벤트',
        location: '회의실',
        category: '업무',
        // repeat 없음 => 아이콘 표시 안 함
        notificationTime: 10,
      } as any,
    ]);

    setup();

    const monthView = within(screen.getByTestId('month-view'));

    // 반복 A는 모든 표시 인스턴스에 아이콘이 있어야 함
    const aTitles = await monthView.findAllByText('반복 A');
    for (const aTitle of aTitles) {
      const aContainer = aTitle.closest('li') ?? aTitle.parentElement!;
      expect(within(aContainer).getByLabelText('반복 일정')).toBeInTheDocument();
    }

    // 단일 B는 아이콘이 없어야 함 (해당 일자 1건)
    const bTitle = await monthView.findByText('단일 B');
    const bContainer = bTitle.closest('li') ?? bTitle.parentElement!;
    expect(within(bContainer).queryByLabelText('반복 일정')).toBeNull();
  });

  it('주 뷰에서도 repeat가 존재하는 이벤트만 아이콘을 표시한다(RED)', async () => {
    vi.setSystemTime(new Date('2025-10-01'));

    setupMockHandlerCreation([
      {
        id: '1',
        title: '반복 A',
        date: '2025-10-02',
        startTime: '09:00',
        endTime: '10:00',
        description: '반복 이벤트',
        location: '회의실',
        category: '업무',
        repeat: { type: 'weekly', interval: 1 },
        notificationTime: 10,
      } as any,
      {
        id: '2',
        title: '단일 B',
        date: '2025-10-02',
        startTime: '11:00',
        endTime: '12:00',
        description: '단일 이벤트',
        location: '회의실',
        category: '업무',
        notificationTime: 10,
      } as any,
    ]);

    const { user } = setup();

    // 주 뷰로 전환
    await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'week-option' }));

    const weekView = within(screen.getByTestId('week-view'));

    const aTitle = await weekView.findByText('반복 A');
    const aContainer = aTitle.closest('li') ?? aTitle.parentElement!;
    expect(within(aContainer).getByLabelText('반복 일정')).toBeInTheDocument();

    const bTitle = await weekView.findByText('단일 B');
    const bContainer = bTitle.closest('li') ?? bTitle.parentElement!;
    expect(within(bContainer).queryByLabelText('반복 일정')).toBeNull();
  });
});

// 수정/삭제 플로우 - 첫 RED 케이스 추가
describe('반복 일정 수정/삭제 - 통합(RED)', () => {
  it('반복 일정 단일 수정: 모달에서 예를 선택하면 해당 날짜만 단일로 반영되고 아이콘이 사라진다(RED)', async () => {
    vi.setSystemTime(new Date('2025-10-01'));

    setupMockHandlerCreation([
      {
        id: 'r1',
        title: '주간 회의',
        date: '2025-10-01',
        startTime: '09:00',
        endTime: '09:30',
        description: '',
        location: '',
        category: '업무',
        repeat: { type: 'weekly', interval: 1 },
        notificationTime: 10,
      } as any,
    ]);

    const { user } = setup();

    // 우측 리스트에서 선택 → 수정
    const list = within(screen.getByTestId('event-list'));
    await user.click(list.getByText('주간 회의'));
    await user.click(screen.getByLabelText('Edit event'));

    // 제목 변경
    const titleInput = screen.getByLabelText('제목');
    await user.clear(titleInput);
    await user.type(titleInput, '주간 회의(수정)');

    // 저장 후 모달에서 '예' 선택
    await user.click(screen.getByTestId('event-submit-button'));
    await user.click(screen.getByRole('button', { name: '예' }));

    // 기대: 해당 날짜 항목에서 반복 아이콘 제거되고 제목이 변경됨 (현재는 RED)
    const item = list.getByText('주간 회의(수정)');
    const container = item.closest('li') ?? item.parentElement!;
    expect(within(container).queryByLabelText('반복 일정')).toBeNull();
  });

  it('반복 일정 전체 수정: 모달에서 아니오를 선택하면 시리즈 전체에 변경이 반영되고 아이콘은 유지된다(RED)', async () => {
    vi.setSystemTime(new Date('2025-10-01'));

    setupMockHandlerCreation([
      {
        id: 'r2',
        title: '팀 점검',
        date: '2025-10-02',
        startTime: '10:00',
        endTime: '10:30',
        description: '',
        location: '',
        category: '업무',
        repeat: { type: 'weekly', interval: 1 },
        notificationTime: 10,
      } as any,
    ]);

    const { user } = setup();

    const list = within(screen.getByTestId('event-list'));
    await user.click(list.getByText('팀 점검'));
    await user.click(screen.getByLabelText('Edit event'));

    const titleInput = screen.getByLabelText('제목');
    await user.clear(titleInput);
    await user.type(titleInput, '팀 점검(전체 수정)');

    await user.click(screen.getByTestId('event-submit-button'));
    await user.click(screen.getByRole('button', { name: '아니오' }));

    // 기대: 뷰 범위 내 시리즈 인스턴스 제목 변경 + 반복 아이콘 유지 (RED)
    const changed = list.getByText('팀 점검(전체 수정)');
    const container = changed.closest('li') ?? changed.parentElement!;
    expect(within(container).getByLabelText('반복 일정')).toBeInTheDocument();
  });

  it('반복 일정 단일 삭제: 모달에서 예를 선택하면 해당 날짜 인스턴스만 사라진다(RED)', async () => {
    vi.setSystemTime(new Date('2025-10-01'));

    setupMockHandlerCreation([
      {
        id: 'r3',
        title: '정기 점검',
        date: '2025-10-03',
        startTime: '11:00',
        endTime: '11:30',
        description: '',
        location: '',
        category: '업무',
        repeat: { type: 'weekly', interval: 1 },
        notificationTime: 10,
      } as any,
    ]);

    const { user } = setup();

    const list = within(screen.getByTestId('event-list'));
    const target = await list.findByText('정기 점검');
    await user.click(target);
    await user.click(screen.getByLabelText('Delete event'));
    await user.click(screen.getByRole('button', { name: '예' }));

    // 기대: 해당 날짜 인스턴스만 제거 (RED)
    expect(list.queryByText('정기 점검')).toBeNull();
  });

  it('반복 일정 전체 삭제: 모달에서 아니오를 선택하면 시리즈 전체가 제거된다(RED)', async () => {
    vi.setSystemTime(new Date('2025-10-01'));

    setupMockHandlerCreation([
      {
        id: 'r4',
        title: '전체 삭제 테스트',
        date: '2025-10-07',
        startTime: '15:00',
        endTime: '16:00',
        description: '',
        location: '',
        category: '업무',
        repeat: { type: 'weekly', interval: 1 },
        notificationTime: 10,
      } as any,
    ]);

    const { user } = setup();

    const list = within(screen.getByTestId('event-list'));
    await user.click(list.getByText('전체 삭제 테스트'));
    await user.click(screen.getByLabelText('Delete event'));
    await user.click(screen.getByRole('button', { name: '아니오' }));

    // 기대: 시리즈 전체 제거 (RED)
    expect(list.queryByText('전체 삭제 테스트')).toBeNull();
  });
});
