import { describe, it, expect } from 'vitest';
import { KnowledgeParser } from '../parsers/knowledge-parser.js';
import { parseMarkdownTables, extractSdkVersions } from '../parsers/markdown-utils.js';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('KnowledgeParser', () => {
  const testDir = join(tmpdir(), 'udon-mcp-parser-test');

  it('parses markdown with frontmatter, headings, and code blocks', () => {
    mkdirSync(testDir, { recursive: true });
    const filePath = join(testDir, 'test.md');
    writeFileSync(
      filePath,
      `---
name: test-skill
sdkVersion: 3.10.4
tags: test, udon
---

# Main Title

## Section One

Content with \`List<T>\` constraint.

## Code Example

\`\`\`csharp
public class Example : UdonSharpBehaviour { }
\`\`\`
`,
    );

    const parser = new KnowledgeParser();
    const doc = parser.parseFile(filePath, testDir);
    expect(doc).not.toBeNull();
    expect(doc?.title).toBe('test-skill');
    expect(doc?.sdkVersion).toBe('3.10.4');
    expect(doc?.sections.length).toBeGreaterThan(0);
    expect(doc?.codeBlocks.length).toBe(1);
    expect(doc?.examples.length).toBe(1);

    rmSync(testDir, { recursive: true, force: true });
  });

  it('infers file type from path', () => {
    mkdirSync(join(testDir, 'skills', 'test-skill', 'rules'), { recursive: true });
    const filePath = join(testDir, 'skills', 'test-skill', 'rules', 'constraints.md');
    writeFileSync(filePath, '# Constraints\n\n| Feature | Alternative |\n|---|---|\n| List<T> | DataList |');

    const parser = new KnowledgeParser();
    const doc = parser.parseFile(filePath, testDir);
    expect(doc?.fileType).toBe('rule');
    expect(doc?.skillId).toBe('test-skill');
    expect(doc?.tables.length).toBe(1);

    rmSync(testDir, { recursive: true, force: true });
  });

  it('indexes repository recursively', () => {
    mkdirSync(join(testDir, 'skills', 'skill-a'), { recursive: true });
    writeFileSync(join(testDir, 'skills', 'skill-a', 'SKILL.md'), '# Skill A\n\nContent');
    writeFileSync(join(testDir, 'README.md'), '# Readme');

    const parser = new KnowledgeParser();
    const docs = parser.indexRepository(testDir);
    expect(docs.length).toBeGreaterThanOrEqual(2);

    rmSync(testDir, { recursive: true, force: true });
  });
});

describe('markdown-utils', () => {
  it('parses markdown tables', () => {
    const content = `| Feature | Alternative |
|---------|-------------|
| List<T> | DataList |
| async/await | SendCustomEventDelayedSeconds |`;
    const tables = parseMarkdownTables(content);
    expect(tables.length).toBe(1);
    expect(tables[0]?.rows.length).toBe(2);
  });

  it('extracts SDK versions', () => {
    const versions = extractSdkVersions('SDK Coverage: 3.7.1 - 3.10.4');
    expect(versions).toContain('3.7.1');
    expect(versions).toContain('3.10.4');
  });
});
