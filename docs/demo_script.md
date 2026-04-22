# 데모 영상 스크립트

## 목표
- 사용자가 문제를 선택하고 코드를 제출한 뒤, AI가 AST 기반으로 꼬리 질문을 던지고 3축 리포트를 생성하는 MVP를 2분 내외로 보여준다.
- 이 영상은 전체 서비스 소개가 아니라 `코어 워크스페이스 시연`이라는 점을 전제로 한다.

## 포지셔닝 한 줄

- 시작 멘트에서 `지금 보여드리는 화면은 전체 서비스가 아니라, 코드 기반 질문 분기와 3축 피드백을 증명하는 코어 워크스페이스입니다.`를 먼저 말한다.
- 영상 마지막 10~15초에는 `문제 탐색 / 세션 히스토리 / 학습자 성장 추적 / 기관 대시보드`를 실서비스 확장 레이어로 짧게 연결한다.
- 관련 Q&A 기준 문구는 `docs/demo_positioning.md`를 따른다.

## 추천 시나리오
1. 홈 화면에서 `연속 부분 수열의 최소 길이` 문제 선택
2. 일부러 `중첩 반복문`이 들어간 서브옵티멀 코드 제출
3. Judge 결과와 함께 `normal flow` 질문 시작
4. 3번의 답변에서 아래 포인트를 말한다.
   - brute force 대비 왜 느린지
   - sliding window가 가능한 이유
   - left 포인터를 줄여도 되는 조건
5. 마지막에 3축 리포트와 추천 drill 노출

## 데모용 코드 샘플

```python
def min_subarray_len(target: int, nums: list[int]) -> int:
    answer = float("inf")
    for i in range(len(nums)):
        running = 0
        for j in range(i, len(nums)):
            running += nums[j]
            if running >= target:
                answer = min(answer, j - i + 1)
                break
    return 0 if answer == float("inf") else answer
```

## 예상 면접 포인트
- 왜 O(N^2)인지
- 두 포인터/슬라이딩 윈도우로 줄일 수 있는 이유
- 합 조건 만족 후 shrink 타이밍

## 장애 대응
- Judge0 미연동 시 `Demo mode execution` 문구를 그대로 사용한다.
- Pydantic AI 미연동 시 fallback 질문/리포트가 생성되므로 데모는 계속 진행 가능하다.
- API 지연 시 제출 후 1초 정도 멈춘 뒤 다시 질문 전환 화면을 보여준다.
