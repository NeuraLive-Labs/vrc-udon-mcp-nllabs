# Claude — VRC Udon MCP

Follow **[AGENTS.md](./AGENTS.md)** for all UdonSharp / VRChat Udon work.

- Use the **vrchat-udon** MCP tools; do not invent APIs from general C#.
- Workflow: MCP first → template/example → `validate_code` → `explain_validation` → fix until clean.
- Same rules via MCP: resource `udon://workflow/code` or prompt `udon-code-workflow`.

`.cursor/rules/udon-mcp.mdc` is Cursor-only; Claude should use this file + AGENTS.md + MCP.
