import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { KnowledgeParser } from '../parsers/knowledge-parser.js';
import { RuleParser } from '../parsers/rule-parser.js';
import type { IndexedDocument, IndexSnapshot, ValidationRule } from '../types/index.js';

const INDEX_VERSION = 1;
const INDEX_FILE = 'document-index.json';

/**
 * Repository for indexed documentation from agent-skills-vrc-udon.
 */
export class DocsRepository {
  private documents: IndexedDocument[] = [];
  private searchChunks: IndexedDocument[] = [];
  private rules: ValidationRule[] = [];
  private loaded = false;
  private readonly parser = new KnowledgeParser();
  private readonly ruleParser = new RuleParser();

  constructor(
    private readonly repoPath: string,
    private readonly indexPath: string,
  ) {}

  /**
   * Loads index from disk or builds from repository.
   */
  load(): void {
    if (this.loaded) return;

    if (this.loadIndex()) {
      this.loaded = true;
      return;
    }

    this.rebuild();
    this.loaded = true;
  }

  /**
   * Rebuilds the full index from repository files.
   */
  rebuild(): IndexedDocument[] {
    if (!existsSync(this.repoPath)) {
      this.documents = [];
      this.searchChunks = [];
      this.rules = [];
      return [];
    }

    this.documents = this.parser.indexRepository(this.repoPath);
    this.searchChunks = this.documents.flatMap((doc) => this.parser.chunkDocument(doc));
    this.rules = this.ruleParser.parseRules(this.documents);
    this.saveIndex();
    return this.documents;
  }

  /**
   * Reloads a single file into the index.
   */
  reloadFile(relativePath: string): void {
    const fullPath = join(this.repoPath, relativePath);
    if (!existsSync(fullPath)) {
      this.documents = this.documents.filter((d) => d.path !== relativePath);
      this.searchChunks = this.searchChunks.filter((d) => !d.path.startsWith(relativePath));
    } else {
      const doc = this.parser.parseFile(fullPath, this.repoPath);
      if (doc) {
        this.documents = this.documents.filter((d) => d.path !== relativePath);
        this.documents.push(doc);
        this.searchChunks = this.searchChunks.filter((d) => d.path !== relativePath);
        this.searchChunks.push(...this.parser.chunkDocument(doc));
      }
    }
    this.rules = this.ruleParser.parseRules(this.documents);
    this.saveIndex();
  }

  getAll(): IndexedDocument[] {
    this.load();
    return this.documents;
  }

  getSearchChunks(): IndexedDocument[] {
    this.load();
    return this.searchChunks;
  }

  getRules(): ValidationRule[] {
    this.load();
    return this.rules;
  }

  getByPath(path: string): IndexedDocument | undefined {
    return this.getAll().find((d) => d.path === path);
  }

  getByFileType(fileType: IndexedDocument['fileType']): IndexedDocument[] {
    return this.getAll().filter((d) => d.fileType === fileType);
  }

  getBySkillId(skillId: string): IndexedDocument[] {
    return this.getAll().filter((d) => d.skillId === skillId);
  }

  getSkills(): IndexedDocument[] {
    return this.getByFileType('skill');
  }

  getRules_docs(): IndexedDocument[] {
    return this.getByFileType('rule');
  }

  getTemplates(): IndexedDocument[] {
    return this.getAll().filter((d) => d.fileType === 'template');
  }

  getReferences(): IndexedDocument[] {
    return this.getByFileType('reference');
  }

  findByTopic(topic: string): IndexedDocument[] {
    const lower = topic.toLowerCase();
    return this.getAll().filter(
      (d) =>
        d.title.toLowerCase().includes(lower) ||
        d.keywords.some((k) => k.includes(lower)) ||
        d.tags.some((t) => t.includes(lower)) ||
        d.content.toLowerCase().includes(lower) ||
        d.headings.some((h) => h.text.toLowerCase().includes(lower)),
    );
  }

  readFileContent(relativePath: string): string | null {
    const fullPath = join(this.repoPath, relativePath);
    if (!existsSync(fullPath)) return null;
    return readFileSync(fullPath, 'utf-8');
  }

  listFilesInDir(relativeDir: string): string[] {
    const fullDir = join(this.repoPath, relativeDir);
    if (!existsSync(fullDir)) return [];
    const files: string[] = [];
    this.collectFiles(fullDir, relativeDir, files);
    return files;
  }

  private collectFiles(dir: string, relativeDir: string, files: string[]): void {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const relPath = join(relativeDir, entry).replace(/\\/g, '/');
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        this.collectFiles(fullPath, relPath, files);
      } else {
        files.push(relPath);
      }
    }
  }

  /** Project root inferred from index location (e.g. data/indexes → repo root). */
  private getProjectRoot(): string {
    return resolve(this.indexPath, '..', '..');
  }

  /** Stores a portable relative path instead of machine-specific absolute paths. */
  private getRepositoryPathForStorage(): string {
    const rel = relative(this.getProjectRoot(), this.repoPath).replace(/\\/g, '/');
    if (!rel || rel.startsWith('..')) {
      return './agent-skills-vrc-udon';
    }
    return rel.startsWith('./') ? rel : `./${rel}`;
  }

  private repositoryPathsMatch(stored: string): boolean {
    const projectRoot = this.getProjectRoot();
    const resolvedStored = isAbsolute(stored)
      ? resolve(stored)
      : resolve(projectRoot, stored.replace(/^\.\//, ''));
    return resolve(resolvedStored) === resolve(this.repoPath);
  }

  saveIndex(): void {
    mkdirSync(this.indexPath, { recursive: true });
    const snapshot: IndexSnapshot = {
      version: INDEX_VERSION,
      builtAt: new Date().toISOString(),
      repositoryPath: this.getRepositoryPathForStorage(),
      documentCount: this.documents.length,
      documents: this.documents,
      rules: this.rules.map((r) => ({
        ...r,
        pattern: r.pattern.source,
      })),
    };
    writeFileSync(join(this.indexPath, INDEX_FILE), JSON.stringify(snapshot, null, 2));
  }

  loadIndex(): boolean {
    const indexFile = join(this.indexPath, INDEX_FILE);
    if (!existsSync(indexFile)) return false;

    try {
      const snapshot = JSON.parse(readFileSync(indexFile, 'utf-8')) as IndexSnapshot;
      if (!this.repositoryPathsMatch(snapshot.repositoryPath)) return false;

      this.documents = snapshot.documents;
      this.searchChunks = this.documents.flatMap((doc) => this.parser.chunkDocument(doc));
      this.rules = snapshot.rules.map((r) => ({
        ...r,
        pattern: new RegExp(r.pattern, 'm'),
      }));
      return true;
    } catch {
      return false;
    }
  }

  getRepoPath(): string {
    return this.repoPath;
  }
}
