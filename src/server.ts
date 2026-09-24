import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { ServiceContainer } from './services/container.js';
import { registerTools } from './tools/register.js';

/**
 * Creates and configures the VRChat Udon MCP server.
 */
export function createServer(container: ServiceContainer): McpServer {
  const server = new McpServer({
    name: 'vrchat-udon-mcp',
    version: '2.0.0',
  });

  registerTools(server, container);
  registerResources(server, container);
  registerPrompts(server);

  return server;
}

/**
 * SSOT summary for any MCP client (Cursor, Claude, ChatGPT, Codex via MCP).
 * Keep aligned with repo-root AGENTS.md (canonical for file-based agents).
 */
export const CODE_WORKFLOW_MARKDOWN = `# UdonSharp accurate code workflow

Use the **vrchat-udon** MCP before writing UdonSharp. Do not invent APIs or networking from general C#.

## Required workflow (template → validate → fix)

1. **Consult MCP before writing**
   - \`search_constraints\` / \`search_antipattern\` — before unfamiliar C# features
   - \`search_networking\` — before sync, ownership, or RPC
   - \`list_templates\` → \`get_template\` **or** \`search_examples\` — use as the **base**, then adapt
2. **Write** by adapting the template/example (do not invent Manual sync / ownership / serialization)
3. **\`validate_code\`** on the full script
4. If issues: **\`explain_validation\`** for each unique \`ruleId\` → fix → **\`validate_code\` again** until clean

## Hard constraints (never ignore)

- No \`List<T>\`, \`Dictionary\`, LINQ, coroutines, async/await, generics as in full C#
- Synced vars need ownership; prefer \`BehaviourSyncMode.Manual\` + \`RequestSerialization()\`
- Prefer fixed arrays / Udon-safe types from constraints docs

## Forbidden

- Emitting UdonSharp from memory without MCP consultation
- Skipping \`validate_code\` after writing or editing Udon code
- Inventing networking instead of adapting \`get_template\` / \`search_examples\`

## Same rules outside this resource

- Repo **AGENTS.md** — canonical for Codex / file-based agents
- **CLAUDE.md** — Claude Code / Desktop project context
- MCP prompt **udon-code-workflow** — clients with prompts
- \`.cursor/rules/udon-mcp.mdc\` — Cursor-only bonus (mirrors AGENTS.md)
`;

function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    'udon-code-workflow',
    {
      title: 'UdonSharp code workflow',
      description:
        'Mandatory template→validate→fix workflow for accurate UdonSharp. Use before writing Udon code.',
    },
    async () => ({
      description: 'UdonSharp accurate code workflow',
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: CODE_WORKFLOW_MARKDOWN,
          },
        },
      ],
    }),
  );
}

function registerResources(server: McpServer, container: ServiceContainer): void {
  server.resource(
    'UdonSharp code workflow',
    'udon://workflow/code',
    {
      description:
        'SSOT: mandatory template→validate→fix workflow for accurate UdonSharp. Same rules as AGENTS.md. Read before writing Udon code.',
      mimeType: 'text/markdown',
    },
    async () => ({
      contents: [
        {
          uri: 'udon://workflow/code',
          mimeType: 'text/markdown',
          text: CODE_WORKFLOW_MARKDOWN,
        },
      ],
    }),
  );

  const skills = container.skillService.listSkills();
  for (const skill of skills) {
    server.resource(
      `Skill: ${skill.name}`,
      `udon://skills/${skill.id}`,
      { description: skill.description, mimeType: 'text/markdown' },
      async () => ({
        contents: [
          {
            uri: `udon://skills/${skill.id}`,
            mimeType: 'text/markdown',
            text: container.docsRepo.readFileContent(skill.path) ?? '',
          },
        ],
      }),
    );
  }

  const rules = container.ruleService.listRules();
  for (const rule of rules) {
    server.resource(
      `Rule: ${rule.name}`,
      `udon://rules/${rule.id}`,
      { description: rule.purpose, mimeType: 'text/markdown' },
      async () => ({
        contents: [
          {
            uri: `udon://rules/${rule.id}`,
            mimeType: 'text/markdown',
            text: container.docsRepo.readFileContent(rule.path) ?? '',
          },
        ],
      }),
    );
  }

  server.resource(
    'SDK Version Matrix',
    'udon://sdk/matrix',
    { description: 'SDK version matrix from repository', mimeType: 'application/json' },
    async () => ({
      contents: [
        {
          uri: 'udon://sdk/matrix',
          mimeType: 'application/json',
          text: JSON.stringify(container.sdkService.getSdkMatrix(), null, 2),
        },
      ],
    }),
  );

  const templates = container.templateService.listTemplates();
  server.resource(
    'Template Index',
    'udon://templates/index',
    { description: 'Index of UdonSharp templates from repository', mimeType: 'application/json' },
    async () => ({
      contents: [
        {
          uri: 'udon://templates/index',
          mimeType: 'application/json',
          text: JSON.stringify(
            templates.map((t) => ({ id: t.id, name: t.name, path: t.path })),
            null,
            2,
          ),
        },
      ],
    }),
  );

  const cheatsheets = container.docsRepo.getAll().filter((d) => d.fileType === 'cheatsheet');
  for (const sheet of cheatsheets) {
    server.resource(
      `Cheatsheet: ${sheet.title}`,
      `udon://cheatsheet/${sheet.skillId ?? sheet.id}`,
      { description: `CHEATSHEET.md for ${sheet.skillId}`, mimeType: 'text/markdown' },
      async () => ({
        contents: [
          {
            uri: `udon://cheatsheet/${sheet.skillId ?? sheet.id}`,
            mimeType: 'text/markdown',
            text: container.docsRepo.readFileContent(sheet.path) ?? sheet.content,
          },
        ],
      }),
    );
  }
}

/**
 * Starts the MCP server on stdio transport.
 */
export async function startServer(container: ServiceContainer): Promise<void> {
  const server = createServer(container);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
