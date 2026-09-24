import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ServiceContainer } from '../services/container.js';
import type { AppConfig } from '../types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tempRoot = join(__dirname, '../../data/test-container');

function makeConfig(repoPath: string): AppConfig {
  return {
    repository: {
      url: 'https://example.com/docs.git',
      path: repoPath,
      branch: 'main',
    },
    sdkVersion: '3.10.4',
    language: 'en',
    watch: false,
    indexPath: join(tempRoot, 'indexes'),
    search: {
      fuzzy: 0.2,
      headingWeight: 3,
      titleWeight: 2.5,
      exampleWeight: 1.5,
      ruleWeight: 2,
      skillWeight: 2.5,
      cheatsheetWeight: 2.5,
      maxResults: 20,
    },
  };
}

describe('ServiceContainer documentation sync', () => {
  beforeEach(() => {
    rmSync(tempRoot, { recursive: true, force: true });
    mkdirSync(tempRoot, { recursive: true });
  });

  afterEach(() => {
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('calls sync when documentation already exists', () => {
    const filled = join(tempRoot, 'docs');
    mkdirSync(filled, { recursive: true });
    writeFileSync(join(filled, 'README.md'), '# docs');

    const container = new ServiceContainer(makeConfig(filled));
    const syncSpy = vi.spyOn(container.repositorySync, 'sync').mockReturnValue({
      success: true,
      action: 'pull',
      message: 'Updated to origin/main',
    });
    const rebuildSpy = vi.spyOn(container.docsRepo, 'rebuild').mockReturnValue([]);
    vi.spyOn(container, 'rebuildSearchIndex').mockImplementation(() => {});

    container.initialize();

    expect(syncSpy).toHaveBeenCalledOnce();
    expect(rebuildSpy).toHaveBeenCalledOnce();
  });

  it('does not abort initialize when sync fails and local docs exist', () => {
    const filled = join(tempRoot, 'docs');
    mkdirSync(filled, { recursive: true });
    writeFileSync(join(filled, 'README.md'), '# docs');

    const container = new ServiceContainer(makeConfig(filled));
    vi.spyOn(container.repositorySync, 'sync').mockReturnValue({
      success: false,
      action: 'pull',
      message: 'Fetch failed',
    });
    const loadSpy = vi.spyOn(container.docsRepo, 'load').mockImplementation(() => {});
    const rebuildSpy = vi.spyOn(container.docsRepo, 'rebuild');
    vi.spyOn(container, 'rebuildSearchIndex').mockImplementation(() => {});

    expect(() => container.initialize()).not.toThrow();
    expect(loadSpy).toHaveBeenCalledOnce();
    expect(rebuildSpy).not.toHaveBeenCalled();
  });

  it('calls sync (clone path) when documentation is missing', () => {
    const missing = join(tempRoot, 'missing-docs');
    const container = new ServiceContainer(makeConfig(missing));
    const syncSpy = vi.spyOn(container.repositorySync, 'sync').mockReturnValue({
      success: true,
      action: 'clone',
      message: 'Cloned https://example.com/docs.git',
    });
    const rebuildSpy = vi.spyOn(container.docsRepo, 'rebuild').mockReturnValue([]);
    vi.spyOn(container, 'rebuildSearchIndex').mockImplementation(() => {});

    container.initialize();

    expect(syncSpy).toHaveBeenCalledOnce();
    expect(rebuildSpy).toHaveBeenCalledOnce();
  });
});
