import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { DocsRepository } from '../repositories/docs-repository.js';
import { FileWatcher } from '../services/file-watcher.js';
import { SearchEngine } from '../services/search-engine.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('FileWatcher', () => {
  const testDir = join(tmpdir(), 'udon-mcp-watcher-test');
  const indexPath = join(testDir, 'index');

  beforeEach(() => {
    mkdirSync(join(testDir, 'skills', 'test'), { recursive: true });
    writeFileSync(join(testDir, 'skills', 'test', 'SKILL.md'), '# Test Skill\n\nInitial content');
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('rebuilds index when file changes', async () => {
    const repo = new DocsRepository(testDir, indexPath);
    repo.rebuild();
    const search = new SearchEngine({
      fuzzy: 0.2,
      headingWeight: 3,
      titleWeight: 2.5,
      exampleWeight: 1.5,
      ruleWeight: 2,
      skillWeight: 2.5,
      cheatsheetWeight: 2.5,
      maxResults: 20,
    });
    search.buildIndex(repo.getSearchChunks());

    let rebuildCount = 0;
    const watcher = new FileWatcher(testDir, repo, () => {
      rebuildCount++;
      search.buildIndex(repo.getSearchChunks());
    });
    watcher.start();

    writeFileSync(
      join(testDir, 'skills', 'test', 'SKILL.md'),
      '# Test Skill\n\nUpdated content with networking',
    );
    repo.reloadFile('skills/test/SKILL.md');

    await new Promise((resolve) => setTimeout(resolve, 600));
    watcher.stop();

    const results = search.search('networking');
    expect(results.length).toBeGreaterThan(0);
  });
});
