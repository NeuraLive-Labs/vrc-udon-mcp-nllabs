import { existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import type { RepositoryConfig } from '../types/index.js';

/** Max time for initial clone so MCP startup cannot hang forever. */
const GIT_CLONE_TIMEOUT_MS = 120_000;

/**
 * Shorter budget for depth-1 fetch + reset on every MCP start.
 * Slow/offline networks fail fast and fall back to existing local docs.
 */
const GIT_PULL_TIMEOUT_MS = 30_000;

export interface SyncResult {
  success: boolean;
  action: 'clone' | 'pull' | 'none';
  message: string;
}

/**
 * Manages cloning and updating the agent-skills repository.
 */
export class RepositorySync {
  constructor(private readonly config: RepositoryConfig) {}

  /**
   * True when the docs path exists and contains at least one entry.
   */
  isPresent(): boolean {
    if (!existsSync(this.config.path)) return false;
    try {
      return readdirSync(this.config.path).length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Clones the docs repo only when missing or empty. Skips pull.
   * Prefer {@link sync} for startup and `pnpm update-docs`.
   */
  ensureCloned(): SyncResult {
    if (this.isPresent()) {
      return {
        success: true,
        action: 'none',
        message: `Repository already present at ${this.config.path}`,
      };
    }
    return this.clone();
  }

  /**
   * Ensures repository exists and is up to date (clone if missing, else pull).
   */
  sync(): SyncResult {
    if (!this.isPresent()) {
      return this.clone();
    }
    return this.pull();
  }

  clone(): SyncResult {
    const result = spawnSync(
      'git',
      ['clone', '--branch', this.config.branch, '--depth', '1', this.config.url, this.config.path],
      {
        encoding: 'utf-8',
        shell: process.platform === 'win32',
        timeout: GIT_CLONE_TIMEOUT_MS,
      },
    );

    if (result.error) {
      return {
        success: false,
        action: 'clone',
        message: result.error.message || 'Clone failed',
      };
    }

    if (result.status !== 0) {
      return {
        success: false,
        action: 'clone',
        message: result.stderr || result.stdout || 'Clone failed',
      };
    }

    return { success: true, action: 'clone', message: `Cloned ${this.config.url}` };
  }

  pull(): SyncResult {
    const fetch = spawnSync(
      'git',
      ['fetch', '--depth', '1', 'origin', this.config.branch],
      {
        cwd: this.config.path,
        encoding: 'utf-8',
        shell: process.platform === 'win32',
        timeout: GIT_PULL_TIMEOUT_MS,
      },
    );

    if (fetch.error) {
      return {
        success: false,
        action: 'pull',
        message: fetch.error.message || 'Fetch failed',
      };
    }

    if (fetch.status !== 0) {
      return {
        success: false,
        action: 'pull',
        message: fetch.stderr || 'Fetch failed',
      };
    }

    const reset = spawnSync('git', ['reset', '--hard', `origin/${this.config.branch}`], {
      cwd: this.config.path,
      encoding: 'utf-8',
      shell: process.platform === 'win32',
      timeout: GIT_PULL_TIMEOUT_MS,
    });

    if (reset.error) {
      return {
        success: false,
        action: 'pull',
        message: reset.error.message || 'Reset failed',
      };
    }

    if (reset.status !== 0) {
      return {
        success: false,
        action: 'pull',
        message: reset.stderr || 'Reset failed',
      };
    }

    return { success: true, action: 'pull', message: `Updated to origin/${this.config.branch}` };
  }
}
