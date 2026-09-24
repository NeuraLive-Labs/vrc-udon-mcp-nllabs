import type { DocsRepository } from '../repositories/docs-repository.js';
import type { SkillInfo, IndexedDocument } from '../types/index.js';

/**
 * Skill discovery and reading from repository SKILL.md files.
 */
export class SkillService {
  constructor(private readonly docsRepo: DocsRepository) {}

  listSkills(): SkillInfo[] {
    return this.docsRepo.getSkills().map((doc) => this.toSkillInfo(doc));
  }

  readSkill(skillId: string): SkillInfo & { content: string; metadata: Record<string, string> } | null {
    const doc = this.docsRepo
      .getSkills()
      .find((d) => d.skillId === skillId || d.path.includes(skillId));
    if (!doc) return null;

    const skillDir = `skills/${doc.skillId ?? skillId}`;
    const rules = this.docsRepo
      .getRules_docs()
      .filter((d) => d.skillId === doc.skillId)
      .map((d) => d.path);
    const references = this.docsRepo
      .getReferences()
      .filter((d) => d.skillId === doc.skillId)
      .map((d) => d.path);
    const templates = this.docsRepo
      .getTemplates()
      .filter((d) => d.path.startsWith(skillDir))
      .map((d) => d.path);
    const cheatsheet = this.docsRepo
      .getAll()
      .find((d) => d.skillId === doc.skillId && d.fileType === 'cheatsheet')?.path;

    return {
      ...this.toSkillInfo(doc),
      content: this.docsRepo.readFileContent(doc.path) ?? doc.content,
      metadata: doc.metadata,
      rules,
      references,
      templates,
      ...(cheatsheet ? { cheatsheet } : {}),
    };
  }

  private toSkillInfo(doc: IndexedDocument): SkillInfo {
    const cheatsheet = this.docsRepo
      .getAll()
      .find((d) => d.skillId === doc.skillId && d.fileType === 'cheatsheet')?.path;

    return {
      id: doc.skillId ?? doc.id,
      name: doc.metadata.name ?? doc.title,
      description: doc.metadata.description ?? doc.sections[0]?.content.slice(0, 300) ?? '',
      path: doc.path,
      ...(doc.metadata.version ? { version: doc.metadata.version } : {}),
      tags: doc.tags,
      rules: this.docsRepo
        .getRules_docs()
        .filter((d) => d.skillId === doc.skillId)
        .map((d) => d.path),
      references: this.docsRepo
        .getReferences()
        .filter((d) => d.skillId === doc.skillId)
        .map((d) => d.path),
      templates: this.docsRepo
        .getTemplates()
        .filter((d) => d.skillId === doc.skillId)
        .map((d) => d.path),
      ...(cheatsheet ? { cheatsheet } : {}),
    };
  }
}
