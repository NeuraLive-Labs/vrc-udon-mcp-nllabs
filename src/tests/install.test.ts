import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  mergeVrchatUdonEntry,
  PORTABLE_VRCHAT_UDON_ENTRY,
  shouldRunInstall,
  writeMcpConfig,
  installToPath,
} from '../cli/install.js';

describe('shouldRunInstall', () => {
  it('detects install as first CLI arg', () => {
    expect(shouldRunInstall(['node', 'dist/index.js', 'install'])).toBe(true);
  });

  it('detects install after --', () => {
    expect(shouldRunInstall(['node', 'dist/index.js', '--', 'install'])).toBe(true);
  });

  it('detects install with --claude', () => {
    expect(shouldRunInstall(['node', 'dist/index.js', 'install', '--claude'])).toBe(true);
  });

  it('returns false when install is absent', () => {
    expect(shouldRunInstall(['node', 'dist/index.js'])).toBe(false);
  });
});

describe('mergeVrchatUdonEntry', () => {
  it('creates mcpServers when config is empty/missing', () => {
    expect(mergeVrchatUdonEntry(undefined)).toEqual({
      mcpServers: { 'vrchat-udon': { ...PORTABLE_VRCHAT_UDON_ENTRY } },
    });
    expect(mergeVrchatUdonEntry({})).toEqual({
      mcpServers: { 'vrchat-udon': { ...PORTABLE_VRCHAT_UDON_ENTRY } },
    });
  });

  it('preserves other servers', () => {
    const result = mergeVrchatUdonEntry({
      mcpServers: {
        other: { command: 'node', args: ['other.js'] },
      },
    });
    expect(result.mcpServers?.other).toEqual({ command: 'node', args: ['other.js'] });
    expect(result.mcpServers?.['vrchat-udon']).toEqual({ ...PORTABLE_VRCHAT_UDON_ENTRY });
  });

  it('overwrites old vrchat-udon entry without leftover env', () => {
    const result = mergeVrchatUdonEntry({
      mcpServers: {
        'vrchat-udon': {
          command: 'node',
          args: ['C:\\Users\\someone\\UdonMCP\\dist\\index.js'],
          env: { UDON_MCP_CONFIG: 'C:\\Users\\someone\\config.json' },
        },
      },
    });
    expect(result.mcpServers?.['vrchat-udon']).toEqual({ ...PORTABLE_VRCHAT_UDON_ENTRY });
    expect(result.mcpServers?.['vrchat-udon']).not.toHaveProperty('env');
  });

  it('preserves unrelated top-level keys', () => {
    const result = mergeVrchatUdonEntry({
      mcpServers: {},
      preferences: { theme: 'dark' },
    });
    expect(result.preferences).toEqual({ theme: 'dark' });
  });
});

describe('writeMcpConfig / installToPath', () => {
  let tempDir: string;
  let configPath: string;
  const prevEnv = process.env.UDON_MCP_INSTALL_PATH;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'udon-mcp-install-'));
    configPath = join(tempDir, 'mcp.json');
    process.env.UDON_MCP_INSTALL_PATH = configPath;
  });

  afterEach(() => {
    if (prevEnv === undefined) {
      delete process.env.UDON_MCP_INSTALL_PATH;
    } else {
      process.env.UDON_MCP_INSTALL_PATH = prevEnv;
    }
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('creates config file with pretty JSON and trailing newline', () => {
    writeMcpConfig(configPath, mergeVrchatUdonEntry(undefined));
    const raw = readFileSync(configPath, 'utf8');
    expect(raw.endsWith('\n')).toBe(true);
    expect(raw).toContain('  "mcpServers"');
    expect(JSON.parse(raw)).toEqual({
      mcpServers: { 'vrchat-udon': { ...PORTABLE_VRCHAT_UDON_ENTRY } },
    });
  });

  it('merges into existing file without wiping other servers', () => {
    writeFileSync(
      configPath,
      JSON.stringify(
        {
          mcpServers: {
            filesystem: { command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem'] },
          },
        },
        null,
        2,
      ),
      'utf8',
    );
    installToPath(configPath);
    const parsed = JSON.parse(readFileSync(configPath, 'utf8')) as {
      mcpServers: Record<string, unknown>;
    };
    expect(parsed.mcpServers.filesystem).toBeDefined();
    expect(parsed.mcpServers['vrchat-udon']).toEqual({ ...PORTABLE_VRCHAT_UDON_ENTRY });
  });

  it('creates parent directories when missing', () => {
    const nested = join(tempDir, 'nested', 'dir', 'mcp.json');
    installToPath(nested);
    expect(existsSync(nested)).toBe(true);
  });
});
