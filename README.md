# Claude Code StatusLine Add-on

Claude Code CLI 하단에 모델 정보, 비용, 사용량 제한, 시스템 리소스 등을 실시간으로 표시하는 StatusLine Add-on.

Claude Code v2.1.6+의 네이티브 `statusLine` 기능을 활용하며, 순수 Node.js로 구현되어 외부 의존성이 없습니다. Windows, WSL, Native Linux, macOS 모두 지원합니다.

```
Model : Opus4.6 | 5h[████████████        ] 62%(14:30) | 7d[██████              ] 30%(4/14 12:00)
TknCost : (Sub) | MonCost : $20(Pro) | CacheHit% : 38% | CtxWindow% : 45% | MEM : 83% | CPU : 11% | MCP:3
```

고정 2줄 포맷 — 1줄에는 Model + Rate Limit 바, 2줄에는 나머지 섹션. 각 섹션은 서로 다른 ANSI 256-color 팔레트로 색상이 부여됩니다.

## Features

| 섹션 | 설명 | 데이터 소스 |
|------|------|-------------|
| **Model** | 현재 사용 중인 모델 이름 | stdin JSON |
| **5h / 7d Rate Limit** | 5시간/7일 사용량 프로그레스 바 + 리셋 시각 | stdin JSON `rate_limits` |
| **TknCost** | 현재 세션 실시간 토큰 비용 (API) 또는 `(Sub)` (구독제) | stdin JSON + 모델별 단가 |
| **MonCost** | 이번 달 누적 비용 (API) 또는 플랜 구독료 (구독제) | `~/.claude/stats-cache.json` |
| **CacheHit%** | 캐시 히트 비율 | stdin JSON `current_usage` |
| **CtxWindow%** | 컨텍스트 윈도우 사용률 | stdin JSON `context_window` |
| **CPU / MEM** | 시스템 CPU, 메모리 사용률 | Node.js `os` 모듈 |
| **MCP** | 설정된 MCP 서버 수 | `~/.claude/settings.json` |

### Rate Limit 표시

- **바 그래프**: 20칸 tqdm 스타일 (`█` 사용량, 공백 = 여유)
- **리셋 시각**: 5h는 `HH:MM`, 7d는 `M/DD HH:MM` (로컬 타임존 기준)
- `resets_at` 필드는 Unix epoch seconds로 전송되며 내부에서 자동 변환됨

### 구독제 자동감지

`rate_limits` 필드가 stdin JSON에 존재하면 자동으로 구독제로 판별합니다. 수동으로 지정하려면 `config.json`의 `plan` 필드를 설정하세요.

### Section Colors

각 섹션은 ANSI 256-color 팔레트(`\x1b[38;5;Nm`)의 deep muted 톤으로 색상이 부여되어 가독성을 높입니다.

| 섹션 | Index | 색상 |
|------|-------|------|
| Model | 73 | Deep Cyan-Teal |
| 5h Rate Limit | 71 | Deep Muted Green |
| 7d Rate Limit | 107 | Deep Lime |
| TknCost | 173 | Deep Peach |
| MonCost | 179 | Deep Gold |
| CacheHit% | 67 | Deep Steel Blue |
| CtxWindow% | 103 | Deep Lavender |
| MEM | 138 | Deep Rose |
| CPU | 97 | Deep Mauve |
| MCP | 72 | Deep Teal |

## Requirements

- **Node.js** >= 18.0.0
- **Claude Code** >= v2.1.6 (statusLine 기능 지원)
- **ANSI 256-color 지원 터미널**
  - Windows: Windows Terminal, VS Code 터미널, PowerShell 7+, Git Bash
  - WSL (Ubuntu/Debian on Windows): 기본 bash/zsh 터미널, Windows Terminal WSL 탭
  - Native Linux: GNOME Terminal, Konsole, Alacritty, kitty, xterm 등 대부분의 최신 터미널

## Supported Platforms

| Platform | 동작 여부 | 비고 |
|----------|-----------|------|
| Windows 10/11 | 지원 | Windows Terminal / VS Code 권장 |
| WSL (WSL2 포함) | 지원 | Claude Code를 WSL 내부에서 실행 시 WSL 홈(`~/.claude`)을 사용 |
| Native Linux (Ubuntu, Debian, Fedora, Arch 등) | 지원 | Node.js 18+ 패키지 매니저로 설치 |
| macOS | 지원 | 별도 설정 없이 동작 |

모든 플랫폼에서 동일한 코드가 동작합니다. Node.js의 `os`, `path` 모듈이 각 OS에 맞는 경로·리소스를 자동 처리합니다.

## Installation

### 1. 저장소 클론

```bash
git clone https://github.com/55002ghals/Window-Claude-Code-Statusline.git
cd Window-Claude-Code-Statusline
```

> **WSL / Native Linux 사용자**: Claude Code를 WSL 내부(또는 Linux)에서 실행한다면, 클론도 동일한 환경에서 수행하세요. Windows 경로(`C:\...`)가 아닌 Linux 경로(`/home/<user>/...` 또는 `/mnt/c/...`)에서 설치해야 `~/.claude/settings.json`이 올바른 홈 디렉토리를 가리킵니다.

### 2. 자동 설치 (권장)

```bash
node install.js
```

`~/.claude/settings.json`에 `statusLine` 설정이 자동으로 추가됩니다. 기존 settings.json은 백업됩니다. Windows/WSL/Linux/macOS 모두 동일한 명령으로 설치됩니다.

### 3. 수동 설치

`~/.claude/settings.json`에 직접 추가:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node /path/to/Window-Claude-Code-Statusline/src/index.js"
  }
}
```

### 4. 설정 후

새 Claude Code 세션을 열면 CLI 하단에 StatusLine이 표시됩니다.

### WSL 빠른 설치 (Ubuntu/Debian 기준)

WSL 내부에서 Claude Code를 실행하는 경우 아래 절차를 그대로 따르면 됩니다. **Windows 드라이브(`/mnt/c`)가 아니라 WSL의 Linux 홈(`~`)에서 클론**하세요. `/mnt/c` 아래는 입출력이 느리고 파일 권한 문제가 생길 수 있습니다.

```bash
# 1) Node.js 18+ 설치 (이미 있으면 생략)
# NodeSource 저장소 사용 예시:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version   # v20.x 확인

# 2) Claude Code가 WSL에 없다면 설치
npm install -g @anthropic-ai/claude-code
claude --version # v2.1.6 이상 확인

# 3) 저장소 클론 (WSL 홈 디렉토리에)
cd ~
git clone https://github.com/55002ghals/Window-Claude-Code-Statusline.git
cd Window-Claude-Code-Statusline

# 4) 자동 설치 — ~/.claude/settings.json 에 statusLine 항목을 추가
node install.js

# 5) Claude Code 재시작
# 실행 중인 세션을 종료한 뒤 다시 `claude` 를 실행하면 하단에 StatusLine이 나타납니다.
```

설치 후 `~/.claude/settings.json` 에 다음과 비슷한 항목이 추가되었는지 확인:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node /home/<your-user>/Window-Claude-Code-Statusline/src/index.js"
  }
}
```

> **주의**: Windows 쪽에 설치된 Claude Code와 WSL 쪽에 설치된 Claude Code는 서로 다른 홈 디렉토리(`C:\Users\<user>\.claude` vs `/home/<user>/.claude`)를 사용합니다. 실제로 사용하는 쪽에서 `node install.js`를 실행해야 합니다. 둘 다 사용한다면 각 환경에서 한 번씩 클론·설치하세요.

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
Window-Claude-Code-Statusline/
+-- package.json
+-- install.js                # settings.json 자동 설정
+-- config.example.json       # 설정 파일 템플릿
+-- src/
    +-- index.js              # 메인 엔트리포인트
    +-- config.js             # 설정 로드 + CLI 플래그 파싱
    +-- parsers/
    |   +-- session.js        # stdin JSON 파싱 (rate_limits resets_at epoch→ms 변환 포함)
    |   +-- cost.js           # 토큰 비용 계산
    |   +-- stats.js          # 월별 비용 집계
    |   +-- system.js         # CPU/MEM 측정
    +-- formatters/
        +-- statusline.js     # 포맷팅 + ANSI 256-color 색상
        +-- mcp-detail.js     # MCP 서버 수 카운트
```

## Troubleshooting

### 텍스트가 밀리거나 깨져 보일 때

Claude Code 공식 문서는 멀티라인 + escape sequence 조합이 렌더링 글리치를 일으킬 수 있다고 경고합니다. 본 애드온은 이 문제를 피하기 위해:

- OSC 8 하이퍼링크는 사용하지 않음 (Ctrl+클릭 링크 기능 없음)
- 순수 ANSI 색상만 사용
- 고정 2줄 출력

그럼에도 렌더링 문제가 발생하면 `src/formatters/statusline.js`의 `COLORS` 상수를 빈 값으로 바꾸거나 `color()` 헬퍼를 패스스루로 변경하여 색상을 비활성화할 수 있습니다.

### Rate Limit이 `--(--)`로만 표시될 때

- Claude Code v2.1.80 미만에서는 `rate_limits` 필드를 제공하지 않습니다. 버전을 업데이트하세요.
- API 플랜 사용자는 구독 rate limit이 없으므로 표시되지 않습니다.

## License

MIT
