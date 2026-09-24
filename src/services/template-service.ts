import type { DocsRepository } from '../repositories/docs-repository.js';
import type { TemplateInfo } from '../types/index.js';

/**
 * Template discovery from repository templates/ and assets/templates/.
 */
export class TemplateService {
  constructor(private readonly docsRepo: DocsRepository) {}

  listTemplates(skillId?: string): TemplateInfo[] {
    let templates = this.docsRepo.getTemplates();
    if (skillId) templates = templates.filter((d) => d.skillId === skillId);
    return templates.map((doc) => this.toTemplateInfo(doc));
  }

  getTemplate(templateId: string): TemplateInfo | null {
    const doc = this.docsRepo
      .getTemplates()
      .find(
        (d) =>
          d.id === templateId ||
          d.path.includes(templateId) ||
          d.path.endsWith(`${templateId}.cs`),
      );
    if (!doc) return null;
    return this.toTemplateInfo(doc);
  }

  search(query: string, limit = 10): TemplateInfo[] {
    const lower = query.toLowerCase();
    return this.listTemplates()
      .filter(
        (t) =>
          t.name.toLowerCase().includes(lower) ||
          t.description.toLowerCase().includes(lower) ||
          t.tags.some((tag) => tag.includes(lower)),
      )
      .slice(0, limit);
  }

  private toTemplateInfo(doc: import('../types/index.js').IndexedDocument): TemplateInfo {
    const name = doc.path.split('/').pop()?.replace(/\.cs$/, '') ?? doc.title;
    const descMatch = doc.content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\n/);
    const summaryMatch = doc.content.match(/\/\/\s*(.+)/);

    return {
      id: doc.id,
      name,
      description: descMatch?.[1] ?? summaryMatch?.[1] ?? `Template: ${name}`,
      path: doc.path,
      ...(doc.skillId ? { skillId: doc.skillId } : {}),
      language: doc.language,
      tags: doc.tags,
      code: doc.content,
    };
  }
}
