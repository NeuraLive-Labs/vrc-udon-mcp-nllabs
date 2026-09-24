# VRC Udon NLLabs

**NeuraLive Labs** · Udon MCP for VRChat

[Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that exposes the [agent-skills-vrc-udon](https://github.com/niaka3dayo/agent-skills-vrc-udon) repository as an MCP interface for UdonSharp development in VRChat.

**The `agent-skills-vrc-udon` repository is the single source of truth.** This MCP does not ship hardcoded documentation — it indexes, searches, and validates content from that repo dynamically.

[← Back to landing page](../README.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

---

## Table of contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Repository sync](#repository-sync)
- [Usage](#usage)
- [MCP integration](#mcp-integration)
- [MCP tools](#mcp-tools)
- [Agent workflow for accurate Udon code](#agent-workflow-for-accurate-udon-code)
- [MCP resources](#mcp-resources)
- [Architecture](#architecture)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [Credits](#credits)
- [License](#license)

---

## Features

- **18 MCP tools** driven entirely by the knowledge repository
- **Dynamic MCP resources** — skills, rules, cheatsheets, templates, SDK matrix
- Recursive indexing of `skills/`, `rules/`, `references/`, `templates/`, `hooks/`, `assets/`
- MiniSearch with weighted ranking: heading > title > body
- Code validation from repository rules (tables + hooks)
- File watcher with automatic index rebuild
- Git sync of the remote documentation repository
- Strict TypeScript, Vitest, ESLint, Prettier

---

## Requirements

| Dependency | Version |
|------------|---------|
| **Node.js** | 22+ |
| **pnpm** | 9+ |
| **git** | any recent version (for doc sync) |

---

## Installation

```bash
git clone https://github.com/NeuraLive-Labs/vrc-udon-mcp-nllabs.git
cd vrchat-udon-mcp
pnpm install
pnpm update-docs    # Clone / update agent-skills-vrc-udon
pnpm build-index    # Build the search index
pnpm build
```

---

## Configuration

Edit `config.json` at the project root:

```json
{
  "repository": {
    "url": "https://github.com/niaka3dayo/agent-skills-vrc-udon",
    "path": "./agent-skills-vrc-udon",
    "branch": "main"
  },
  "sdkVersion": "3.10.4",
  "language": "en",
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

| Field | Description |
|-------|-------------|
| `repository.url` | Source repository URL |
| `repository.path` | Local path to the cloned repo |
| `repository.branch` | Branch to sync |
| `sdkVersion` | Default SDK version for filters |
| `watch` | Rebuild index when repo files change |
| `indexPath` | Persisted index directory |

You can also point to another config file with the `UDON_MCP_CONFIG` environment variable.

---

## Repository sync

On **every MCP start** (Cursor/`npx` or `pnpm start`) the server syncs `agent-skills-vrc-udon` automatically: clone if missing, otherwise `git fetch --depth 1` + reset. Fetch uses a short timeout (~30 s); on failure (slow/offline network) the MCP continues with existing local docs and logs the error to stderr. There is no throttle — an update is attempted every start.

```bash
# Clone or update agent-skills-vrc-udon and rebuild index (manual)
pnpm update-docs

# Rebuild index only (no git pull)
pnpm build-index
```

The repo is cloned to `./agent-skills-vrc-udon` by default. After a successful sync the search index is rebuilt. `pnpm update-docs` remains useful for local development when you want a refresh outside the startup cycle.

---

## Usage

```bash
pnpm start      # Start MCP server (stdio)
pnpm dev        # Development mode with reload
pnpm test       # Run Vitest tests
```

---

## MCP integration

### One-liner install (Cursor)

[![Add to Cursor](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=vrchat-udon&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsImdpdGh1YjpOZXVyYUxpdmUtTGFicy92cmMtdWRvbi1tY3AtbmxsYWJzIl19)

One-click install opens Cursor and adds the portable `npx` entry. Or write it into `~/.cursor/mcp.json` (or `%USERPROFILE%\.cursor\mcp.json` on Windows) without removing other servers:

```bash
npx -y github:NeuraLive-Labs/vrc-udon-mcp-nllabs -- install
```

Optional: also Claude Desktop with `--claude`. Then **Refresh MCP** in Cursor (CLI install only).

> **Do not use absolute paths** like `C:\Users\your-name\...` in MCP config.
> They are not portable, expose your username, and break when you move the project.
> Prefer workspace-relative paths, `npx` from GitHub, or a global install.

Before connecting the MCP, run at least once:

```bash
pnpm update-docs && pnpm build-index && pnpm build
```

### Option A — Local workspace (`docs/mcp-config.example.json`)

Recommended when developing this repo. Copy [mcp-config.example.json](mcp-config.example.json) into your IDE MCP settings:

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

`"./dist/index.js"` also works — Cursor resolves paths relative to the workspace.

### Option B — `npx` from GitHub (no manual clone)

No local paths required. `npx` downloads the repo, runs `prepare` (compiles TypeScript), and launches the binary:

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

With pnpm: `pnpm dlx github:NeuraLive-Labs/vrc-udon-mcp-nllabs`.

**Note:** First run compiles the project and may take a while. On every start the server automatically clones or updates `agent-skills-vrc-udon` next to the packaged `config.json` (npx cache) and rebuilds the search index when sync succeeds. If pull fails, it keeps the existing local copy. No `UDON_MCP_CONFIG` or personal paths required.

### Option C — Global install

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

Without global link: `"command": "pnpm", "args": ["exec", "vrchat-udon-mcp"]` from the repo directory.

### Option D — Git submodule in your VRChat project

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

### Option E — Git dependency

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

**Cursor Settings → MCP** — paste any option above. Avoid absolute Windows user paths.

### Claude Desktop

Windows: `%APPDATA%\Claude\claude_desktop_config.json`  
macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

Use options B, C, or E for production; option A for local repo development.

### ChatGPT Desktop

Configure a stdio MCP server with any option above (avoid absolute paths with your Windows username).

---

## MCP tools

| Tool | Description |
|------|-------------|
| `search_documentation` | Keyword / fuzzy search across all documentation |
| `explain_topic` | Explanation with citations (path, heading, line numbers) |
| `list_skills` | Auto-discover all skills |
| `read_skill` | Read SKILL.md with metadata, rules, references, templates |
| `list_rules` | List UdonSharp rules |
| `read_rule` | Read a rule with constraints and examples |
| `search_reference` | Search in `references/` |
| `list_templates` | List `.cs` templates |
| `get_template` | Fetch a template with full source code |
| `validate_code` | Validate code against repository rules |
| `explain_validation` | Explain a failure citing the source rule |
| `sdk_matrix` | SDK version matrix from `templates/AGENTS.md` |
| `search_sdk_feature` | Search features (NetworkCallable, PlayerData, etc.) |
| `search_constraints` | Search constraints (List, Coroutine, etc.) |
| `search_networking` | Networking and sync topics |
| `search_examples` | Search code examples |
| `search_best_practice` | Recommended patterns |
| `search_antipattern` | Anti-patterns to avoid |

---

## Agent workflow for accurate Udon code

Works with **Cursor, Claude, Codex, ChatGPT** — not Cursor-only. Mandatory flow: **template → validate → fix**.

1. Before coding: `search_constraints` / `search_antipattern`, then `get_template` or `search_examples` as the base
2. Adapt (do not invent networking patterns)
3. `validate_code` → `explain_validation` per `ruleId` → fix → re-validate

| Entry | Role |
|-------|------|
| [`AGENTS.md`](../AGENTS.md) | Canonical for Codex / file-based agents |
| [`CLAUDE.md`](../CLAUDE.md) | Claude Code / Desktop |
| `udon://workflow/code` | MCP SSOT for any client |
| Prompt `udon-code-workflow` | Same workflow via MCP prompts |
| [`.cursor/rules/udon-mcp.mdc`](../.cursor/rules/udon-mcp.mdc) | Cursor-only bonus (mirrors AGENTS.md) |

---

## MCP resources

| URI | Content |
|-----|---------|
| `udon://workflow/code` | SSOT template→validate→fix workflow (aligned with AGENTS.md) |
| `udon://skills/{id}` | SKILL.md for each skill |
| `udon://rules/{id}` | Rule files |
| `udon://sdk/matrix` | SDK version matrix |
| `udon://templates/index` | Template index |
| `udon://cheatsheet/{id}` | CHEATSHEET.md per skill |

---

## Architecture

```
agent-skills-vrc-udon/     ← Source of truth (git clone)
        ↓
KnowledgeParser            ← Recursively indexes all files
        ↓
DocsRepository             ← Persists index in data/indexes/
        ↓
SearchEngine (MiniSearch)  ← Weighted search ranking
RuleParser                 ← Rules from hooks/ and rules/ tables
        ↓
MCP Tools (18)             ← AI agent interface
```

---

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm build` | Compile TypeScript |
| `pnpm start` | Start MCP server |
| `pnpm test` | Vitest tests |
| `pnpm update-docs` | git clone / pull source repo |
| `pnpm build-index` | Rebuild search index |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier |

---

## Contributing

Forks and contributions are welcome. See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

---

## Credits

- Documentation and skills: [niaka3dayo/agent-skills-vrc-udon](https://github.com/niaka3dayo/agent-skills-vrc-udon)
- MCP server: [NeuraLive-Labs/vrc-udon-mcp-nllabs](https://github.com/NeuraLive-Labs/vrc-udon-mcp-nllabs)

---

## License

MIT
