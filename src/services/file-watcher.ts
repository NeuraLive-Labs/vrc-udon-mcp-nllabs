import { watch } from 'node:fs';
import type { FSWatcher } from 'node:fs';
import type { DocsRepository } from '../repositories/docs-repository.js';

export type IndexRebuildCallback = () => void;

/**
 * Watches repository for changes and triggers index rebuild.
 */
export class FileWatcher {
  private watcher: FSWatcher | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly debounceMs = 500;

  constructor(
    private readonly repoPath: string,
    private readonly docsRepo: DocsRepository,
    private readonly onRebuild: IndexRebuildCallback,
  ) {}

  start(): void {
    if (this.watcher) return;

    try {
      this.watcher = watch(this.repoPath, { recursive: true }, (_event, filename) => {
        if (!filename) return;
        if (filename.includes('.git')) return;
        this.scheduleRebuild(filename.replace(/\\/g, '/'));
      });
    } catch {
      // fs.watch recursive may fail on some platforms
    }
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  private scheduleRebuild(relativePath: string): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      try {
        this.docsRepo.reloadFile(relativePath);
      } catch {
        this.docsRepo.rebuild();
      }
      this.onRebuild();
    }, this.debounceMs);
  }
}
