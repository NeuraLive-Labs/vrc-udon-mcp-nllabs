import MiniSearch from 'minisearch';
import type { AppConfig, IndexedDocument, SearchResult } from '../types/index.js';
import { createSnippet } from '../utils/index.js';
import { compareVersions } from '../utils/index.js';

interface SearchDocument {
  id: string;
  title: string;
  content: string;
  headings: string;
  keywords: string;
  tags: string;
  path: string;
  fileType: string;
  sdkVersion: string;
  weight: number;
}

export interface SearchOptions {
  sdkVersion?: string;
  fileType?: IndexedDocument['fileType'];
  fileTypes?: IndexedDocument['fileType'][];
  pathContains?: string;
  examplesOnly?: boolean;
  limit?: number;
}

/**
 * MiniSearch engine with heading > title > body ranking and file-type boosts.
 */
export class SearchEngine {
  private miniSearch: MiniSearch<SearchDocument> | null = null;
  private chunks: IndexedDocument[] = [];
  private documentCache = new Map<string, IndexedDocument>();

  constructor(private readonly config: AppConfig['search']) {}

  buildIndex(chunks: IndexedDocument[]): void {
    this.chunks = chunks;
    this.documentCache.clear();
    for (const chunk of chunks) {
      this.documentCache.set(chunk.id, chunk);
    }

    this.miniSearch = new MiniSearch<SearchDocument>({
      fields: ['title', 'headings', 'content', 'keywords', 'tags', 'path'],
      storeFields: ['title', 'path', 'fileType', 'sdkVersion', 'weight'],
      searchOptions: {
        boost: { headings: 3, title: 2.5, keywords: 1.5, tags: 1.2, path: 1.0, content: 1 },
        fuzzy: this.config.fuzzy,
        prefix: true,
      },
    });

    this.miniSearch.addAll(chunks.map((chunk) => this.toSearchDocument(chunk)));
  }

  search(query: string, options?: SearchOptions): SearchResult[] {
    if (!this.miniSearch || this.chunks.length === 0) return [];

    const limit = options?.limit ?? this.config.maxResults;
    const rawResults = this.miniSearch.search(query, { fuzzy: this.config.fuzzy });
    const results: SearchResult[] = [];

    for (const result of rawResults) {
      const chunk = this.documentCache.get(String(result.id));
      if (!chunk) continue;

      if (options?.sdkVersion && !this.matchesSdkVersion(chunk, options.sdkVersion)) continue;
      if (options?.fileType && chunk.fileType !== options.fileType) continue;
      if (options?.fileTypes && !options.fileTypes.includes(chunk.fileType)) continue;
      if (options?.pathContains && !chunk.path.includes(options.pathContains)) continue;
      if (options?.examplesOnly && chunk.examples.length === 0 && chunk.codeBlocks.length === 0)
        continue;

      let score = result.score;
      score *= this.getTypeBoost(chunk.fileType);
      score *= chunk.weight / 5;

      const headingMatch = chunk.headings.some((h) =>
        h.text.toLowerCase().includes(query.toLowerCase()),
      );
      if (headingMatch) score *= this.config.headingWeight;
      if (chunk.title.toLowerCase().includes(query.toLowerCase())) score *= this.config.titleWeight;
      if (chunk.examples.length > 0) score *= this.config.exampleWeight;

      const section = chunk.sections[0];
      results.push({
        id: chunk.id,
        title: chunk.title,
        path: chunk.path,
        excerpt: createSnippet(chunk.content),
        score,
        headings: chunk.headings.map((h) => h.text),
        fileType: chunk.fileType,
        ...(chunk.sdkVersion !== undefined ? { sdkVersion: chunk.sdkVersion } : {}),
        ...(section
          ? { lineStart: section.lineStart, section: section.heading }
          : {}),
      });
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Hook for future vector search integration.
   */
  async vectorSearch(_query: string, _limit?: number): Promise<SearchResult[]> {
    return [];
  }

  private toSearchDocument(chunk: IndexedDocument): SearchDocument {
    return {
      id: chunk.id,
      title: chunk.title,
      content: chunk.content,
      headings: chunk.headings.map((h) => h.text).join(' '),
      keywords: chunk.keywords.join(' '),
      tags: chunk.tags.join(' '),
      path: chunk.path,
      fileType: chunk.fileType,
      sdkVersion: chunk.sdkVersion ?? '',
      weight: chunk.weight,
    };
  }

  private getTypeBoost(fileType: IndexedDocument['fileType']): number {
    switch (fileType) {
      case 'skill':
        return this.config.skillWeight;
      case 'cheatsheet':
        return this.config.cheatsheetWeight;
      case 'rule':
        return this.config.ruleWeight;
      default:
        return 1;
    }
  }

  private matchesSdkVersion(doc: IndexedDocument, targetVersion: string): boolean {
    if (doc.sdkVersions.length === 0 && !doc.sdkVersion) return true;
    if (doc.sdkVersion && compareVersions(doc.sdkVersion, targetVersion) <= 0) return true;
    return doc.sdkVersions.some((v) => compareVersions(v, targetVersion) <= 0);
  }
}

/**
 * Re-ranks search results with additional relevance signals.
 */
export class RankingService {
  rerank(results: SearchResult[], query: string): SearchResult[] {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return results
      .map((r) => {
        let boost = 1;
        const titleLower = r.title.toLowerCase();
        for (const term of terms) {
          if (titleLower === term) boost += 2;
          else if (titleLower.includes(term)) boost += 1;
        }
        if (r.fileType === 'rule' || r.path.includes('networking')) boost += 0.5;
        if (r.headings.some((h) => terms.some((t) => h.toLowerCase().includes(t)))) boost += 1;
        return { ...r, score: r.score * boost };
      })
      .sort((a, b) => b.score - a.score);
  }
}
