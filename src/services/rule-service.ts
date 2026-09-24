import type { DocsRepository } from '../repositories/docs-repository.js';
import type { RuleInfo, IndexedDocument } from '../types/index.js';
import { extractRelativeLinks } from '../parsers/markdown-utils.js';

/**
 * Rule discovery and reading from repository rules/ folder.
 */
export class RuleService {
  constructor(private readonly docsRepo: DocsRepository) {}

  listRules(skillId?: string): RuleInfo[] {
    let rules = this.docsRepo.getRules_docs();
    if (skillId) rules = rules.filter((d) => d.skillId === skillId);
    return rules.map((doc) => this.toRuleInfo(doc));
  }

  readRule(ruleId: string): (RuleInfo & {
    content: string;
    constraints: Array<{ feature: string; alternative: string; line: number }>;
    examples: IndexedDocument['examples'];
  }) | null {
    const doc = this.docsRepo
      .getRules_docs()
      .find(
        (d) =>
          d.path.includes(ruleId) ||
          d.path.endsWith(`${ruleId}.md`) ||
          d.id === ruleId,
      );
    if (!doc) return null;

    const constraints = doc.tables.flatMap((table) => {
      const featureIdx = table.headers.findIndex((h) => h.toLowerCase().includes('feature'));
      const altIdx = table.headers.findIndex((h) => h.toLowerCase().includes('alternative'));
      if (featureIdx < 0) return [];
      return table.rows.map((row, idx) => ({
        feature: row[featureIdx] ?? '',
        alternative: altIdx >= 0 ? (row[altIdx] ?? '') : '',
        line: table.lineStart + idx + 2,
      }));
    });

    return {
      ...this.toRuleInfo(doc),
      content: this.docsRepo.readFileContent(doc.path) ?? doc.content,
      constraints,
      examples: doc.examples,
    };
  }

  private toRuleInfo(doc: IndexedDocument): RuleInfo {
    const links = extractRelativeLinks(doc.content);
    const relatedRules = links.filter((l) => l.includes('rules/'));

    return {
      id: doc.path.replace(/[/\\]/g, '-').replace(/\.md$/, ''),
      name: doc.title,
      path: doc.path,
      purpose: doc.sections[0]?.content.slice(0, 400) ?? doc.content.slice(0, 400),
      ...(doc.skillId ? { skillId: doc.skillId } : {}),
      relatedRules,
    };
  }
}
