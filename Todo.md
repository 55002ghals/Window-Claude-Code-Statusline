# Todo List - Claude Code StatusLine Add-on

## Step 1: 프로젝트 초기화
- [x] package.json 생성
- [x] 디렉토리 구조 생성 (src/, src/parsers/, src/formatters/)
- [x] config.example.json 생성

## Step 2: stdin JSON 파서 (src/parsers/session.js)
- [x] stdin JSON에서 model, context_window, rate_limits, current_usage 추출
- [x] null/undefined 안전 처리

## Step 3: 비용 계산 모듈 (src/parsers/cost.js)
- [x] 모델별 단가 테이블 정의
- [x] 토큰 x 단가 -> USD 계산 함수
- [x] 구독제 판별 로직 (plan != "api" -> "(Sub)")
- [x] 구독제 월 비용 매핑

## Step 4: 통계 집계 모듈 (src/parsers/stats.js)
- [x] ~/.claude/stats-cache.json 읽기
- [x] 이번 달 날짜 범위 필터링 + 토큰 합산 -> 비용 변환
- [x] 구독 사용자 월 구독료 반환

## Step 5: 시스템 리소스 모듈 (src/parsers/system.js)
- [x] CPU 사용률 계산 (os.cpus(), 임시 파일 캐싱으로 델타 계산)
- [x] Memory 사용률 계산 (os.totalmem(), os.freemem())

## Step 6: 포맷터 (src/formatters/statusline.js)
- [x] 각 섹션 문자열 생성
- [x] OSC 8 이스케이프 시퀀스로 클릭 가능 링크 래핑
- [x] 구분자 연결 + 한 줄 출력

## Step 7: MCP 상세 정보 모듈 (src/formatters/mcp-detail.js)
- [x] ~/.claude/settings.json에서 mcpServers 읽기 (글로벌 + 프로젝트 레벨 병합)
- [x] Ctrl+클릭 시 서버 목록 표시용 임시 파일 생성

## Step 8: 메인 엔트리포인트 (src/index.js)
- [x] stdin 읽기 -> JSON.parse
- [x] 파서들 호출 (session, cost, stats, system)
- [x] 포맷터 호출 -> stdout 출력
- [x] 에러 시 fallback 문자열 출력

## Step 9: 설치 스크립트 (install.js)
- [x] ~/.claude/settings.json 읽기/백업
- [x] statusLine 설정 삽입 또는 업데이트

## Step 10: 설정 모듈 (src/config.js)
- [x] config.json 로드 (없으면 기본값)
- [x] process.argv에서 --no-* 플래그 파싱
- [x] 단가 오버라이드 병합

## Step 11: 테스트 & 디버깅
- [x] 샘플 stdin JSON으로 직접 실행 테스트
- [x] API 모드 테스트 (정상 출력 확인)
- [x] --no-cpu --no-mem 플래그 테스트 (CPU/MEM 숨김 확인)
- [x] 빈 stdin 에러 핸들링 테스트 ("StatusLine: error" fallback)
- [x] 빈 JSON {} 테스트 (모든 섹션 "--" 폴백 표시)
- [ ] 실제 Claude Code 세션에서 동작 확인 (install.js 실행 후)
