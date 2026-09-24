/**
 * Resolves paths relative to project root.
 */
export function resolveProjectPath(base: string, relative: string): string {
  return relative.startsWith('/') || /^[A-Za-z]:/.test(relative) ? relative : `${base}/${relative}`;
}

/**
 * Extracts line and column from a string offset.
 */
export function getLineColumn(text: string, offset: number): { line: number; column: number } {
  const before = text.slice(0, offset);
  const lines = before.split('\n');
  return { line: lines.length, column: (lines[lines.length - 1]?.length ?? 0) + 1 };
}

/**
 * Creates a text snippet around a match position.
 */
export function createSnippet(text: string, maxLength = 200): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength)}...`;
}

/**
 * Compares semantic version strings.
 * Returns negative if a < b, 0 if equal, positive if a > b.
 */
export function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/, '').split('.').map(Number);
  const pb = b.replace(/^v/, '').split('.').map(Number);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * Checks if a version is within range [min, max].
 */
export function isVersionInRange(version: string, min?: string, max?: string): boolean {
  if (min && compareVersions(version, min) < 0) return false;
  if (max && compareVersions(version, max) > 0) return false;
  return true;
}

/**
 * Formats JSON for MCP text responses.
 */
export function formatJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Extracts C# class name from UdonSharp code.
 */
export function extractClassName(code: string): string | undefined {
  const match = code.match(/class\s+(\w+)\s*:\s*UdonSharpBehaviour/);
  return match?.[1];
}

/**
 * Counts lines in source code.
 */
export function countLines(code: string): number {
  return code.split('\n').length;
}

/**
 * Escapes special regex characters.
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Converts PascalCase to readable text.
 */
export function pascalToReadable(str: string): string {
  return str.replace(/([A-Z])/g, ' $1').trim();
}
