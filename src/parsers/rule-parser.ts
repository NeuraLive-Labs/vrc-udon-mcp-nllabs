import type { IndexedDocument, ValidationRule, Severity } from '../types/index.js';
import { stripMarkdown } from './markdown-utils.js';

/**
 * Extracts validation rules from repository hook scripts and rule documents.
 */
export class RuleParser {
  /**
   * Builds validation rules from all indexed documents.
   */
  parseRules(documents: IndexedDocument[]): ValidationRule[] {
    const rules: ValidationRule[] = [];
    const seen = new Set<string>();

    for (const doc of documents) {
      if (doc.fileType === 'hook') {
        rules.push(...this.parseHookFile(doc, seen));
      }
      if (doc.fileType === 'rule' || doc.path.endsWith('constraints.md')) {
        rules.push(...this.parseConstraintTables(doc, seen));
      }
    }

    return rules;
  }

  private parseHookFile(doc: IndexedDocument, seen: Set<string>): ValidationRule[] {
    const rules: ValidationRule[] = [];
    const pattern = /\$FileContent\s+-match\s+'([^']+)'[\s\S]*?\$Warnings\s*\+=\s*"\[UdonSharp\]\s*(\w+):\s*([^"]+)"/g;
    let match: RegExpExecArray | null;
    let ruleIndex = 0;

    while ((match = pattern.exec(doc.content)) !== null) {
      const regexStr = match[1];
      const severityLabel = match[2]?.toUpperCase() ?? 'WARNING';
      const message = match[3]?.trim() ?? '';
      if (!regexStr || !message) continue;

      const severity = this.mapSeverity(severityLabel);
      const id = `hook-${doc.path}-${ruleIndex++}`;
      if (seen.has(id)) continue;
      seen.add(id);

      try {
        rules.push({
          id,
          name: `hook:${basename(doc.path)}`,
          pattern: new RegExp(regexStr, 'm'),
          severity,
          message,
          sourcePath: doc.path,
          sourceLine: this.lineAtOffset(doc.content, match.index),
          category: 'hook',
        });
      } catch {
        // Invalid regex in hook - skip
      }
    }

    return rules;
  }

  private parseConstraintTables(doc: IndexedDocument, seen: Set<string>): ValidationRule[] {
    const rules: ValidationRule[] = [];

    for (const table of doc.tables) {
      const featureIdx = this.findColumnIndex(table.headers, ['feature', 'never do this', '#']);
      const altIdx = this.findColumnIndex(table.headers, ['alternative', 'use instead', 'use']);
      const whyIdx = this.findColumnIndex(table.headers, ['why', 'why it fails']);

      if (featureIdx < 0 || !table.headers.some((h) => h.toLowerCase().includes('alternative'))) {
        continue;
      }

      for (let rowIdx = 0; rowIdx < table.rows.length; rowIdx++) {
        const row = table.rows[rowIdx];
        if (!row) continue;
        const feature = row[featureIdx]?.trim();
        if (!feature || feature === '---' || /^\d+$/.test(feature)) continue;

        const alternative = altIdx >= 0 ? row[altIdx]?.trim() : undefined;
        const why = whyIdx >= 0 ? row[whyIdx]?.trim() : undefined;
        const patterns = this.featureToPatterns(feature);
        const lineStart = table.lineStart + rowIdx + 2;

        for (let p = 0; p < patterns.length; p++) {
          const patternStr = patterns[p];
          if (!patternStr) continue;
          const id = `table-${doc.path}-${lineStart}-${p}`;
          if (seen.has(id)) continue;
          seen.add(id);

          try {
            rules.push({
              id,
              name: `constraint:${stripMarkdown(feature).slice(0, 40)}`,
              pattern: new RegExp(patternStr, 'm'),
              severity: doc.fileType === 'skill' ? 'error' : 'error',
              message: why
                ? `${stripMarkdown(feature)} — ${stripMarkdown(why)}`
                : `${stripMarkdown(feature)} is not supported in UdonSharp`,
              ...(alternative ? { suggestion: stripMarkdown(alternative) } : {}),
              sourcePath: doc.path,
              sourceLine: lineStart,
              category: 'constraint',
            });
          } catch {
            // Skip invalid pattern
          }
        }
      }
    }

    return rules;
  }

  private featureToPatterns(feature: string): string[] {
    const patterns: string[] = [];
    const backtickTerms = feature.match(/`([^`]+)`/g);
    if (backtickTerms) {
      for (const term of backtickTerms) {
        const cleaned = term.replace(/`/g, '').trim();
        if (cleaned.length > 0 && cleaned.length < 60) {
          patterns.push(this.termToRegex(cleaned));
        }
      }
    }
    return patterns;
  }

  private termToRegex(term: string): string {
    const escaped = term
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\\<T\\>/g, '<[^>]+>')
      .replace(/\\<T,\s*K\\>/g, '<[^>]+>')
      .replace(/\\<TKey,\s*TValue\\>/g, '<[^>]+>');
    return escaped;
  }

  private findColumnIndex(headers: string[], candidates: string[]): number {
    const normalized = headers.map((h) => h.toLowerCase().trim());
    for (const candidate of candidates) {
      const idx = normalized.findIndex((h) => h.includes(candidate));
      if (idx >= 0) return idx;
    }
    return -1;
  }

  private mapSeverity(label: string): Severity {
    if (label.includes('BLOCKED') || label.includes('ERROR')) return 'error';
    if (label.includes('WARNING') || label.includes('SYNC-BLOAT')) return 'warning';
    return 'info';
  }

  private lineAtOffset(content: string, offset: number): number {
    return content.slice(0, offset).split('\n').length;
  }
}

function basename(path: string): string {
  return path.split(/[/\\]/).pop() ?? path;
}
