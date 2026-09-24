import { describe, it, expect, beforeEach } from 'vitest';
import { SearchEngine, RankingService } from '../services/search-engine.js';
import type { IndexedDocument } from '../types/index.js';

const mockConfig = {
  fuzzy: 0.2,
  headingWeight: 3.0,
  titleWeight: 2.5,
  exampleWeight: 1.5,
  ruleWeight: 2.0,
  skillWeight: 2.5,
  cheatsheetWeight: 2.5,
  maxResults: 20,
};

const mockChunks: IndexedDocument[] = [
  {
    id: '1',
    title: 'Networking Ownership',
    path: 'skills/unity-vrc-udon-sharp/references/networking.md',
    content: 'Only the owner can write synced variables using Networking.IsOwner',
    headings: [{ level: 2, text: 'Networking', line: 1, anchor: 'networking' }],
    sections: [],
    sdkVersions: ['3.7.1'],
    keywords: ['networking', 'ownership'],
    tags: ['networking'],
    examples: [],
    relatedTopics: [],
    codeBlocks: [],
    language: 'markdown',
    weight: 5,
    fileType: 'reference',
    metadata: {},
    tables: [],
    lineCount: 10,
    skillId: 'unity-vrc-udon-sharp',
  },
  {
    id: '2',
    title: 'UdonSharp Constraints',
    path: 'skills/unity-vrc-udon-sharp/rules/udonsharp-constraints.md',
    content: 'List Dictionary async await Coroutine are not supported in UdonSharp',
    headings: [{ level: 1, text: 'Constraints', line: 1, anchor: 'constraints' }],
    sections: [],
    sdkVersions: [],
    keywords: ['list', 'coroutine', 'constraints'],
    tags: ['constraints'],
    examples: [],
    relatedTopics: [],
    codeBlocks: [],
    language: 'markdown',
    weight: 8,
    fileType: 'rule',
    metadata: {},
    tables: [],
    lineCount: 20,
    skillId: 'unity-vrc-udon-sharp',
  },
  {
    id: '3',
    title: 'Sync Example',
    path: 'skills/unity-vrc-udon-sharp/references/sync-examples.md',
    content: 'public class DoorExample : UdonSharpBehaviour with Interact and UdonSynced',
    headings: [],
    sections: [],
    sdkVersions: [],
    keywords: ['sync', 'example'],
    tags: ['example'],
    examples: [{ language: 'csharp', code: 'UdonSharpBehaviour', lineStart: 1 }],
    relatedTopics: [],
    codeBlocks: [{ language: 'csharp', code: 'UdonSharpBehaviour', lineStart: 1 }],
    language: 'markdown',
    weight: 5,
    fileType: 'reference',
    metadata: {},
    tables: [],
    lineCount: 15,
    skillId: 'unity-vrc-udon-sharp',
  },
];

describe('SearchEngine', () => {
  let searchEngine: SearchEngine;

  beforeEach(() => {
    searchEngine = new SearchEngine(mockConfig);
    searchEngine.buildIndex(mockChunks);
  });

  it('finds results by keyword', () => {
    const results = searchEngine.search('networking ownership');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.path).toContain('networking');
  });

  it('boosts rule documents for constraints', () => {
    const results = searchEngine.search('List Coroutine');
    expect(results.some((r) => r.fileType === 'rule')).toBe(true);
  });

  it('filters by file type', () => {
    const results = searchEngine.search('sync', { fileType: 'reference', examplesOnly: true });
    expect(results.every((r) => r.fileType === 'reference')).toBe(true);
  });

  it('respects limit', () => {
    const results = searchEngine.search('UdonSharp', { limit: 1 });
    expect(results.length).toBeLessThanOrEqual(1);
  });
});

describe('RankingService', () => {
  const ranking = new RankingService();

  it('boosts heading matches', () => {
    const results = [
      {
        id: '1',
        title: 'Other',
        path: 'a.md',
        excerpt: 'networking',
        score: 2,
        headings: ['Networking'],
        fileType: 'reference' as const,
      },
      {
        id: '2',
        title: 'Unrelated',
        path: 'b.md',
        excerpt: 'text',
        score: 3,
        headings: [],
        fileType: 'other' as const,
      },
    ];
    const ranked = ranking.rerank(results, 'networking');
    expect(ranked[0]?.id).toBe('1');
  });
});
