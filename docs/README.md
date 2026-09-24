# Documentation index

Full guides for **VRC Udon NLLabs** (`vrc-udon-mcp-nllabs` / `vrchat-udon-mcp`) in five languages:

| Language | File |
|----------|------|
| English | [README.en.md](README.en.md) |
| Español | [README.es.md](README.es.md) |
| Français | [README.fr.md](README.fr.md) |
| Japanese | [README.ja.md](README.ja.md) |
| Korean | [README.ko.md](README.ko.md) |

## Additional files

| File | Purpose |
|------|---------|
| [mcp-config.example.json](mcp-config.example.json) | Minimal MCP server config for local development |

## Updating the knowledge base

The MCP reads documentation from a cloned copy of [agent-skills-vrc-udon](https://github.com/niaka3dayo/agent-skills-vrc-udon). From the project root:

```bash
pnpm update-docs    # git clone / pull
pnpm build-index    # rebuild search index
```

The clone lands in `./agent-skills-vrc-udon` by default (configurable in `config.json`).
