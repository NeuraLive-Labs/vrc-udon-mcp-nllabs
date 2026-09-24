import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RepositorySync } from '../services/repository-sync.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tempRoot = join(__dirname, '../../data/test-sync');

function makeSync(path: string): RepositorySync {
  return new RepositorySync({
    url: 'https://example.com/docs.git',
    path,
    branch: 'main',
  });
}

describe('RepositorySync', () => {
  beforeEach(() => {
    rmSync(tempRoot, { recursive: true, force: true });
    mkdirSync(tempRoot, { recursive: true });
  });

  afterEach(() => {
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('isPresent returns false when path is missing', () => {
    const sync = makeSync(join(tempRoot, 'missing'));
    expect(sync.isPresent()).toBe(false);
  });

  it('isPresent returns false when directory is empty', () => {
    const emptyDir = join(tempRoot, 'empty');
    mkdirSync(emptyDir, { recursive: true });
    const sync = makeSync(emptyDir);
    expect(sync.isPresent()).toBe(false);
  });

  it('isPresent returns true when directory has content', () => {
    const filled = join(tempRoot, 'filled');
    mkdirSync(filled, { recursive: true });
    writeFileSync(join(filled, 'README.md'), '# docs');
    const sync = makeSync(filled);
    expect(sync.isPresent()).toBe(true);
  });

  it('ensureCloned skips clone when repository already exists', () => {
    const filled = join(tempRoot, 'filled');
    mkdirSync(filled, { recursive: true });
    writeFileSync(join(filled, 'README.md'), '# docs');
    const sync = makeSync(filled);

    const result = sync.ensureCloned();

    expect(result.success).toBe(true);
    expect(result.action).toBe('none');
    expect(existsSync(join(filled, 'README.md'))).toBe(true);
  });
});
