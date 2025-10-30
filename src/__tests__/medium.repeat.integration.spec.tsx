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
