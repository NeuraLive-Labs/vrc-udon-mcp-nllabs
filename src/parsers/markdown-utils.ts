import type { MarkdownTable } from '../types/index.js';

/**
 * Parses markdown tables preserving row/column structure.
 */
export function parseMarkdownTables(content: string): MarkdownTable[] {
  const tables: MarkdownTable[] = [];
  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? '';
    if (!line.includes('|')) {
      i++;
      continue;
    }

    const headerLine = line;
    const separatorLine = lines[i + 1] ?? '';
    if (!/^\|?[\s:-]+\|/.test(separatorLine) && !separatorLine.includes('---')) {
      i++;
      continue;
    }

    const headers = splitTableRow(headerLine);
    const rows: string[][] = [];
    i += 2;

    while (i < lines.length) {
      const rowLine = lines[i] ?? '';
      if (!rowLine.includes('|') || rowLine.trim().length === 0) break;
      rows.push(splitTableRow(rowLine));
      i++;
    }

    if (headers.length > 0 && rows.length > 0) {
      tables.push({
        headers,
        rows,
        lineStart: i - rows.length - 2,
      });
    }
  }

  return tables;
}

function splitTableRow(line: string): string[] {
  return line
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

/**
 * Extracts relative markdown links from content.
 */
export function extractRelativeLinks(content: string): string[] {
  const links: string[] = [];
  const linkPattern = /\[([^\]]*)\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = linkPattern.exec(content)) !== null) {
    const href = match[2];
    if (href && !href.startsWith('http') && !href.startsWith('#')) {
      links.push(href.replace(/^\.\//, ''));
    }
  }
  return links;
}

/**
 * Extracts image references from markdown.
 */
export function extractImages(content: string): string[] {
  const images: string[] = [];
  const imgPattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = imgPattern.exec(content)) !== null) {
    const src = match[2];
    if (src) images.push(src);
  }
  return images;
}

/**
 * Detects SDK version strings in content.
 */
export function extractSdkVersions(content: string): string[] {
  const versions = new Set<string>();
  const patterns = [
    /SDK\s*(?:Coverage)?:?\s*([\d.]+(?:\s*-\s*[\d.]+)?)/gi,
    /\b(3\.\d+(?:\.\d+)?)\b/g,
    /since\s+SDK\s+([\d.]+)/gi,
    /SDK\s*>=\s*([\d.]+)/gi,
    /SDK\s*<\s*([\d.]+)/gi,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      const raw = match[1];
      if (!raw) continue;
      if (raw.includes('-')) {
        raw.split('-').forEach((v) => {
          const trimmed = v.trim();
          if (/^3\.\d+/.test(trimmed)) versions.add(trimmed);
        });
      } else if (/^3\.\d+/.test(raw)) {
        versions.add(raw);
      }
    }
  }

  return [...versions].sort();
}

/**
 * Strips inline markdown formatting for search indexing.
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*_~>|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Creates URL-safe anchor from heading text.
 */
export function headingToAnchor(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}
