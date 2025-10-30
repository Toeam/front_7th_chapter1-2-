# 반복 아이콘 표시 작업 로그 (2025-10-30)

## 개요
- 목표: 월/주 뷰에서 반복 일정(`repeat` 존재) 앞에 14px Repeat 아이콘 표시, 동일 날짜 이벤트는 시작 시간 오름차순 정렬
- 전제: 모든 일정은 단일 일정. 아이콘은 캘린더 내부(주/월 뷰)에서만 표시

## 타임라인 요약
1) 명세 작성 및 커밋
- `.cursor/docs/repeat-icon-display-spec.md` 작성 (월/주 뷰 범위, 접근성, 정렬 포함)
- `.cursor/docs/repeat-icon-test-design.md` 작성 (통합 테스트 중심의 설계)

2) 통합 테스트 추가(RED)
- `src/__tests__/medium.repeat.integration.spec.tsx`에 월/주 뷰 반복 아이콘/정렬 케이스 추가
- 초기 실패 원인: `repeat` 미존재 이벤트 처리 예외, 스낵바 대기 및 다중 발생 텍스트 선택 문제

3) 구현(GREEN)
- `src/App.tsx`
  - `RepeatIcon` 임포트 및 제목 앞 표시
  - 주/월 뷰 동일 날짜 이벤트 정렬(`startTime` 오름차순)
  - 사이드바 반복 정보 표시에 null 가드 추가
- `src/utils/eventUtils.ts`
  - `repeat` 미존재 시 기본값 `{ type: 'none', interval: 0 }` 처리
- 테스트 수정
  - 월 뷰: `findAllByText('반복 A')`로 다중 인스턴스 처리
  - 스낵바 텍스트 대기 제거, 비동기 렌더는 `findBy*` 사용
- 전체 테스트 통과 확인(123/123)

4) 리팩토링(안전)
- `src/App.tsx`에서 중복된 이벤트 타이틀 UI를 `EventTitle` 소컴포넌트로 추출
- 테스트/린트/타입 체크 모두 통과 유지

## 커밋 내역(핵심)
- docs: add spec/test-design for repeat icon
- test: add month/week repeat icon display integration tests (RED)
- feat(calendar): show repeat icon, sort same-day events; fix repeat expansion; add tests
- refactor(ui): extract EventTitle component (week/month)

## 테스트 결과 스냅샷
- Files: 13 passed / Tests: 123 passed
- 일부 MUI 경고(`none` 값) 로그는 설계 범위 내에서 허용되는 테스트 시나리오 부수 출력

## 참고
- 접근성: 아이콘 `aria-label="반복 일정"`
- 아이콘 크기/색상: 14px, 텍스트 색상 상속
- 동일 날짜 정렬: `a.startTime.localeCompare(b.startTime)`
