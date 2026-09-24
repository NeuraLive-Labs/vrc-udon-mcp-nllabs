import type { DocsRepository } from '../repositories/docs-repository.js';
import type { SdkVersionEntry } from '../types/index.js';
import type { SearchEngine } from './search-engine.js';
import { parseMarkdownTables } from '../parsers/markdown-utils.js';

/**
 * SDK version matrix and feature search from repository documentation.
 */
export class SdkService {
  constructor(
    private readonly docsRepo: DocsRepository,
    private readonly searchEngine: SearchEngine,
  ) {}

  getSdkMatrix(): { versions: SdkVersionEntry[]; source: string; lineStart: number } {
    const candidates = [
      'templates/AGENTS.md',
      'templates/CLAUDE.md',
      'templates/GEMINI.md',
    ];

    for (const path of candidates) {
      const content = this.docsRepo.readFileContent(path);
      if (!content) continue;

      const tables = parseMarkdownTables(content);
      const sdkTable = tables.find((t) =>
        t.headers.some((h) => h.toLowerCase().includes('version')),
      );
      if (!sdkTable) continue;

      const versionIdx = sdkTable.headers.findIndex((h) => h.toLowerCase().includes('version'));
      const featuresIdx = sdkTable.headers.findIndex((h) =>
        h.toLowerCase().includes('feature'),
      );
      if (versionIdx < 0) continue;

      const versions: SdkVersionEntry[] = sdkTable.rows.map((row, idx) => ({
        version: row[versionIdx] ?? '',
        features: featuresIdx >= 0 ? (row[featuresIdx] ?? '') : '',
        sourcePath: path,
        sourceLine: sdkTable.lineStart + idx + 2,
      }));

      return { versions, source: path, lineStart: sdkTable.lineStart };
    }

    return { versions: [], source: 'templates/AGENTS.md', lineStart: 21 };
  }

  searchSdkFeature(query: string, sdkVersion?: string, limit = 10): Array<{
    feature: string;
    description: string;
    path: string;
    lineStart: number;
    score: number;
  }> {
    const results = this.searchEngine.search(query, {
      ...(sdkVersion !== undefined ? { sdkVersion } : {}),
      limit,
    });

    return results.map((r) => ({
      feature: r.title,
      description: r.excerpt,
      path: r.path,
      lineStart: r.lineStart ?? 1,
      score: r.score,
    }));
  }
}
