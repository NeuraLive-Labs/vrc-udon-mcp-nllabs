# VRC Udon NLLabs

**NeuraLive Labs** · VRChat용 Udon MCP

VRChat UdonSharp 개발을 위해 [agent-skills-vrc-udon](https://github.com/niaka3dayo/agent-skills-vrc-udon) 저장소를 [Model Context Protocol (MCP)](https://modelcontextprotocol.io)로 노출하는 서버입니다.

**`agent-skills-vrc-udon` 저장소가 유일한 정보 원천(single source of truth)입니다.** 이 MCP는 문서를 하드코딩하지 않으며, 저장소 콘텐츠를 동적으로 인덱싱·검색·검증합니다.

[← 메인 페이지](../README.md) · [English](README.en.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md)

---

## 목차

- [기능](#기능)
- [요구 사항](#요구-사항)
- [설치](#설치)
- [설정](#설정)
- [저장소 동기화](#저장소-동기화)
- [사용법](#사용법)
- [MCP 연동](#mcp-연동)
- [MCP 도구 목록](#mcp-도구-목록)
- [MCP 리소스](#mcp-리소스)
- [아키텍처](#아키텍처)
- [스크립트](#스크립트)
- [크레딧](#크레딧)
- [라이선스](#라이선스)

---

## 기능

- 지식 저장소 기반 **18개의 MCP 도구**
- **동적 MCP 리소스** — skills, rules, cheatsheets, templates, SDK 매트릭스
- `skills/`, `rules/`, `references/`, `templates/`, `hooks/`, `assets/` 재귀 인덱싱
- MiniSearch 가중치 검색: 제목(heading) > 타이틀 > 본문
- 저장소 규칙(테이블 + hooks) 기반 코드 검증
- 파일 감시자로 인덱스 자동 재구축
- 원격 문서 저장소 git 동기화
- Strict TypeScript, Vitest, ESLint, Prettier

---

## 요구 사항

| 의존성 | 버전 |
|--------|------|
| **Node.js** | 22 이상 |
| **pnpm** | 9 이상 |
| **git** | 최신 버전 (문서 동기화용) |

---

## 설치

```bash
git clone https://github.com/NeuraLive-Labs/vrc-udon-mcp-nllabs.git
cd vrchat-udon-mcp
pnpm install
pnpm update-docs    # agent-skills-vrc-udon clone / 업데이트
pnpm build-index    # 검색 인덱스 구축
pnpm build
```

---

## 설정

프로젝트 루트의 `config.json`을 편집합니다:

```json
{
  "repository": {
    "url": "https://github.com/niaka3dayo/agent-skills-vrc-udon",
    "path": "./agent-skills-vrc-udon",
    "branch": "main"
  },
  "sdkVersion": "3.10.4",
  "language": "ko",
  "watch": true,
  "indexPath": "./data/indexes",
  "search": {
    "fuzzy": 0.2,
    "headingWeight": 3.0,
    "titleWeight": 2.5,
    "exampleWeight": 1.5,
    "ruleWeight": 2.0,
    "skillWeight": 2.5,
    "cheatsheetWeight": 2.5,
    "maxResults": 20
  }
}
```

| 필드 | 설명 |
|------|------|
| `repository.url` | 소스 저장소 URL |
| `repository.path` | 클론된 로컬 경로 |
| `repository.branch` | 동기화할 브랜치 |
| `sdkVersion` | 필터용 기본 SDK 버전 |
| `watch` | 파일 변경 시 인덱스 재구축 |
| `indexPath` | 영속 인덱스 디렉터리 |

환경 변수 `UDON_MCP_CONFIG`로 다른 설정 파일을 지정할 수 있습니다.

---

## 저장소 동기화

```bash
# agent-skills-vrc-udon clone/업데이트 후 인덱스 재구축
pnpm update-docs

# 인덱스만 재구축 (git pull 없음)
pnpm build-index
```

기본적으로 `./agent-skills-vrc-udon`에 클론됩니다. 새 파일은 코드 변경 없이 자동 인덱싱됩니다.

---

## 사용법

```bash
pnpm start      # MCP 서버 시작 (stdio)
pnpm dev        # 핫 리로드 개발 모드
pnpm test       # Vitest 테스트 실행
```

---

## MCP 연동

> **MCP 설정에 `C:\Users\사용자이름\...` 같은 절대 경로를 쓰지 마세요.**
> 이식성이 없고, 사용자명이 노출되며, 프로젝트 이동 시 깨집니다.
> 워크스페이스 상대 경로, GitHub `npx`, 전역 설치를 권장합니다.

MCP 연결 전 최소 한 번 실행하세요:

```bash
pnpm update-docs && pnpm build-index && pnpm build
```

### 옵션 A — 로컬 워크스페이스 (`docs/mcp-config.example.json`)

이 저장소를 개발할 때 권장. [mcp-config.example.json](mcp-config.example.json)을 IDE MCP 설정에 복사:

```json
{
  "mcpServers": {
    "vrchat-udon": {
      "command": "node",
      "args": ["${workspaceFolder}/dist/index.js"]
    }
  }
}
```

`"./dist/index.js"`도 가능합니다. Cursor는 워크스페이스 기준으로 경로를 해석합니다.

### 옵션 B — GitHub `npx` (수동 clone 불필요)

로컬 경로 불필요. `npx`가 저장소를 받아 `prepare`(TypeScript 컴파일) 후 바이너리 실행:

```json
{
  "mcpServers": {
    "vrchat-udon": {
      "command": "npx",
      "args": ["-y", "github:NeuraLive-Labs/vrc-udon-mcp-nllabs"]
    }
  }
}
```

pnpm: `pnpm dlx github:NeuraLive-Labs/vrc-udon-mcp-nllabs`

**참고:** 첫 실행은 컴파일로 시간이 걸릴 수 있습니다. 인덱싱된 문서는 별도로 필요합니다 — `npx`는 `agent-skills-vrc-udon`을 자동 clone하지 않습니다. 저장소를 clone했다면 `pnpm update-docs`를 실행하거나, 동기화된 `config.json`을 `UDON_MCP_CONFIG`로 지정하세요.

### 옵션 C — 전역 설치

```bash
git clone https://github.com/NeuraLive-Labs/vrc-udon-mcp-nllabs.git
cd vrchat-udon-mcp
pnpm install && pnpm update-docs && pnpm build-index && pnpm build
pnpm link --global
```

```json
{
  "mcpServers": {
    "vrchat-udon": {
      "command": "vrchat-udon-mcp"
    }
  }
}
```

전역 link 없이: 저장소 디렉터리에서 `"command": "pnpm", "args": ["exec", "vrchat-udon-mcp"]`

### 옵션 D — VRChat 프로젝트 git 서브모듈

```bash
git submodule add https://github.com/NeuraLive-Labs/vrc-udon-mcp-nllabs.git tools/vrchat-udon-mcp
cd tools/vrchat-udon-mcp && pnpm install && pnpm update-docs && pnpm build-index && pnpm build
```

```json
{
  "mcpServers": {
    "vrchat-udon": {
      "command": "node",
      "args": ["${workspaceFolder}/tools/vrchat-udon-mcp/dist/index.js"]
    }
  }
}
```

### 옵션 E — git 의존성

```bash
pnpm add github:NeuraLive-Labs/vrc-udon-mcp-nllabs
```

```json
{
  "mcpServers": {
    "vrchat-udon": {
      "command": "npx",
      "args": ["vrchat-udon-mcp"]
    }
  }
}
```

### Cursor

**Cursor Settings → MCP**에 위 옵션 중 하나를 붙여넣기. Windows 사용자명이 포함된 절대 경로는 피하세요.

### Claude Desktop

Windows: `%APPDATA%\Claude\claude_desktop_config.json`  
macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

운영 환경은 옵션 B·C·E, 로컬 개발은 옵션 A.

### ChatGPT Desktop

위 옵션 중 하나로 stdio MCP 서버 설정 (Windows 사용자명 절대 경로 비권장).

---

## MCP 도구 목록

| 도구 | 설명 |
|------|------|
| `search_documentation` | 전체 문서 키워드/퍼지 검색 |
| `explain_topic` | 경로·제목·줄 번호 인용 설명 |
| `list_skills` | skill 자동 탐색 |
| `read_skill` | SKILL.md (메타데이터, rules, references, templates) |
| `list_rules` | UdonSharp 규칙 목록 |
| `read_rule` | 제약·예제가 포함된 규칙 읽기 |
| `search_reference` | `references/` 검색 |
| `list_templates` | `.cs` 템플릿 목록 |
| `get_template` | 전체 소스가 포함된 템플릿 조회 |
| `validate_code` | 저장소 규칙 기반 코드 검증 |
| `explain_validation` | 실패 원인을 소스 규칙과 함께 설명 |
| `sdk_matrix` | `templates/AGENTS.md` SDK 버전 매트릭스 |
| `search_sdk_feature` | 기능 검색 (NetworkCallable, PlayerData 등) |
| `search_constraints` | 제약 검색 (List, Coroutine 등) |
| `search_networking` | 네트워킹·동기화 주제 |
| `search_examples` | 코드 예제 검색 |
| `search_best_practice` | 권장 패턴 |
| `search_antipattern` | 피해야 할 안티패턴 |

---

## MCP 리소스

| URI | 내용 |
|-----|------|
| `udon://skills/{id}` | 각 skill의 SKILL.md |
| `udon://rules/{id}` | 규칙 파일 |
| `udon://sdk/matrix` | SDK 버전 매트릭스 |
| `udon://templates/index` | 템플릿 인덱스 |
| `udon://cheatsheet/{id}` | skill별 CHEATSHEET.md |

---

## 아키텍처

```
agent-skills-vrc-udon/     ← 정보 원천 (git clone)
        ↓
KnowledgeParser            ← 모든 파일 재귀 인덱싱
        ↓
DocsRepository             ← data/indexes/에 인덱스 영속화
        ↓
SearchEngine (MiniSearch)  ← 가중치 검색
RuleParser                 ← hooks/ 및 rules/ 테이블에서 규칙 파싱
        ↓
MCP Tools (18)             ← AI 에이전트 인터페이스
```

---

## 스크립트

| 스크립트 | 설명 |
|----------|------|
| `pnpm build` | TypeScript 컴파일 |
| `pnpm start` | MCP 서버 시작 |
| `pnpm test` | Vitest 테스트 |
| `pnpm update-docs` | 소스 저장소 git clone / pull |
| `pnpm build-index` | 검색 인덱스 재구축 |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier |

---

## 크레딧

- 문서 및 skills: [niaka3dayo/agent-skills-vrc-udon](https://github.com/niaka3dayo/agent-skills-vrc-udon)
- MCP 서버: [NeuraLive-Labs/vrc-udon-mcp-nllabs](https://github.com/NeuraLive-Labs/vrc-udon-mcp-nllabs)

---

## 라이선스

MIT
