# 테스트 규칙 명세 (Test Rules Specification)

## 📋 명세의 목적

이 문서는 **테스트 코드 작성 규칙**을 정의합니다. 모든 팀원이 동일한 기준으로 테스트를 작성하여 일관성 있는 코드를 유지할 수 있도록 합니다.

### 이 명세서의 목표

1. **명확한 규칙**: 무엇을 테스트해야 하고, 어떻게 작성해야 하는지 명확히 제시
2. **일관성**: 모든 팀원이 같은 패턴과 원칙을 따를 수 있도록
3. **실용성**: 실제 테스트 작성 시 즉시 활용 가능한 구체적 가이드
4. **학습성**: 초보자도 따라할 수 있는 단계별 설명

## 1. 테스트 작성 원칙

> **왜 원칙이 필요한가?**  
> 일관된 원칙을 따르면 테스트를 읽고 이해하는 것이 쉬워집니다. 누가 작성했든 같은 패턴을 따라가면 전체 흐름을 빠르게 파악할 수 있습니다.

#### **원칙 1: 테스트 구조 패턴**

프로젝트에서는 **AAA (Arrange-Act-Assert)** 패턴과 **Given-When-Then** 패턴이 모두 사용됩니다.

**왜 두 패턴을 선택했는가?**
- 각 패턴은 다른 상황에 최적화되어 있습니다
- 적절한 패턴을 선택하면 테스트 의도가 명확해집니다
- 같은 패턴으로 작성되면 코드 리뷰와 유지보수가 쉬워집니다

##### **AAA (Arrange-Act-Assert) 패턴**

순수 함수나 간단한 함수 호출 테스트에 사용됩니다.

```typescript
it('시작 시간이 종료 시간보다 늦을 때 에러 메시지를 반환한다', () => {
  // Arrange: 테스트 입력 준비
  const result = getTimeErrorMessage('14:00', '13:00');
  
  // Act: (함수 호출은 이미 포함됨)
  
  // Assert: 결과 검증
  expect(result).toEqual({
    startTimeError: '시작 시간은 종료 시간보다 빨라야 합니다.',
    endTimeError: '종료 시간은 시작 시간보다 늦어야 합니다.',
  });
});
```

**AAA 패턴이 사용되는 경우:**
- ✅ 순수 함수 테스트 (utils 함수)
- ✅ 단일 함수 호출 테스트
- ✅ 복잡한 상태 변경이 없는 경우

##### **Given-When-Then 패턴**

상태를 변경하거나 비동기 작업이 포함된 테스트에 사용됩니다.

```typescript
it('검색어에 맞는 이벤트만 필터링해야 한다', () => {
  // Given: 초기 데이터 설정
  const mockEvents: Event[] = [/* ... */];
  
  // When: 테스트 대상 실행
  act(() => {
    result.current.setSearchTerm('회의');
  });
  
  // Then: 결과 검증
  expect(result.current.filteredEvents).toEqual([/* ... */]);
});
```

**Given-When-Then 패턴이 사용되는 경우:**
- ✅ React Hooks 테스트
- ✅ 비동기 작업 테스트
- ✅ 상태 변경이 있는 테스트
- ✅ 통합 테스트

---

#### **원칙 2: 명확한 테스트 이름**

**왜 한글 이름을 사용하는가?**
- 우리 팀의 공통 언어로 의사소통의 장벽을 줄입니다
- 테스트 목적을 즉시 이해할 수 있습니다
- 비즈니스 로직을 다루는 테스트는 도메인 용어를 그대로 사용해 더욱 명확합니다

테스트 이름은 **한글로 작성**하며, "무엇을 테스트하는지" 명확하게 표현합니다.

**좋은 예:**
```typescript
it('시작 시간이 종료 시간보다 늦을 때 에러 메시지를 반환한다', () => {
  // ...
});
```

**나쁜 예:**
```typescript
it('should return error', () => {
  // ...
});
```

#### **원칙 3: 단일 책임**

**왜 한 테스트에 하나만 검증하는가?**
- 테스트가 실패했을 때 원인을 즉시 파악할 수 있습니다
- 각 테스트가 독립적으로 실행되어 유지보수가 쉽습니다
- 이름만 봐도 무엇이 문제인지 바로 알 수 있습니다

한 테스트는 하나의 기능만 검증합니다.

```typescript
// 좋은 예: 각 테스트가 독립적
it('검색어가 비어있을 때 모든 이벤트를 반환해야 한다', () => { /* ... */ });
it('검색어에 맞는 이벤트만 필터링해야 한다', () => { /* ... */ });
```

#### **원칙 4: 격리된 테스트**

**왜 테스트를 격리해야 하는가?**
- 테스트 순서에 의존하지 않습니다
- 병렬 실행이 안전합니다
- 어떤 테스트를 먼저 실행해도 같은 결과를 보장합니다
- 실패한 테스트가 다른 테스트를 망가뜨리지 않습니다

테스트 간 상호 영향이 없도록 작성합니다.

```typescript
beforeEach(() => {
  // 각 테스트 전에 초기화
  server.resetHandlers();
});

afterEach(() => {
  // 각 테스트 후에 정리
  vi.clearAllTimers();
});
```

---

## 2. 테스트 유형별 명세

#### **A. 유틸리티 함수 테스트 - AAA 패턴 사용**

유틸리티 함수 테스트는 **AAA (Arrange-Act-Assert) 패턴**을 사용합니다.

##### **A-1. dateUtils 테스트**
```typescript
describe('formatMonth', () => {
  it("2025년 7월 10일을 '2025년 7월'로 반환한다", () => {
    // Arrange: 입력 준비
    const date = new Date('2025-07-10');
    
    // Act: 함수 호출
    const result = formatMonth(date);
    
    // Assert: 결과 검증
    expect(result).toBe('2025년 7월');
  });
});
```

**핵심 테스트 케이스:**
- ✅ 다양한 날짜 포맷팅 테스트
- ✅ 윤년/평년 처리
- ✅ 월의 첫날/마지막날 처리
- ✅ 날짜 범위 검증
- ✅ 경계값 테스트

##### **A-2. eventUtils 테스트**
```typescript
describe('getFilteredEvents', () => {
  it("검색어 '이벤트 2'에 맞는 이벤트만 반환한다", () => {
    // Arrange: 입력 데이터 준비
    const events: Event[] = [/* ... */];
    
    // Act: 함수 호출
    const result = getFilteredEvents(events, '이벤트 2', new Date('2025-07-01'), 'month');
    
    // Assert: 결과 검증
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('이벤트 2');
  });
});
```

**핵심 테스트 케이스:**
- ✅ 검색어로 필터링
- ✅ 주간/월간 뷰별 필터링
- ✅ 검색어와 뷰 필터 동시 적용
- ✅ 대소문자 무시 검색
- ✅ 빈 결과 처리

##### **A-3. eventOverlap 테스트**
```typescript
describe('isOverlapping', () => {
  it('두 이벤트가 겹치는 경우 true를 반환한다', () => {
    // Arrange: 두 이벤트 설정
    const event1: Event = { /* ... */ };
    const event2: Event = { /* ... */ };
    
    // Act: 겹침 검사
    const result = isOverlapping(event1, event2);
    
    // Assert: 결과 검증
    expect(result).toBe(true);
  });
});
```

**핵심 테스트 케이스:**
- ✅ 시간 겹침 감지
- ✅ 경계값 테스트 (정확히 끝나는 순간 시작)
- ✅ 겹치지 않는 경우 처리
- ✅ 날짜 형식 오류 처리

##### **A-4. timeValidation 테스트**
```typescript
describe('getTimeErrorMessage', () => {
  it('시작 시간이 종료 시간보다 늦을 때 에러 메시지를 반환한다', () => {
    // Arrange: 잘못된 시간 입력
    const startTime = '14:00';
    const endTime = '13:00';
    
    // Act: 검증 함수 호출
    const result = getTimeErrorMessage(startTime, endTime);
    
    // Assert: 에러 메시지 반환 검증
    expect(result.startTimeError).toBeTruthy();
  });
});
```

**핵심 테스트 케이스:**
- ✅ 시간 순서 검증
- ✅ 동일 시간 처리
- ✅ 빈 값 처리
- ✅ 에러 메시지 정확성

##### **A-5. notificationUtils 테스트**
```typescript
describe('getUpcomingEvents', () => {
  it('알림 시간이 정확히 도래한 이벤트를 반환한다', () => {
    // Arrange: 테스트 데이터 준비
    const events: Event[] = [/* ... */];
    const now = new Date('2023-05-10T09:50:00');
    const notifiedEvents: string[] = [];
    
    // Act: 업커밍 이벤트 조회
    const upcomingEvents = getUpcomingEvents(events, now, notifiedEvents);
    
    // Assert: 결과 검증
    expect(upcomingEvents).toHaveLength(1);
    expect(upcomingEvents[0].title).toBe('이벤트 1');
  });
});
```

**핵심 테스트 케이스:**
- ✅ 정확한 알림 시간 감지
- ✅ 중복 알림 방지
- ✅ 과거/미래 이벤트 필터링

---

#### **B. Hook 테스트 - Given-When-Then 패턴 사용**

Hook 테스트는 **Given-When-Then 패턴**을 사용합니다.

##### **B-1. useCalendarView 테스트**
```typescript
describe('초기 상태', () => {
  it('view는 "month"이어야 한다', () => {
    const { result } = renderHook(() => useCalendarView());
    expect(result.current.view).toBe('month');
  });
});
```

**핵심 테스트 케이스:**
- ✅ 초기 상태 검증
- ✅ 뷰 변경
- ✅ 날짜 네비게이션 (이전/다음)
- ✅ 주간/월간별 네비게이션 차이
- ✅ 휴일 데이터 로딩

##### **B-2. useSearch 테스트**
```typescript
it('검색어가 비어있을 때 모든 이벤트를 반환해야 한다', () => {
  const { result } = renderHook(() => useSearch(mockEvents, currentDate, view));
  expect(result.current.filteredEvents).toEqual(mockEvents);
});
```

**핵심 테스트 케이스:**
- ✅ 빈 검색어 처리
- ✅ 검색어 필터링
- ✅ 다중 필드 검색 (제목/설명/위치)
- ✅ 실시간 검색 업데이트
- ✅ 뷰별 필터링 조합

##### **B-3. useEventOperations 테스트**
```typescript
it('정의된 이벤트 정보를 기준으로 적절하게 저장이 된다', async () => {
  setupMockHandlerCreation();
  const { result } = renderHook(() => useEventOperations(false));
  
  await act(async () => {
    await result.current.saveEvent(newEvent);
  });
  
  expect(result.current.events).toEqual([{ ...newEvent, id: '1' }]);
});
```

**핵심 테스트 케이스:**
- ✅ 일정 생성 (POST)
- ✅ 일정 수정 (PUT)
- ✅ 일정 삭제 (DELETE)
- ✅ 초기 로딩
- ✅ 네트워크 에러 처리
- ✅ 토스트 메시지 검증

**MSW 모킹 패턴:**
```typescript
setupMockHandlerCreation(); // 새 이벤트 생성 핸들러 설정
setupMockHandlerUpdating(); // 이벤트 수정 핸들러 설정
setupMockHandlerDeletion(); // 이벤트 삭제 핸들러 설정
```

##### **B-4. useNotifications 테스트**
```typescript
it('지정된 시간이 된 경우 알림이 새롭게 생성되어 추가된다', () => {
  vi.setSystemTime(new Date(Date.now() + notificationTime * 분));
  
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  
  expect(result.current.notifications).toHaveLength(1);
});
```

**핵심 테스트 케이스:**
- ✅ 알림 타이밍 감지
- ✅ 중복 알림 방지
- ✅ 알림 메시지 내용
- ✅ 알림 제거 기능

**타이머 모킹:**
```typescript
vi.useFakeTimers();
vi.setSystemTime(new Date('2025-10-15 08:49:59'));
act(() => { vi.advanceTimersByTime(1000); });
```

---

#### **C. 통합 테스트**

##### **C-1. App 통합 테스트**

```typescript
describe('일정 CRUD 및 기본 기능', () => {
  it('입력한 새로운 일정 정보에 맞춰 모든 필드가 이벤트 리스트에 정확히 저장된다.', async () => {
    const { user } = setup(<App />);
    await saveSchedule(user, { /* ... */ });
    
    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('새 회의')).toBeInTheDocument();
  });
});
```

**핵심 테스트 케이스:**

1. **일정 CRUD**
   - ✅ 일정 생성 (모든 필드 검증)
   - ✅ 일정 수정
   - ✅ 일정 삭제
   - ✅ 삭제 후 조회 불가 확인

2. **뷰 기능**
   - ✅ 주간 뷰 전환 및 일정 표시
   - ✅ 월간 뷰 전환 및 일정 표시
   - ✅ 뷰별 빈 상태 처리
   - ✅ 날짜 네비게이션

3. **검색 기능**
   - ✅ 검색어 입력 및 필터링
   - ✅ 검색 결과 없음 처리
   - ✅ 검색어 초기화

4. **일정 충돌 감지**
   - ✅ 겹치는 시간 경고 표시
   - ✅ 충돌 경고 다이얼로그
   - ✅ 수정 시 충돌 감지

5. **알림 기능**
   - ✅ 알림 시간 감지
   - ✅ 알림 메시지 표시
   - ✅ 알림 아이콘 및 강조

6. **공휴일 표시**
   - ✅ 휴일 레이블 표시
   - ✅ 검증 (1월 1일 = 신정)

---

## 3. MSW (Mock Service Worker) 사용 규칙

#### **설정**
```typescript
import { server } from '../../setupTests';
import { http, HttpResponse } from 'msw';

beforeEach(() => {
  server.use(
    http.get('/api/events', () => {
      return HttpResponse.json({ events: mockEvents });
    })
  );
});

afterEach(() => {
  server.resetHandlers();
});
```

#### **핸들러 유틸리티 함수**
```typescript
// 새 이벤트 생성
setupMockHandlerCreation([mockEvents]);

// 이벤트 수정
setupMockHandlerUpdating();

// 이벤트 삭제
setupMockHandlerDeletion();
```

#### **에러 시나리오 테스트**
```typescript
it('이벤트 로딩 실패 시 에러 토스트가 표시되어야 한다', async () => {
  server.use(
    http.get('/api/events', () => {
      return new HttpResponse(null, { status: 500 });
    })
  );
  
  renderHook(() => useEventOperations(true));
  await act(() => Promise.resolve(null));
  
  expect(enqueueSnackbarFn).toHaveBeenCalledWith('이벤트 로딩 실패', { variant: 'error' });
});
```

---

## 4. 테스트 작성 체크리스트

#### **단위 테스트 작성 체크리스트**
- [ ] 함수명과 목적이 명확한지?
- [ ] AAA 또는 Given-When-Then 구조를 따르는가?
- [ ] 경계값 테스트를 포함하는가?
- [ ] 에러 케이스를 테스트하는가?
- [ ] 예외 상황을 다루는가?

#### **Hook 테스트 작성 체크리스트**
- [ ] 초기 상태를 검증하는가?
- [ ] 모든 상태 변경을 테스트하는가?
- [ ] 비동기 작업을 await 처리하는가?
- [ ] act()로 상태 업데이트를 감싸는가?
- [ ] MSW 핸들러를 올바르게 설정했는가?

#### **통합 테스트 작성 체크리스트**
- [ ] 실제 사용자 시나리오를 시뮬레이션하는가?
- [ ] userEvent를 사용하여 사용자 동작을 흉내내는가?
- [ ] screen.getByRole 등 접근성 기준 선택자를 사용하는가?
- [ ] 모든 UI 상호작용을 검증하는가?
- [ ] 에러 및 예외 상황을 테스트하는가?

---

## 5. 자주 사용하는 테스트 패턴

#### **패턴 1: AAA 패턴 (순수 함수 테스트)**
```typescript
it('시작 시간이 종료 시간보다 늦을 때 에러 메시지를 반환한다', () => {
  // Arrange: 입력 준비
  const result = getTimeErrorMessage('14:00', '13:00');
  
  // Act: (함수 호출은 이미 포함됨)
  
  // Assert: 결과 검증
  expect(result.startTimeError).toBeTruthy();
});
```

#### **패턴 2: Given-When-Then 패턴 (Hooks 테스트)**
```typescript
it('검색어에 맞는 이벤트만 필터링해야 한다', () => {
  // Given: 초기 데이터
  const mockEvents: Event[] = [/* ... */];
  const { result } = renderHook(() => useSearch(mockEvents, currentDate, view));
  
  // When: 상태 변경
  act(() => {
    result.current.setSearchTerm('회의');
  });
  
  // Then: 검증
  expect(result.current.filteredEvents).toHaveLength(1);
});
```

#### **패턴 3: renderHook 활용**
```typescript
const { result } = renderHook(() => useHook());

expect(result.current.property).toBe(expected);
```

#### **패턴 4: 비동기 처리**
```typescript
await act(async () => {
  await result.current.asyncFunction();
});

expect(result.current.data).toBe(expected);
```

#### **패턴 5: 날짜 모킹**
```typescript
vi.useFakeTimers();
vi.setSystemTime(new Date('2025-10-01'));

// ... 테스트 코드 ...

act(() => {
  vi.advanceTimersByTime(1000);
});
```

#### **패턴 6: MSW 에러 처리**
```typescript
server.use(
  http.post('/api/events', () => {
    return new HttpResponse(null, { status: 500 });
  })
);
```

#### **패턴 7: within()으로 범위 좁히기**
```typescript
const eventList = within(screen.getByTestId('event-list'));
expect(eventList.getByText('이벤트')).toBeInTheDocument();
```

---

## 6. 테스트 커버리지 목표

- **Unit Tests (Utils)**: 100% 커버리지 목표
- **Hook Tests**: 핵심 로직 100%, 엣지 케이스 80%
- **Integration Tests**: 주요 사용자 플로우 100%

---

## 7. 실행 명령어

```bash
# 모든 테스트 실행
pnpm test

# UI로 테스트 실행
pnpm test:ui

# 커버리지 확인
pnpm test:coverage
```

---

## 8. 참고 자료

- **Vitest 공식 문서**: https://vitest.dev/
- **React Testing Library**: https://testing-library.com/react
- **MSW**: https://mswjs.io/
- **Testing Best Practices**: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library

---

## 9. 테스트 작성 가이드

### 9.1 새 기능 추가 시 테스트 작성 절차

1. **기능 정의**: 어떤 기능을 테스트할지 명확히 정의
2. **테스트 케이스 작성**: 모든 시나리오를 나열
3. **테스트 유형 결정**: 유틸리티 함수인지, Hook인지, 통합 테스트인지 확인
4. **패턴 선택**: 
   - 순수 함수 → **AAA 패턴** (Arrange-Act-Assert)
   - Hooks/비동기 → **Given-When-Then 패턴**
5. **테스트 코드 작성**: 선택한 패턴에 따라 작성
6. **실제 구현**: 테스트를 통과하도록 코드 구현
7. **리팩토링**: 코드 품질 향상

### 9.2 테스트가 실패하는 경우

1. **원인 파악**: 어떤 테스트가 실패하는지 확인
2. **에러 메시지 분석**: 콘솔 로그 확인
3. **데이터 확인**: Mock 데이터가 올바른지 확인
4. **타이밍 이슈**: 비동기 처리가 제대로 되었는지 확인
5. **cleanup**: beforeEach/afterEach가 제대로 실행되는지 확인

