import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

export const SERVER_KEY = 'vrchat-udon';

export const PORTABLE_VRCHAT_UDON_ENTRY = {
  command: 'npx',
  args: ['-y', 'github:NeuraLive-Labs/vrc-udon-mcp-nllabs'],
} as const;

export type McpServerEntry = {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  [key: string]: unknown;
};

export type McpConfig = {
  mcpServers?: Record<string, McpServerEntry>;
  [key: string]: unknown;
};

export function shouldRunInstall(argv: string[] = process.argv): boolean {
  return argv.slice(2).includes('install');
}

export function wantsClaude(argv: string[] = process.argv): boolean {
  return argv.slice(2).includes('--claude');
}

export function getCursorMcpPath(): string {
  const override = process.env.UDON_MCP_INSTALL_PATH;
  if (override && override.trim() !== '') {
    return override;
  }
  return join(homedir(), '.cursor', 'mcp.json');
}

export function getClaudeDesktopConfigPath(): string {
  const override = process.env.UDON_MCP_CLAUDE_INSTALL_PATH;
  if (override && override.trim() !== '') {
    return override;
  }
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming');
    return join(appData, 'Claude', 'claude_desktop_config.json');
  }
  if (process.platform === 'darwin') {
    return join(homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  }
  return join(homedir(), '.config', 'Claude', 'claude_desktop_config.json');
}

export function mergeVrchatUdonEntry(config: unknown): McpConfig {
  const base: McpConfig =
    config !== null && typeof config === 'object' && !Array.isArray(config)
      ? { ...(config as McpConfig) }
      : {};

  const existingServers =
    base.mcpServers !== null && typeof base.mcpServers === 'object' && !Array.isArray(base.mcpServers)
      ? { ...base.mcpServers }
      : {};

  existingServers[SERVER_KEY] = {
    command: PORTABLE_VRCHAT_UDON_ENTRY.command,
    args: [...PORTABLE_VRCHAT_UDON_ENTRY.args],
  };

  return {
    ...base,
    mcpServers: existingServers,
  };
}

export function readMcpConfig(path: string): unknown {
  if (!existsSync(path)) {
    return { mcpServers: {} };
  }
  const raw = readFileSync(path, 'utf8').trim();
  if (raw === '') {
    return { mcpServers: {} };
  }
  return JSON.parse(raw) as unknown;
}

export function writeMcpConfig(path: string, config: McpConfig): void {
  mkdirSync(dirname(path), { recursive: true });
  const body = `${JSON.stringify(config, null, 2)}\n`;
  writeFileSync(path, body, 'utf8');
}

export function installToPath(path: string): McpConfig {
  const existing = readMcpConfig(path);
  const merged = mergeVrchatUdonEntry(existing);
  writeMcpConfig(path, merged);
  return merged;
}

function isSpanishLocale(): boolean {
  const lang = (process.env.LANG ?? process.env.LC_ALL ?? process.env.LC_MESSAGES ?? '').toLowerCase();
  if (lang.startsWith('es')) return true;
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase().startsWith('es');
  } catch {
    return false;
  }
}

function successMessage(path: string, target: 'cursor' | 'claude'): string {
  const es = isSpanishLocale();
  if (target === 'claude') {
    return es
      ? `MCP instalado en Claude Desktop:\n  ${path}\nReinicia Claude Desktop para aplicar los cambios.`
      : `MCP installed in Claude Desktop:\n  ${path}\nRestart Claude Desktop to apply changes.`;
  }
  return es
    ? `MCP instalado en Cursor:\n  ${path}\nActualiza / refresca MCP en Cursor (Refresh MCP).`
    : `MCP installed in Cursor:\n  ${path}\nRefresh MCP in Cursor.`;
}

export interface InstallOptions {
  argv?: string[];
  /** When set, skips Cursor path resolution (tests). */
  cursorPath?: string;
  /** When set, skips Claude path resolution (tests). */
  claudePath?: string;
}

/**
 * Writes portable vrchat-udon MCP entry into Cursor mcp.json (and optionally Claude Desktop).
 */
export function runInstall(options: InstallOptions = {}): void {
  const argv = options.argv ?? process.argv;
  const cursorPath = options.cursorPath ?? getCursorMcpPath();
  installToPath(cursorPath);
  console.log(successMessage(cursorPath, 'cursor'));

  if (wantsClaude(argv)) {
    const claudePath = options.claudePath ?? getClaudeDesktopConfigPath();
    installToPath(claudePath);
    console.log(successMessage(claudePath, 'claude'));
  }
}
