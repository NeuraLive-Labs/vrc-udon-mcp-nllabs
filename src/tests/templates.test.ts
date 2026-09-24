import { describe, it, expect, beforeAll } from 'vitest';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DocsRepository } from '../repositories/docs-repository.js';
import { TemplateService } from '../services/template-service.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoPath = join(__dirname, '../../agent-skills-vrc-udon');

describe('TemplateService', () => {
  let service: TemplateService;

  beforeAll(() => {
    const repo = new DocsRepository(repoPath, join(__dirname, '../../data/test-templates'));
    repo.rebuild();
    service = new TemplateService(repo);
  });

  it('lists templates from repository', () => {
    const templates = service.listTemplates();
    expect(templates.length).toBeGreaterThan(0);
    expect(templates.every((t) => t.path.endsWith('.cs'))).toBe(true);
  });

  it('gets template by id', () => {
    const templates = service.listTemplates();
    const first = templates[0];
    expect(first).toBeDefined();
    if (first) {
      const template = service.getTemplate(first.id);
      expect(template?.code).toContain('class');
    }
  });

  it('searches templates', () => {
    const results = service.search('sync');
    expect(results.length).toBeGreaterThan(0);
  });
});
