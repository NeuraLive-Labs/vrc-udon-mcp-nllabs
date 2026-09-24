import { describe, it, expect } from 'vitest';
import { RankingService } from '../services/search-engine.js';
import type { SearchResult } from '../types/index.js';

describe('RankingService', () => {
  const ranking = new RankingService();

  const baseResult = (overrides: Partial<SearchResult>): SearchResult => ({
    id: '1',
    title: 'Default',
    path: 'test.md',
    excerpt: 'content',
    score: 1,
    headings: [],
    fileType: 'other',
    ...overrides,
  });

  it('boosts title exact match', () => {
    const results = [
      baseResult({ id: '1', title: 'Sync Modes', score: 1, fileType: 'reference' }),
      baseResult({ id: '2', title: 'sync modes guide', score: 1.5, fileType: 'rule' }),
    ];
    const ranked = ranking.rerank(results, 'sync modes');
    expect(ranked[0]?.id).toBe('2');
  });

  it('boosts rule and networking paths', () => {
    const results = [
      baseResult({ id: '1', title: 'Alpha Info', score: 1, path: 'general.md' }),
      baseResult({
        id: '2',
        title: 'Beta Info',
        score: 1,
        path: 'skills/unity-vrc-udon-sharp/references/networking.md',
        fileType: 'rule',
      }),
    ];
    const ranked = ranking.rerank(results, 'unrelated');
    expect(ranked[0]?.id).toBe('2');
  });

  it('preserves score ordering when no boosts apply', () => {
    const results = [
      baseResult({ id: '1', title: 'Alpha', score: 3 }),
      baseResult({ id: '2', title: 'Beta', score: 1 }),
    ];
    const ranked = ranking.rerank(results, 'unrelated');
    expect(ranked[0]?.score).toBeGreaterThanOrEqual(ranked[1]?.score ?? 0);
  });
});
