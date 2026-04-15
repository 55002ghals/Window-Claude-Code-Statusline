# Claude Code StatusLine Add-on

Claude Code CLI 하단에 모델 정보, 비용, 사용량 제한, 시스템 리소스 등을 실시간으로 표시하는 StatusLine Add-on.

Claude Code v2.1.6+의 네이티브 `statusLine` 기능을 활용하며, 순수 Node.js로 구현되어 외부 의존성이 없습니다. Windows, WSL, Native Linux, macOS 모두 지원합니다.

```
Model : Opus4.6 | 📁 proj_msClaudeCodeAddon | 🌿 main | 5h[████████████        ] 62%(14:30) | 7d[██████              ] 30%(4/14 12:00)
TknCost : (Sub) | MonCost : $20(Pro) | CacheHit% : 38% | CtxWindow[█████     ] 45% | dur: 03:09:45 | MEM : 83% | CPU : 11% | MCP:2
```

고정 2줄 포맷 — 1줄에는 Model/디렉토리/브랜치/Rate Limit 바, 2줄에는 비용·사용량·시스템 섹션.

## Features

| 섹션 | 설명 |
|------|------|
| **Model** | 현재 사용 중인 모델 이름 |
| **📁 Directory** | 현재 워크스페이스 디렉토리의 basename |
| **🌿 Branch** | 현재 git 브랜치 (분리 HEAD면 short SHA) |
| **5h / 7d Rate Limit** | 5시간/7일 사용량 프로그레스 바 + 리셋 시각 |
| **TknCost** | 현재 세션 실시간 토큰 비용 (API) 또는 `(Sub)` (구독제) |
| **MonCost** | 이번 달 누적 비용 (API) 또는 플랜 구독료 (구독제) |
| **CacheHit%** | 캐시 히트 비율 |
| **CtxWindow** | 컨텍스트 윈도우 10칸 바 + 사용률 (< 70% 녹색 / 70–89% 노랑 / ≥ 90% 빨강) |
| **dur** | 현재 세션 경과 시간 (`HH:MM:SS`) |
| **CPU / MEM** | 시스템 CPU, 메모리 사용률 |
| **MCP** | 설정된 MCP 서버 수 (user / local / project / claude.ai 관리형 통합 포함) |

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

프로젝트 루트에 `config.json`을 생성하여 플랜·단가·구분자 등을 커스터마이징할 수 있습니다. 템플릿은 `config.example.json`을 참고하세요.

```bash
cp config.example.json config.json
```

### 표시 항목 on/off (CLI Flags)

`settings.json`의 command에 플래그를 추가하여 개별 섹션을 숨길 수 있습니다.

| 플래그 | 효과 |
|--------|------|
| `--no-model` | 모델 정보 숨김 |
| `--no-dir` | 현재 디렉토리 숨김 |
| `--no-branch` | git 브랜치 숨김 |
| `--no-context` | 컨텍스트 윈도우(바 포함) 숨김 |
| `--no-tkncost` | 실시간 토큰 비용 숨김 |
| `--no-moncost` | 월별 비용 숨김 |
| `--no-cache` | 캐시 히트율 숨김 |
| `--no-limits` | Rate limit 바 숨김 |
| `--no-duration` | 세션 경과 시간 숨김 |
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

## Troubleshooting

### 텍스트가 밀리거나 깨져 보일 때

Claude Code 공식 문서는 멀티라인 + escape sequence 조합이 렌더링 글리치를 일으킬 수 있다고 경고합니다. 본 애드온은 이 문제를 피하기 위해:

- OSC 8 하이퍼링크는 사용하지 않음 (Ctrl+클릭 링크 기능 없음)
- 순수 ANSI 색상만 사용
- 고정 2줄 출력

### Rate Limit이 `--(--)`로만 표시될 때

- Claude Code v2.1.80 미만에서는 `rate_limits` 필드를 제공하지 않습니다. 버전을 업데이트하세요.
- API 플랜 사용자는 구독 rate limit이 없으므로 표시되지 않습니다.

## License

MIT
