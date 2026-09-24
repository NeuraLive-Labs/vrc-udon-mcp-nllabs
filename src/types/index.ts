/** Supported SDK version identifier */
export type SdkVersion = string;

/** Severity levels for validation issues */
export type Severity = 'error' | 'warning' | 'info' | 'suggestion';

/** Document types inferred from repository structure */
export type DocumentType =
  | 'skill'
  | 'cheatsheet'
  | 'rule'
  | 'reference'
  | 'template'
  | 'hook'
  | 'asset'
  | 'readme'
  | 'other';

/** Heading hierarchy node */
export interface HeadingNode {
  level: number;
  text: string;
  line: number;
  anchor: string;
}

/** Document section with hierarchy */
export interface DocumentSection {
  heading: string;
  level: number;
  content: string;
  headings: string[];
  lineStart: number;
  lineEnd: number;
}

/** Extracted code block */
export interface CodeBlock {
  language: string;
  code: string;
  lineStart: number;
}

/** Parsed markdown table */
export interface MarkdownTable {
  headers: string[];
  rows: string[][];
  lineStart: number;
}

/** Indexed repository document */
export interface IndexedDocument {
  id: string;
  title: string;
  path: string;
  headings: HeadingNode[];
  sections: DocumentSection[];
  sdkVersion?: string;
  sdkVersions: string[];
  keywords: string[];
  tags: string[];
  examples: CodeBlock[];
  relatedTopics: string[];
  codeBlocks: CodeBlock[];
  language: string;
  weight: number;
  fileType: DocumentType;
  content: string;
  metadata: Record<string, string>;
  tables: MarkdownTable[];
  lineCount: number;
  skillId?: string;
}

/** Search result with ranking score */
export interface SearchResult {
  id: string;
  title: string;
  path: string;
  excerpt: string;
  score: number;
  headings: string[];
  fileType: DocumentType;
  sdkVersion?: string;
  lineStart?: number;
  section?: string;
}

/** Validation rule loaded from repository */
export interface ValidationRule {
  id: string;
  name: string;
  pattern: RegExp;
  severity: Severity;
  message: string;
  suggestion?: string;
  sourcePath: string;
  sourceLine: number;
  category: string;
}

/** Validation issue */
export interface ValidationIssue {
  severity: Severity;
  message: string;
  line?: number;
  column?: number;
  rule: string;
  ruleId: string;
  suggestion?: string;
  code?: string;
  sourcePath: string;
  sourceLine: number;
}

/** Validation result */
export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  summary: {
    errors: number;
    warnings: number;
    suggestions: number;
  };
}

/** Skill metadata */
export interface SkillInfo {
  id: string;
  name: string;
  description: string;
  path: string;
  version?: string;
  tags: string[];
  rules: string[];
  references: string[];
  templates: string[];
  cheatsheet?: string;
}

/** Rule metadata */
export interface RuleInfo {
  id: string;
  name: string;
  path: string;
  purpose: string;
  skillId?: string;
  relatedRules: string[];
}

/** Template metadata */
export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  path: string;
  skillId?: string;
  language: string;
  tags: string[];
  code: string;
}

/** SDK version entry from documentation */
export interface SdkVersionEntry {
  version: string;
  features: string;
  sourcePath: string;
  sourceLine: number;
}

/** Topic explanation with citations */
export interface TopicExplanation {
  topic: string;
  sdkVersion: string;
  sections: Array<{
    heading: string;
    content: string;
    citation: Citation;
  }>;
  relatedTopics: string[];
  sources: Citation[];
}

/** Source citation */
export interface Citation {
  path: string;
  heading?: string;
  lineStart: number;
  lineEnd?: number;
}

/** Repository configuration */
export interface RepositoryConfig {
  url: string;
  path: string;
  branch: string;
}

/** Application configuration */
export interface AppConfig {
  repository: RepositoryConfig;
  sdkVersion: SdkVersion;
  language: string;
  watch: boolean;
  indexPath: string;
  search: {
    fuzzy: number;
    headingWeight: number;
    titleWeight: number;
    exampleWeight: number;
    ruleWeight: number;
    skillWeight: number;
    cheatsheetWeight: number;
    maxResults: number;
  };
}

/** Persisted index snapshot */
export interface IndexSnapshot {
  version: number;
  builtAt: string;
  /** Relative path from project root (e.g. ./agent-skills-vrc-udon). */
  repositoryPath: string;
  documentCount: number;
  documents: IndexedDocument[];
  rules: Array<Omit<ValidationRule, 'pattern'> & { pattern: string }>;
}
