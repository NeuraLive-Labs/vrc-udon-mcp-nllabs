# VRC Udon NLLabs

**NeuraLive Labs** · Udon MCP for VRChat

[![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)](https://github.com/NeuraLive-Labs/vrc-udon-mcp-nllabs/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-green.svg)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-purple.svg)](https://modelcontextprotocol.io)

MCP server for VRChat UdonSharp development — exposes the [agent-skills-vrc-udon](https://github.com/niaka3dayo/agent-skills-vrc-udon) knowledge base to AI assistants via the [Model Context Protocol](https://modelcontextprotocol.io).

---

## Documentation

| Language | README | Description |
|----------|--------|-------------|
| **English** | [docs/README.en.md](docs/README.en.md) | Full guide — installation, MCP setup, tools |
| **Español** | [docs/README.es.md](docs/README.es.md) | Guía completa en español |
| **Français** | [docs/README.fr.md](docs/README.fr.md) | Guide complet en français |
| **Japanese** | [docs/README.ja.md](docs/README.ja.md) | Full guide in Japanese |
| **Korean** | [docs/README.ko.md](docs/README.ko.md) | Full guide in Korean |

---

## What is this?

`vrc-udon-mcp-nllabs` (`vrchat-udon-mcp`) is a **stdio MCP server** that indexes, searches, and validates UdonSharp documentation from the `agent-skills-vrc-udon` repository at runtime. No hardcoded docs — the remote repo is the single source of truth.

| | |
|---|---|
| **18 MCP tools** | Search, explain, validate, templates, SDK matrix |
| **Dynamic resources** | Skills, rules, cheatsheets, templates |
| **Live indexing** | MiniSearch with weighted ranking + file watcher |
| **IDE support** | Cursor, Claude Desktop, ChatGPT Desktop |

---

## Quick start

**Install into Cursor MCP config** (portable `npx` entry, merge-safe):

```bash
npx -y github:NeuraLive-Labs/vrc-udon-mcp-nllabs -- install
```

Then **Refresh MCP** in Cursor. Optional: add `--claude` for Claude Desktop.

**Develop from source:**

```bash
git clone https://github.com/NeuraLive-Labs/vrc-udon-mcp-nllabs.git
cd vrchat-udon-mcp
pnpm install
pnpm update-docs && pnpm build-index && pnpm build
pnpm start
```

See [docs/mcp-config.example.json](docs/mcp-config.example.json) and the language READMEs for workspace, `npx`, global install, submodule, and git dependency options.

---

## Table of contents

- [Documentation](#documentation)
- [What is this?](#what-is-this)
- [Quick start](#quick-start)
- [Screenshots](#screenshots)
- [Contributing](CONTRIBUTING.md)
- [License](#license)

---

## Screenshots

> Placeholder — add screenshots of MCP tools in Cursor, search results, or validation output here.

| MCP connected in Cursor | `search_documentation` results |
|-------------------------|--------------------------------|
| _Screenshot pending_    | _Screenshot pending_           |

---

## License

[MIT](LICENSE) — Documentation and skills by [niaka3dayo/agent-skills-vrc-udon](https://github.com/niaka3dayo/agent-skills-vrc-udon). MCP server by [NeuraLive Labs](https://github.com/NeuraLive-Labs) / [MauDevVR](https://github.com/MauDevVR).
