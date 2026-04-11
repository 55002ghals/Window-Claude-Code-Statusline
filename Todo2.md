# Todo2 - Plan.md 변경사항 코드 반영

## 1. 구독제 자동감지 (config.js + cost.js)
- [x] config.js: plan 기본값 "api" -> "auto"로 변경
- [x] config.js: resolvePlan() 함수 추가 - rate_limits 유무로 구독 판별
- [x] index.js: resolvePlan 연동하여 data 기반 plan 자동 결정
- [x] config.example.json: plan 기본값 "auto"로 변경

## 2. Rate Limit 바 그래프 표시 (session.js + statusline.js)
- [x] session.js: 5h/7d 둘 다 개별 파싱 (fiveHour, sevenDay 각각 반환)
- [x] statusline.js: 바 그래프 포맷 구현 `5h[######----] 62%(3h12m)`
- [x] statusline.js: 10칸 고정, # = 사용량, - = 여유
- [x] statusline.js: rate_limits null이면 `5h[----------] --(--) | 7d[----------] --(--)`

## 3. 줄바꿈 들여쓰기 (statusline.js)
- [x] formatStatusLine: 터미널 폭 추적 (process.stdout.columns || 120)
- [x] visibleLength(): OSC 8 이스케이프 시퀀스 제외한 표시 길이 계산
- [x] 초과 시 `\n  ` 삽입하여 다음 줄로 이어서 표시

## 4. 테스트
- [x] 구독제 자동감지 (rate_limits 있는 JSON): TknCost : (Sub), MonCost : $20(Pro) 확인
- [x] API 모드 (rate_limits 없는 JSON): TknCost : $0.58, 바 그래프 --(--) 확인
- [x] 바 그래프 출력: 5h[######----] 62%(6h50m), 7d[###-------] 30%(4d0h) 확인
- [x] 줄바꿈 동작: 120폭 초과 시 \n + 2칸 들여쓰기 정상 동작 확인
