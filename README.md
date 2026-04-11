# Claude Code StatusLine Add-on

Claude Code CLI 하단에 모델 정보, 비용, 사용량 제한, 시스템 리소스 등을 실시간으로 표시하는 StatusLine Add-on.

Claude Code v2.1.6+의 네이티브 `statusLine` 기능을 활용하며, 순수 Node.js로 구현되어 외부 의존성이 없습니다.

```
Model : Opus4.6 | 5h[████████████        ] 62%(3h12m) | 7d[██████              ] 30%(4d2h)
  TknCost : (Sub) | MonCost : $20(Pro) | CacheHit% : 38% | CtxWindow% : 45%
  MEM : 83% | CPU : 11% | MCP:3
```

## Features

| 섹션 | 설명 | 데이터 소스 |
|------|------|-------------|
| **Model** | 현재 사용 중인 모델 이름 | stdin JSON |
| **5h / 7d Rate Limit** | 5시간/7일 사용량 tqdm 스타일 프로그레스 바 + 리셋 카운트다운 | stdin JSON `rate_limits` |
| **TknCost** | 현재 세션 실시간 토큰 비용 (API) 또는 `(Sub)` (구독제) | stdin JSON + 모델별 단가 |
| **MonCost** | 이번 달 누적 비용 (API) 또는 플랜 구독료 (구독제) | `~/.claude/stats-cache.json` |
| **CacheHit%** | 캐시 히트 비율 | stdin JSON `current_usage` |
| **CtxWindow%** | 컨텍스트 윈도우 사용률 | stdin JSON `context_window` |
| **CPU / MEM** | 시스템 CPU, 메모리 사용률 | Node.js `os` 모듈 |
| **MCP** | 설정된 MCP 서버 수 (Ctrl+클릭 시 서버 목록 표시) | `~/.claude/settings.json` |

각 섹션은 OSC 8 클릭 가능 링크로 감싸져 있어, Ctrl+클릭으로 관련 문서 페이지를 열 수 있습니다.

### 구독제 자동감지

`rate_limits` 필드가 stdin JSON에 존재하면 자동으로 구독제로 판별합니다. 수동으로 지정하려면 `config.json`의 `plan` 필드를 설정하세요.

## Requirements

- **Node.js** >= 18.0.0
- **Claude Code** >= v2.1.6 (statusLine 기능 지원)
- **Windows Terminal** 또는 **VS Code 터미널** 권장 (OSC 8 링크 지원)

## Installation

### 1. 저장소 클론

```bash
git clone https://github.com/your-username/claude-code-statusline.git
cd claude-code-statusline
```

### 2. 자동 설치 (권장)

```bash
node install.js
```

`~/.claude/settings.json`에 `statusLine` 설정이 자동으로 추가됩니다. 기존 settings.json은 백업됩니다.

### 3. 수동 설치

`~/.claude/settings.json`에 직접 추가:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node /path/to/claude-code-statusline/src/index.js"
  }
}
```

### 4. 설정 후

새 Claude Code 세션을 열면 CLI 하단에 StatusLine이 표시됩니다.

## Configuration

### 기본 설정 (config.json)

프로젝트 루트에 `config.json`을 생성하여 설정을 커스터마이징할 수 있습니다. `config.example.json`을 참고하세요.

```bash
cp config.example.json config.json
```

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

| 키 | 설명 | 기본값 |
|----|------|--------|
| `plan` | `"auto"` (자동감지), `"api"`, `"pro"`, `"max"`, `"max5x"` | `"auto"` |
| `pricing` | 모델별 토큰 단가 오버라이드 (per 1M tokens) | 내장 테이블 |
| `subscriptionCost` | 구독 플랜별 월 비용 | `{ pro: 20, max: 100, max5x: 200 }` |
| `separator` | 섹션 구분자 | `" \| "` |

### 표시 항목 on/off (CLI Flags)

`settings.json`의 command에 플래그를 추가하여 개별 섹션을 숨길 수 있습니다.

| 플래그 | 효과 |
|--------|------|
| `--no-model` | 모델 정보 숨김 |
| `--no-context` | 컨텍스트 윈도우 숨김 |
| `--no-tkncost` | 실시간 토큰 비용 숨김 |
| `--no-moncost` | 월별 비용 숨김 |
| `--no-cache` | 캐시 히트율 숨김 |
| `--no-limits` | Rate limit 바 숨김 |
| `--no-cpu` | CPU 사용률 숨김 |
| `--no-mem` | 메모리 사용률 숨김 |
| `--no-mcp` | MCP 서버 수 숨김 |

**예시: CPU와 MEM 숨기기**

```json
{
  "statusLine": {
    "type": "command",
    "command": "node /path/to/src/index.js --no-cpu --no-mem"
  }
}
```

### /statusline 자연어 연동

Claude Code 세션 내에서 `/statusline` 명령으로 자연어로 설정을 변경할 수 있습니다.

```
/statusline hide CPU and memory
/statusline show everything
/statusline only show model and cost
```

## File Structure

```
claude-code-statusline/
+-- package.json
+-- install.js                # settings.json 자동 설정
+-- config.example.json       # 설정 파일 템플릿
+-- src/
    +-- index.js              # 메인 엔트리포인트
    +-- config.js             # 설정 로드 + CLI 플래그 파싱
    +-- parsers/
    |   +-- session.js        # stdin JSON 파싱
    |   +-- cost.js           # 토큰 비용 계산
    |   +-- stats.js          # 월별 비용 집계
    |   +-- system.js         # CPU/MEM 측정
    +-- formatters/
        +-- statusline.js     # 포맷팅 + OSC 8 링크
        +-- mcp-detail.js     # MCP 서버 정보
```

## License

MIT
