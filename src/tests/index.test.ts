import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DocsRepository } from '../repositories/docs-repository.js';
import { RuleParser } from '../parsers/rule-parser.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoPath = join(__dirname, '../../agent-skills-vrc-udon');
const indexPath = join(__dirname, '../../data/test-indexes');

describe('DocsRepository', () => {
  let repo: DocsRepository;

  beforeAll(() => {
    repo = new DocsRepository(repoPath, indexPath);
    repo.rebuild();
  });

  it('indexes repository documents', () => {
    const docs = repo.getAll();
    expect(docs.length).toBeGreaterThan(50);
  });

  it('discovers skills', () => {
    const skills = repo.getSkills();
    expect(skills.some((s) => s.skillId === 'unity-vrc-udon-sharp')).toBe(true);
    expect(skills.some((s) => s.skillId === 'unity-vrc-world-sdk-3')).toBe(true);
  });

  it('discovers rules', () => {
    const rules = repo.getRules_docs();
    expect(rules.some((r) => r.path.includes('udonsharp-constraints'))).toBe(true);
  });

  it('discovers templates', () => {
    const templates = repo.getTemplates();
    expect(templates.length).toBeGreaterThan(0);
  });

  it('parses validation rules from repository', () => {
    const ruleParser = new RuleParser();
    const rules = ruleParser.parseRules(repo.getAll());
    expect(rules.length).toBeGreaterThan(10);
  });

  it('persists and loads index', () => {
    repo.saveIndex();
    const repo2 = new DocsRepository(repoPath, indexPath);
    expect(repo2.loadIndex()).toBe(true);
    expect(repo2.getAll().length).toBeGreaterThan(0);
  });

  it('stores repositoryPath as a relative path in the index', () => {
    repo.saveIndex();
    const indexFile = join(indexPath, 'document-index.json');
    const snapshot = JSON.parse(readFileSync(indexFile, 'utf-8')) as { repositoryPath: string };
    expect(snapshot.repositoryPath).toMatch(/^\.\//);
    expect(snapshot.repositoryPath).not.toMatch(/^[A-Za-z]:\\/);
    expect(snapshot.repositoryPath).not.toContain('Users');
  });
});
