# Claude Code StatusLine Add-on - Implementation Plan

## Overview

Windows 환경 Claude Code CLI 하단에 모델 정보, 컨텍스트 사용량, 비용 추적, 사용량 제한 등을 실시간 표시하는 StatusLine Add-on.

Claude Code v2.1.6+의 네이티브 `statusLine` 기능을 활용하여, 매 턴마다 stdin으로 전달되는 세션 JSON을 Node.js 스크립트가 파싱하고 한 줄로 포맷팅하여 stdout 출력.

---

## Architecture

```
Claude Code (매 턴마다 실행)
  |
  +-- stdin: 세션 JSON (model, context_window, rate_limits, etc.)
  |
  v
Node.js 스크립트 (src/index.js)
  |
  +-- stdin JSON 파싱 -> model, context %, rate limits, cache hit ratio
  +-- 토큰 x 단가 -> 실시간 cost 계산 (API 사용자만)
  +-- ~/.claude/stats-cache.json -> 월별 cost 집계
  +-- ~/.claude/settings.json -> MCP 서버 상태 확인
  +-- os 모듈 -> CPU / Memory 사용률
  |
  v
stdout: 포맷팅된 한 줄 문자열 (OSC 8 클릭 가능 링크 포함) -> Claude Code CLI 하단 표시
```

---

## Features & Data Sources

### 1. Model Info
- **소스**: stdin JSON `model.display_name`
- **표시**: `Model : Opus4.6`
- **구현 난이도**: 매우 쉬움 (단순 필드 읽기)

### 2. Context Window Percentage
- **소스**: stdin JSON `context_window.used_percentage`
- **표시**: `CtxWindow% : 45%`
- **폴백**: `context_window`가 null이면 `CtxWindow% : --` 표시
- **구현 난이도**: 매우 쉬움

### 3. Cost Tracking

#### 3-1. 실시간 세션 토큰 비용
- **소스**: stdin JSON `context_window.current_usage`에서 토큰 수 추출
  - `input_tokens`, `output_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`
- **계산**: 토큰 수 x 모델별 단가 (아래 단가 테이블 참조)
- **표시**:
  - API 사용자: `TknCost : $0.12`
  - 구독제 사용자 (Pro/Max 등): `TknCost : (Sub)`
- **구독 판별**: 자동감지 + config.json 수동 오버라이드
  - **자동감지**: stdin JSON에 `rate_limits` 필드가 존재하면 구독제로 판별 (rate_limits는 Pro/Max 구독 사용자에게만 제공됨)
  - **수동 오버라이드**: config.json의 `plan` 필드가 명시적으로 설정되어 있으면 자동감지보다 우선 적용
  - **기본값**: `"auto"` (자동감지 모드). rate_limits 있으면 구독제, 없으면 API 사용자로 판별
  - **플랜 종류 감지**: 구독제로 판별된 경우 config.json에 `plan`이 명시되어 있지 않으면 기본 `"pro"`로 표시
- **구현 난이도**: 쉬움

#### 3-2. 월별 비용
- **소스**: `~/.claude/stats-cache.json`
  - `dailyModelTokens`: 날짜별 모델별 토큰 사용량
  - `modelUsage`: 모델별 누적 토큰 (inputTokens, outputTokens, cacheReadInputTokens, cacheCreationInputTokens)
- **계산**: 이번 달 날짜 범위 필터링 후 토큰 x 단가 합산
- **표시**:
  - API 사용자: `MonCost : $62.30`
  - 구독제 사용자: `MonCost : $20(Pro)` 또는 `MonCost : $100(Max)` 등 플랜별 월 구독료 표시
- **구현 난이도**: 중간 (파일 읽기 + 날짜 필터링 + 집계 로직)

#### 모델별 단가 테이블 (per 1M tokens, 2025년 기준)
| Model | Input | Output | Cache Write | Cache Read |
|-------|-------|--------|-------------|------------|
| claude-opus-4-6 | $15.00 | $75.00 | $18.75 | $1.50 |
| claude-sonnet-4-6 | $3.00 | $15.00 | $3.75 | $0.30 |
| claude-haiku-4-5 | $0.80 | $4.00 | $1.00 | $0.08 |

> **NOTE**: 단가는 변경될 수 있으므로 `config.js`에서 오버라이드 가능하게 설계

#### 구독제 플랜별 월 비용 테이블
| Plan | 월 구독료 | 표시 |
|------|-----------|------|
| pro | $20 | `MonCost : $20(Pro)` |
| max | $100 | `MonCost : $100(Max)` |
| max5x | $200 | `MonCost : $200(Max5x)` |
| api | 토큰 기반 계산 | `MonCost : $62.30` |

### 4. Cache Hit Ratio
- **소스**: stdin JSON `context_window.current_usage`
- **계산**: `cache_read_input_tokens / (input_tokens + cache_read_input_tokens + cache_creation_input_tokens) x 100`
- **표시**: `CacheHit% : 78%`
- **폴백**: `current_usage`가 null이면 `CacheHit% : --` 표시
- **구현 난이도**: 쉬움

### 5. Usage Limits & Reset Countdown

#### Rate Limits
- **소스**: stdin JSON `rate_limits` (v2.1.80+)
  - `rate_limits.five_hour.used_percentage` -- 5시간 사용량 %
  - `rate_limits.five_hour.resets_at` -- ISO 8601 리셋 시간
  - `rate_limits.seven_day.used_percentage` -- 7일 사용량 %
  - `rate_limits.seven_day.resets_at` -- ISO 8601 리셋 시간

#### Reset Time
- **계산**: `resets_at` ISO 8601 -> 로컬 시각 변환
- **표시**: 5시간/7일 두 제한 모두 표시, 각각 바 그래프 + 괄호 안에 리셋 시각
  - `5h[████████████        ] 62%(14:30) | 7d[██████              ] 30%(4/14 12:00)`
  - 바 형식: tqdm 스타일 Progress Bar. `[` + `█` (사용량) + ` ` (공백, 여유) + `]`, 총 20칸 고정
  - 참조: https://jcstory94.tistory.com/89
  - `█` 개수 = `Math.round(used_percentage / 5)` (20칸 기준)
  - 괄호 안: 리셋 시각 (5h는 `HH:MM`, 7d는 `M/DD HH:MM` 형식, 로컬 타임존)
  - rate_limits가 null이면: `5h[                    ] --(--) | 7d[                    ] --(--)` 표시
- **구현 난이도**: 쉬움 (시각 변환 + 문자열 반복)

### 6. System Resources (CPU & Memory)
- **소스**: Node.js `os` 모듈
  - CPU: `os.cpus()`로 코어별 idle/total 시간 비교하여 사용률 계산
  - Memory: `os.totalmem()`, `os.freemem()`으로 사용률 계산
- **계산**:
  - CPU: 전체 코어 평균 사용률 `(1 - idle / total) x 100`
  - MEM: `(1 - freemem / totalmem) x 100`
- **표시**: `CPU : 42% | MEM : 60%`
- **폴백**: 측정 실패 시 `CPU : -- | MEM : --` 표시
- **구현 난이도**: 쉬움 (Node.js os 모듈 내장)
- **NOTE**: CPU 사용률은 스크립트 실행 시점의 순간 스냅샷. 정확한 측정을 위해 이전 실행의 CPU 타임을 임시 파일에 캐싱하여 델타 계산 가능.

### 7. MCP Server Status
- **소스**: `~/.claude/settings.json`의 `mcpServers` 키
- **계산**: 설정된 서버 수 카운트. 실제 health check는 불가능하므로 설정된 서버 수만 표시.
- **대안**: 프로젝트 레벨 `.claude/settings.json`의 `mcpServers`도 병합
- **표시**: `MCP:3` (설정된 서버 수)
- **Ctrl+클릭 기능**: OSC 8 링크로 감싸서 Ctrl+클릭 시 연결된 MCP 서버 목록(이름, 타입, command) 정보를 표시
- **구현 난이도**: 쉬움~중간

---

## Clickable Links (OSC 8)

OSC 8 이스케이프 시퀀스를 사용하여 statusLine의 각 섹션을 클릭 가능하게 만든다.
Windows/Linux에서는 Ctrl+클릭으로 동작한다.

참조: https://code.claude.com/docs/ko/statusline#clickable-links

### OSC 8 형식
```
\e]8;;URL\e\\표시텍스트\e]8;;\e\\
```

### 각 섹션별 클릭 링크 매핑 (2026-04-10 검증 완료)
| 섹션 | 클릭 시 연결 URL | 상태 |
|------|------------------|------|
| Model : Opus4.6 | https://platform.claude.com/docs/en/docs/about-claude/models | 활성 |
| CtxWindow% : 45% | https://code.claude.com/docs/en/context-window | 활성 |
| TknCost : $0.12 | https://platform.claude.com/docs/en/docs/about-claude/pricing | 활성 |
| MonCost : $62.30 | https://platform.claude.com/docs/en/docs/about-claude/pricing | 활성 |
| CacheHit% : 78% | https://platform.claude.com/docs/en/docs/build-with-claude/prompt-caching | 활성 |
| 5h[████████████        ] 62%(14:30) | https://platform.claude.com/docs/en/api/rate-limits | 활성 |
| 7d[██████              ] 30%(4/14 12:00) | https://platform.claude.com/docs/en/api/rate-limits | 활성 |
| CPU : 42% | (클릭 링크 없음, 시스템 정보) | - |
| MEM : 60% | (클릭 링크 없음, 시스템 정보) | - |
| MCP:3 | Ctrl+클릭 시 MCP 서버 목록 정보 표시 (별도 처리) | - |

### MCP 클릭 시 상세 정보
MCP:3 클릭 시 `~/.claude/settings.json`에서 읽은 서버 정보를 간략하게 보여준다.
구현 방식: OSC 8 링크를 로컬 파일 또는 임시 HTML에 연결하여, 클릭 시 MCP 서버 이름/타입/command를 나열한 페이지를 열도록 한다.

---

## Output Format

고정 2줄 포맷. 구분자 `|` 사용. 각 섹션은 OSC 8 클릭 가능 링크로 감쌈:

- **1줄**: Model, 5h rate limit, 7d rate limit
- **2줄**: TknCost, MonCost, CacheHit%, CtxWindow%, MEM, CPU, MCP

```
Model : Opus4.6 | 5h[████████████        ] 62%(14:30) | 7d[██████              ] 30%(4/14 12:00)
TknCost : $0.12 | MonCost : $62.30 | CacheHit% : 78% | CtxWindow% : 45% | MEM : 60% | CPU : 42% | MCP:3
```

구독제 사용자 예시:
```
Model : Opus4.6 | 5h[████████████        ] 62%(14:30) | 7d[██████              ] 30%(4/14 12:00)
TknCost : (Sub) | MonCost : $20(Pro) | CacheHit% : 78% | CtxWindow% : 45% | MEM : 60% | CPU : 42% | MCP:3
```

각 줄은 `console.log`로 별도 출력하여 Claude Code의 멀티라인 statusLine 기능을 사용한다 (참조: https://code.claude.com/docs/en/statusline#display-multiple-lines). 각 줄 내에서 폭 부족 시에는 Claude Code가 자체적으로 truncate 처리 (줄바꿈/축약 로직 없음).

### 표시 순서 (우선순위 높은 것부터)
1. Model info (가장 먼저 표시)
2. 5h rate limit bar (5시간 제한)
3. 7d rate limit bar (7일 제한)
4. TknCost (실시간 세션 비용)
5. MonCost (월별 비용)
6. Cache hit ratio
7. Context window %
8. Memory 사용률
9. CPU 사용률
10. MCP 상태 (가장 마지막)

---

## File Structure

```
proj_msClaudeCodeAddon/
+-- package.json              # 프로젝트 메타, 의존성 (없거나 최소)
+-- install.js                # settings.json에 statusLine 설정 자동 삽입
+-- src/
    +-- index.js              # 메인 엔트리포인트
    |                         #   1. stdin 읽기
    |                         #   2. 파서 호출
    |                         #   3. 포맷터 호출
    |                         #   4. stdout 출력
    +-- parsers/
    |   +-- session.js        # stdin JSON 파싱 (model, context, rate_limits)
    |   +-- cost.js           # 토큰 -> USD 변환, 모델별 단가 테이블, 구독 판별
    |   +-- stats.js          # stats-cache.json 읽기, 월별 집계
    |   +-- system.js         # CPU / Memory 사용률 측정 (os 모듈)
    +-- formatters/
    |   +-- statusline.js     # 섹션별 포맷팅 + OSC 8 링크 래핑 -> 한 줄 문자열 조합
    |   +-- mcp-detail.js     # MCP 서버 상세 정보 생성 (클릭 시 표시용)
    +-- config.js             # 사용자 설정 로드 (단가 오버라이드, 플랜 타입, 표시 항목 토글)
+-- config.example.json       # 설정 파일 예시
```

---

## Configuration

### settings.json 설정 (Claude Code)

`~/.claude/settings.json`에 추가:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node C:/Users/ab550/OneDrive/Desktop/proj_msClaudeCodeAddon/src/index.js"
  }
}
```

### Add-on 자체 설정 (config.example.json)

```json
{
  "plan": "auto",
  "pricing": {
    "claude-opus-4-6": { "input": 15.0, "output": 75.0, "cacheWrite": 18.75, "cacheRead": 1.5 },
    "claude-sonnet-4-6": { "input": 3.0, "output": 15.0, "cacheWrite": 3.75, "cacheRead": 0.3 },
    "claude-haiku-4-5": { "input": 0.8, "output": 4.0, "cacheWrite": 1.0, "cacheRead": 0.08 }
  },
  "subscriptionCost": {
    "pro": 20,
    "max": 100,
    "max5x": 200
  },
  "separator": " | "
}
```

> **Note**: `display` 토글은 config.json이 아닌 CLI 플래그로 제어한다 (아래 참조).

### CLI Flags로 표시 항목 제어

settings.json의 `command` 문자열에 플래그를 추가하여 개별 섹션을 on/off 한다.

**기본 동작**: 모든 섹션 표시 (플래그 없으면 전부 켜짐)

**플래그 목록**:

| 플래그 | 효과 | 섹션 |
|--------|------|------|
| `--no-model` | 모델 정보 숨김 | Model : opus-4.6 |
| `--no-context` | 컨텍스트 윈도우 숨김 | CtxWindow% : 45% |
| `--no-tkncost` | 실시간 토큰 비용 숨김 | TknCost : $0.12 |
| `--no-moncost` | 월별 비용 숨김 | MonCost : $62.30 |
| `--no-cache` | 캐시 히트율 숨김 | Cache% : 78% |
| `--no-limits` | Rate limit 바 숨김 | 5h[████...    ] / 7d[...] |
| `--no-cpu` | CPU 사용률 숨김 | CPU : 42% |
| `--no-mem` | 메모리 사용률 숨김 | MEM : 60% |
| `--no-mcp` | MCP 서버 수 숨김 | MCP : 3 |

**settings.json 예시 (CPU, MEM 숨김)**:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node C:/Users/ab550/OneDrive/Desktop/proj_msClaudeCodeAddon/src/index.js --no-cpu --no-mem"
  }
}
```

**config.js 파싱 로직**:

```
// process.argv에서 --no-* 플래그 파싱
// 예: ["node", "index.js", "--no-cpu", "--no-mem"]
// -> { showCpu: false, showMem: false, 나머지: true }
```

### /statusline 자연어 연동

사용자가 Claude Code에서 `/statusline` 명령으로 자연어 요청을 하면,
Claude Code의 `statusline-setup` 에이전트가 요청을 해석하여
`~/.claude/settings.json`의 command 문자열을 자동 수정한다.

**워크플로우 예시**:

```
1. 사용자 입력:
   /statusline hide CPU and memory

2. statusline-setup 에이전트 동작:
   - settings.json 읽기
   - 현재 command: "node .../src/index.js"
   - 사용자 의도 파싱: CPU 숨김, Memory 숨김
   - command 수정: "node .../src/index.js --no-cpu --no-mem"
   - settings.json 저장

3. 다음 Claude 턴부터 CPU, MEM 섹션이 사라짐
```

```
1. 사용자 입력:
   /statusline show everything

2. statusline-setup 에이전트 동작:
   - settings.json 읽기
   - 모든 --no-* 플래그 제거
   - command: "node .../src/index.js"
   - settings.json 저장

3. 다음 Claude 턴부터 모든 섹션 표시
```

**지원 자연어 패턴 (예시)**:
- "hide CPU" -> `--no-cpu` 추가
- "show CPU" -> `--no-cpu` 제거
- "hide CPU and memory" -> `--no-cpu --no-mem` 추가
- "show everything" / "show all" -> 모든 `--no-*` 제거
- "only show model and cost" -> 나머지 전부 `--no-*` 추가

---

## Implementation Steps

### Step 1: 프로젝트 초기화
- `package.json` 생성 (외부 의존성 없이 순수 Node.js로 구현)
- 디렉토리 구조 생성

### Step 2: stdin JSON 파서 구현 (`src/parsers/session.js`)
- stdin에서 전체 JSON 읽기
- model, context_window, rate_limits, current_usage 추출
- null/undefined 안전 처리

### Step 3: 비용 계산 모듈 구현 (`src/parsers/cost.js`)
- 모델별 단가 테이블 정의
- 토큰 수 x 단가 -> USD 계산 함수
- 모델 ID로 단가 자동 매핑
- 구독제 판별 로직: config.plan이 "api"가 아니면 토큰 비용 대신 "(Sub)" 반환
- 구독제 월 비용 매핑: plan -> subscriptionCost 테이블에서 조회

### Step 4: 통계 집계 모듈 구현 (`src/parsers/stats.js`)
- `~/.claude/stats-cache.json` 읽기
- 이번 달 날짜 범위 계산
- 범위 내 토큰 합산 -> 비용 변환 (API 사용자만)
- 구독 사용자는 월 구독료만 반환

### Step 5: 시스템 리소스 모듈 구현 (`src/parsers/system.js`)
- `os.cpus()`로 CPU 코어별 idle/total 시간 수집
- 이전 측정값과 비교하여 CPU 사용률 계산 (임시 파일 캐싱)
- 첫 실행 시 이전 값 없으면 순간 스냅샷 사용
- `os.totalmem()`, `os.freemem()`으로 메모리 사용률 계산

### Step 6: 포맷터 구현 (`src/formatters/statusline.js`)
- 각 섹션 문자열 생성
- OSC 8 이스케이프 시퀀스로 각 섹션을 클릭 가능 링크로 래핑
- 구분자로 연결
- 한 줄 출력

### Step 7: MCP 상세 정보 모듈 구현 (`src/formatters/mcp-detail.js`)
- `~/.claude/settings.json`에서 mcpServers 읽기
- 프로젝트 레벨 `.claude/settings.json`도 병합
- 서버 이름, 타입, command 정보를 간략하게 정리
- Ctrl+클릭 시 보여줄 정보 생성 (임시 파일 또는 URL 방식)

### Step 8: 메인 엔트리포인트 구현 (`src/index.js`)
- stdin 전체 읽기 -> JSON.parse
- 파서들 호출 (session, cost, stats, system)
- 포맷터 호출
- stdout 출력
- 에러 시 fallback 문자열 출력 (크래시 방지)

### Step 9: 설치 스크립트 (`install.js`)
- `~/.claude/settings.json` 읽기
- `statusLine` 키 존재 여부 확인
- 설정 삽입 또는 업데이트
- 백업 생성 후 저장

### Step 10: 설정 모듈 구현 (`src/config.js`)
- `config.json` 존재 시 로드, 없으면 기본값 사용
- plan 타입 (api/pro/max/max5x)
- 단가 오버라이드 병합
- `process.argv`에서 `--no-*` 플래그 파싱하여 표시 항목 토글 결정
- 플래그 없는 섹션은 기본 true (표시), `--no-xxx` 있으면 false (숨김)

### Step 11: 테스트 & 디버깅
- 샘플 stdin JSON으로 스크립트 직접 실행 테스트
- API 모드 / 구독 모드 각각 테스트
- CPU/MEM 표시 확인
- OSC 8 링크 클릭 동작 확인
- 실제 Claude Code 세션에서 동작 확인

---

## Known Constraints & Edge Cases

1. **갱신 타이밍**: statusLine은 매 Claude 턴(tool call/response)마다만 갱신됨. 사용자 입력 대기 중에는 갱신 안 됨.
2. **고정 2줄 출력**: 1줄 = Model + 5h/7d rate limit, 2줄 = TknCost 이하 나머지. `console.log`로 줄 단위 별도 호출해야 Claude Code 멀티라인 렌더링 동작. 각 줄 내에서 폭 초과 시 Claude Code가 자체 truncate 처리 (서브프로세스 stdout이 파이프라서 `process.stdout.columns`로 실제 터미널 폭 측정 불가).
3. **dimColor 렌더링**: 출력이 자동으로 dimmed 처리됨. ANSI 색상 코드는 무시될 수 있음.
4. **OSC 8 호환성**: Windows Terminal, VS Code 터미널에서는 OSC 8 지원. 일부 구형 터미널에서는 미지원 가능. 미지원 시 링크 없이 텍스트만 표시되므로 graceful degradation.
5. **stats-cache.json 포맷 변경**: Claude Code 업데이트 시 파일 구조 변경 가능성. 방어적 파싱 필요.
6. **rate_limits 필드**: v2.1.80+ 에서만 제공. 이전 버전에서는 null.
7. **MCP 서버 health check**: 설정 파일에서 서버 수만 확인 가능. 실제 연결 상태는 확인 불가.
8. **Windows 경로**: 경로 구분자 `/` vs `\` 혼용 주의. Node.js `path` 모듈 사용.
9. **스크립트 실행 시간**: statusLine 스크립트는 빠르게 끝나야 함. stats-cache.json 읽기가 병목이 될 수 있으므로 동기적으로 처리하되 파일이 없으면 즉시 스킵.

---

## Dependencies

**외부 의존성: 없음 (순수 Node.js)**

- `fs` -- 파일 읽기 (stats-cache.json, settings.json, config.json)
- `path` -- 경로 처리
- `os` -- 홈 디렉토리 경로 (`os.homedir()`)
- `process` -- stdin 읽기, stdout 출력

---

## Future Enhancements (Scope 외, 참고용)

- 별도 TUI 대시보드 (Approach B) 추가 가능
- MCP 서버로 확장하여 Claude가 cost 데이터를 쿼리할 수 있게 가능
- npm 패키지로 배포하여 `npx`로 설치 가능
- 주간/월간 cost 리포트 생성 기능
