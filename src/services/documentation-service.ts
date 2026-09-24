import type { DocsRepository } from '../repositories/docs-repository.js';
import type { SearchEngine } from './search-engine.js';
import type { RankingService } from './search-engine.js';
import type { TopicExplanation, Citation, SearchResult } from '../types/index.js';

/**
 * Documentation search and topic explanation from indexed repository content.
 */
export class DocumentationService {
  constructor(
    private readonly docsRepo: DocsRepository,
    private readonly searchEngine: SearchEngine,
    private readonly rankingService: RankingService,
    private readonly defaultSdkVersion: string,
  ) {}

  searchDocumentation(
    query: string,
    options?: { sdkVersion?: string; limit?: number },
  ): SearchResult[] {
    const results = this.searchEngine.search(query, {
      ...(options?.sdkVersion !== undefined ? { sdkVersion: options.sdkVersion } : {}),
      limit: options?.limit ?? 10,
    });
    return this.rankingService.rerank(results, query);
  }

  explainTopic(
    topic: string,
    sdkVersion?: string,
    depth: 'brief' | 'detailed' | 'expert' = 'detailed',
  ): TopicExplanation {
    const version = sdkVersion ?? this.defaultSdkVersion;
    const matches = this.docsRepo.findByTopic(topic);
    const searchResults = this.searchDocumentation(topic, { sdkVersion: version, limit: depth === 'brief' ? 3 : 8 });

    const docIds = new Set<string>();
    const sections: TopicExplanation['sections'] = [];
    const sources: Citation[] = [];

    const addDoc = (doc: import('../types/index.js').IndexedDocument, maxSections: number): void => {
      if (docIds.has(doc.path)) return;
      docIds.add(doc.path);

      const relevantSections = doc.sections.filter(
        (s) =>
          s.heading.toLowerCase().includes(topic.toLowerCase()) ||
          s.content.toLowerCase().includes(topic.toLowerCase()) ||
          doc.title.toLowerCase().includes(topic.toLowerCase()),
      );

      const toUse = relevantSections.length > 0 ? relevantSections.slice(0, maxSections) : doc.sections.slice(0, 1);

      for (const section of toUse) {
        const citation: Citation = {
          path: doc.path,
          heading: section.heading,
          lineStart: section.lineStart,
          lineEnd: section.lineEnd,
        };
        sections.push({
          heading: section.heading,
          content: depth === 'brief' ? section.content.slice(0, 500) : section.content,
          citation,
        });
        sources.push(citation);
      }
    };

    for (const result of searchResults) {
      const doc = this.docsRepo.getByPath(result.path);
      if (doc) addDoc(doc, depth === 'expert' ? 5 : 2);
    }

    for (const doc of matches.slice(0, 3)) {
      addDoc(doc, 1);
    }

    const relatedTopics = [
      ...new Set(
        sections.flatMap((s) =>
          this.docsRepo
            .getByPath(s.citation.path)
            ?.relatedTopics.filter((t) => !t.startsWith('http')) ?? [],
        ),
      ),
    ].slice(0, 10);

    return {
      topic,
      sdkVersion: version,
      sections,
      relatedTopics,
      sources,
    };
  }

  searchByCategory(
    query: string,
    category: 'constraints' | 'networking' | 'examples' | 'best-practice' | 'antipattern',
    limit = 10,
  ): SearchResult[] {
    const pathFilters: Record<string, string> = {
      constraints: 'constraints',
      networking: 'networking',
      examples: 'patterns-',
      'best-practice': 'patterns-',
      antipattern: 'antipattern',
    };

    const fileTypeFilters: Partial<Record<string, import('../types/index.js').DocumentType[]>> = {
      constraints: ['rule', 'reference'],
      networking: ['rule', 'reference'],
      examples: ['reference', 'template'],
      'best-practice': ['reference'],
      antipattern: ['reference'],
    };

    const results = this.searchEngine.search(query, {
      pathContains: pathFilters[category],
      ...(fileTypeFilters[category] ? { fileTypes: fileTypeFilters[category] } : {}),
      examplesOnly: category === 'examples',
      limit,
    });

    return this.rankingService.rerank(results, query);
  }
}
