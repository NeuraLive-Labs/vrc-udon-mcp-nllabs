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

  return server;
}

function registerResources(server: McpServer, container: ServiceContainer): void {
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
