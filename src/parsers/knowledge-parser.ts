import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, basename, extname, posix as pathPosix } from 'node:path';
import type {
  CodeBlock,
  DocumentSection,
  DocumentType,
  HeadingNode,
  IndexedDocument,
} from '../types/index.js';
import {
  extractImages,
  extractRelativeLinks,
  extractSdkVersions,
  headingToAnchor,
  parseMarkdownTables,
  stripMarkdown,
} from './markdown-utils.js';

const SKIP_DIRS = new Set(['.git', 'node_modules', '.claude', 'unity-project-for-sdk-search']);
const TEXT_EXTENSIONS = new Set(['.md', '.txt', '.cs', '.sh', '.ps1']);
const CHUNK_MAX_SIZE = 2000;

const FILE_TYPE_WEIGHTS: Record<DocumentType, number> = {
  skill: 10,
  cheatsheet: 9,
  rule: 8,
  reference: 5,
  template: 6,
  hook: 7,
  asset: 3,
  readme: 4,
  other: 1,
};

/**
 * Recursively indexes all files in the agent-skills repository.
 */
export class KnowledgeParser {
  /**
   * Indexes an entire repository directory.
   */
  indexRepository(repoPath: string): IndexedDocument[] {
    const documents: IndexedDocument[] = [];
    this.walkDirectory(repoPath, repoPath, documents);
    return documents;
  }

  /**
   * Parses a single file into an indexed document.
   */
  parseFile(filePath: string, repoPath: string): IndexedDocument | null {
    const ext = extname(filePath).toLowerCase();
    if (!TEXT_EXTENSIONS.has(ext)) return null;

    const relativePath = relative(repoPath, filePath).replace(/\\/g, '/');
    const content = readFileSync(filePath, 'utf-8');
    const fileType = this.inferFileType(relativePath, basename(filePath));
    const metadata = ext === '.md' ? this.extractFrontmatter(content) : {};
    const body = ext === '.md' ? this.stripFrontmatter(content) : content;
    const headings = ext === '.md' ? this.extractHeadings(body) : [];
    const sections = ext === '.md' ? this.splitByHeadings(body) : [];
    const codeBlocks = this.extractCodeBlocks(body);
    const tables = ext === '.md' ? parseMarkdownTables(body) : [];
    const links = ext === '.md' ? extractRelativeLinks(body) : [];
    const images = ext === '.md' ? extractImages(body) : [];
    const sdkVersions = extractSdkVersions(content);
    const skillId = this.inferSkillId(relativePath);
    const title = this.inferTitle(relativePath, metadata, headings, basename(filePath, ext));
    const tags = this.extractTags(metadata, body, relativePath);
    const keywords = this.extractKeywords(title, headings, tags, body, tables);
    const language = ext === '.cs' ? 'csharp' : ext === '.sh' || ext === '.ps1' ? 'shell' : 'markdown';
    const examples = codeBlocks.filter(
      (b) => b.language === 'csharp' || b.language === 'cs' || b.code.includes('UdonSharpBehaviour'),
    );

    return {
      id: relativePath.replace(/[/\\.#\s]/g, '-'),
      title,
      path: relativePath,
      headings,
      sections,
      ...(metadata.sdkVersion || sdkVersions[0]
        ? { sdkVersion: metadata.sdkVersion ?? sdkVersions[0] }
        : {}),
      sdkVersions,
      keywords,
      tags,
      examples,
      relatedTopics: [...links, ...images],
      codeBlocks,
      language,
      weight: FILE_TYPE_WEIGHTS[fileType],
      fileType,
      content: body,
      metadata,
      tables,
      lineCount: content.split('\n').length,
      ...(skillId ? { skillId } : {}),
    };
  }

  private walkDirectory(dirPath: string, repoPath: string, documents: IndexedDocument[]): void {
    try {
      const entries = readdirSync(dirPath);
      for (const entry of entries) {
        if (SKIP_DIRS.has(entry)) continue;
        const fullPath = join(dirPath, entry);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          this.walkDirectory(fullPath, repoPath, documents);
        } else {
          const doc = this.parseFile(fullPath, repoPath);
          if (doc) documents.push(doc);
        }
      }
    } catch {
      // Directory may not exist
    }
  }

  private inferFileType(relativePath: string, fileName: string): DocumentType {
    const normalized = relativePath.replace(/\\/g, '/').toLowerCase();
    if (fileName === 'SKILL.md') return 'skill';
    if (fileName === 'CHEATSHEET.md') return 'cheatsheet';
    if (fileName === 'README.md') return 'readme';
    if (normalized.includes('/rules/')) return 'rule';
    if (normalized.includes('/references/')) return 'reference';
    if (normalized.includes('/templates/') || normalized.includes('/assets/templates/')) return 'template';
    if (normalized.includes('/hooks/')) return 'hook';
    if (normalized.includes('/assets/')) return 'asset';
    return 'other';
  }

  private inferSkillId(relativePath: string): string | undefined {
    const match = relativePath.replace(/\\/g, '/').match(/^skills\/([^/]+)/);
    return match?.[1];
  }

  private inferTitle(
    relativePath: string,
    metadata: Record<string, string>,
    headings: HeadingNode[],
    baseName: string,
  ): string {
    if (metadata.name) return metadata.name;
    if (metadata.title) return metadata.title;
    const h1 = headings.find((h) => h.level === 1);
    if (h1) return h1.text;
    if (baseName === 'SKILL') return relativePath.split('/')[1] ?? baseName;
    return baseName.replace(/[-_]/g, ' ');
  }

  private extractFrontmatter(content: string): Record<string, string> {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match?.[1]) return {};

    const metadata: Record<string, string> = {};
    for (const line of match[1].split('\n')) {
      const kv = line.match(/^([\w-]+):\s*(.+)$/);
      if (kv?.[1] && kv[2]) {
        metadata[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
      }
      const listKv = line.match(/^tags:\s*(.+)$/);
      if (listKv?.[1]) metadata.tags = listKv[1];
    }
    return metadata;
  }

  private stripFrontmatter(content: string): string {
    return content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
  }

  private extractHeadings(body: string): HeadingNode[] {
    const headings: HeadingNode[] = [];
    const lines = body.split('\n');
    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match?.[1] && match[2]) {
        const text = match[2].trim();
        headings.push({
          level: match[1].length,
          text,
          line: index + 1,
          anchor: headingToAnchor(text),
        });
      }
    });
    return headings;
  }

  private splitByHeadings(body: string): DocumentSection[] {
    const lines = body.split('\n');
    const sections: DocumentSection[] = [];
    let currentHeading = 'Introduction';
    let currentLevel = 1;
    let currentContent: string[] = [];
    const headingStack: Array<{ level: number; text: string }> = [];
    let lineStart = 1;

    const flush = (lineEnd: number): void => {
      const content = currentContent.join('\n').trim();
      if (content.length > 0) {
        sections.push({
          heading: currentHeading,
          level: currentLevel,
          content,
          headings: headingStack.map((h) => h.text),
          lineStart,
          lineEnd,
        });
      }
    };

    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match?.[1] && match[2]) {
        flush(index);
        const level = match[1].length;
        const text = match[2].trim();
        while (headingStack.length > 0) {
          const last = headingStack[headingStack.length - 1];
          if (last && last.level >= level) headingStack.pop();
          else break;
        }
        headingStack.push({ level, text });
        currentHeading = text;
        currentLevel = level;
        currentContent = [];
        lineStart = index + 2;
      } else {
        currentContent.push(line);
      }
    });
    flush(lines.length);

    if (sections.length === 0 && body.trim().length > 0) {
      sections.push({
        heading: 'Content',
        level: 1,
        content: body.trim(),
        headings: [],
        lineStart: 1,
        lineEnd: lines.length,
      });
    }

    return sections;
  }

  private extractCodeBlocks(content: string): CodeBlock[] {
    const blocks: CodeBlock[] = [];
    const pattern = /```(\w*)\r?\n([\s\S]*?)```/g;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(content)) !== null) {
      const before = content.slice(0, match.index);
      const lineStart = before.split('\n').length;
      blocks.push({
        language: match[1] || 'text',
        code: match[2]?.trim() ?? '',
        lineStart,
      });
    }

    if (blocks.length === 0 && content.includes('UdonSharpBehaviour')) {
      blocks.push({ language: 'csharp', code: content, lineStart: 1 });
    }

    return blocks;
  }

  private extractTags(
    metadata: Record<string, string>,
    body: string,
    relativePath: string,
  ): string[] {
    const tags = new Set<string>();
    if (metadata.tags) {
      metadata.tags.split(/[,\s]+/).forEach((t) => {
        const trimmed = t.trim().toLowerCase();
        if (trimmed) tags.add(trimmed);
      });
    }
    const pathParts = relativePath.split(/[/\\]/);
    for (const part of pathParts) {
      if (part && part !== 'skills') tags.add(part.toLowerCase().replace(/\.md$/, ''));
    }
    const tagMatch = body.match(/tags?:\s*\[([^\]]+)\]/i);
    if (tagMatch?.[1]) {
      tagMatch[1].split(',').forEach((t) => tags.add(t.trim().toLowerCase()));
    }
    return [...tags];
  }

  private extractKeywords(
    title: string,
    headings: HeadingNode[],
    tags: string[],
    body: string,
    tables: ReturnType<typeof parseMarkdownTables>,
  ): string[] {
    const keywords = new Set<string>();
    stripMarkdown(title)
      .split(/\s+/)
      .forEach((w) => keywords.add(w.toLowerCase()));
    headings.forEach((h) =>
      stripMarkdown(h.text)
        .split(/\s+/)
        .forEach((w) => keywords.add(w.toLowerCase())),
    );
    tags.forEach((t) => keywords.add(t));
    for (const table of tables) {
      for (const row of table.rows) {
        for (const cell of row) {
          const cleaned = stripMarkdown(cell);
          if (cleaned.length < 50) keywords.add(cleaned.toLowerCase());
        }
      }
    }
    const backtickTerms = body.match(/`([^`]+)`/g) ?? [];
    for (const term of backtickTerms) {
      const cleaned = term.replace(/`/g, '').trim();
      if (cleaned.length < 40) keywords.add(cleaned.toLowerCase());
    }
    return [...keywords].filter((k) => k.length > 1);
  }

  /**
   * Splits large documents into searchable sub-chunks.
   */
  chunkDocument(doc: IndexedDocument): IndexedDocument[] {
    if (doc.content.length <= CHUNK_MAX_SIZE) return [doc];

    const chunks: IndexedDocument[] = [];
    for (let i = 0; i < doc.sections.length; i++) {
      const section = doc.sections[i];
      if (!section) continue;
      if (section.content.length <= CHUNK_MAX_SIZE) {
        chunks.push({
          ...doc,
          id: `${doc.id}#section-${i}`,
          title: section.heading,
          content: section.content,
          headings: doc.headings.filter((h) => section.headings.includes(h.text)),
        });
      } else {
        let start = 0;
        let part = 0;
        while (start < section.content.length) {
          const end = Math.min(start + CHUNK_MAX_SIZE, section.content.length);
          chunks.push({
            ...doc,
            id: `${doc.id}#section-${i}-${part}`,
            title: section.heading,
            content: section.content.slice(start, end),
            headings: doc.headings.filter((h) => section.headings.includes(h.text)),
          });
          start = end;
          part++;
        }
      }
    }
    return chunks.length > 0 ? chunks : [doc];
  }
}

/**
 * Normalizes a relative path for cross-platform comparison.
 */
export function normalizeRepoPath(filePath: string): string {
  return pathPosix.normalize(filePath.replace(/\\/g, '/'));
}
