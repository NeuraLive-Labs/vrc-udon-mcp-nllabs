import type { AppConfig } from '../types/index.js';
import { getConfig } from '../config/index.js';
import { DocsRepository } from '../repositories/docs-repository.js';
import { SearchEngine, RankingService } from './search-engine.js';
import { RepositorySync } from './repository-sync.js';
import { FileWatcher } from './file-watcher.js';
import { SkillService } from './skill-service.js';
import { RuleService } from './rule-service.js';
import { TemplateService } from './template-service.js';
import { DocumentationService } from './documentation-service.js';
import { ValidationService } from './validation-service.js';
import { SdkService } from './sdk-service.js';

/**
 * Dependency injection container for all services.
 */
export class ServiceContainer {
  readonly config: AppConfig;
  readonly docsRepo: DocsRepository;
  readonly searchEngine: SearchEngine;
  readonly rankingService: RankingService;
  readonly skillService: SkillService;
  readonly ruleService: RuleService;
  readonly templateService: TemplateService;
  readonly documentationService: DocumentationService;
  readonly validationService: ValidationService;
  readonly sdkService: SdkService;
  readonly repositorySync: RepositorySync;
  private fileWatcher: FileWatcher | null = null;
  private initialized = false;

  constructor(config?: AppConfig) {
    this.config = config ?? getConfig();
    this.docsRepo = new DocsRepository(this.config.repository.path, this.config.indexPath);
    this.searchEngine = new SearchEngine(this.config.search);
    this.rankingService = new RankingService();
    this.skillService = new SkillService(this.docsRepo);
    this.ruleService = new RuleService(this.docsRepo);
    this.templateService = new TemplateService(this.docsRepo);
    this.documentationService = new DocumentationService(
      this.docsRepo,
      this.searchEngine,
      this.rankingService,
      this.config.sdkVersion,
    );
    this.validationService = new ValidationService(this.docsRepo);
    this.sdkService = new SdkService(this.docsRepo, this.searchEngine);
    this.repositorySync = new RepositorySync(this.config.repository);
  }

  /**
   * Initializes repository, builds search index, and starts file watcher.
   * On every start: clones docs if missing, else pulls (depth-1 fetch).
   * Sync failure logs to stderr and continues with existing local docs.
   */
  initialize(): void {
    if (this.initialized) return;

    const synced = this.syncDocumentation();

    if (synced) {
      this.docsRepo.rebuild();
    } else {
      this.docsRepo.load();
    }
    this.rebuildSearchIndex();

    if (this.config.watch) {
      this.fileWatcher = new FileWatcher(
        this.config.repository.path,
        this.docsRepo,
        () => this.rebuildSearchIndex(),
      );
      this.fileWatcher.start();
    }

    this.initialized = true;
  }

  /**
   * Clones or pulls agent-skills-vrc-udon on every MCP start.
   * Returns true when sync succeeded (caller should rebuild the index).
   * Errors go to stderr; startup continues so the MCP process does not crash.
   */
  private syncDocumentation(): boolean {
    const wasPresent = this.repositorySync.isPresent();
    console.error(
      wasPresent
        ? '[vrchat-udon-mcp] Syncing agent-skills-vrc-udon documentation…'
        : '[vrchat-udon-mcp] Documentation missing; cloning agent-skills-vrc-udon…',
    );

    const result = this.repositorySync.sync();
    if (!result.success) {
      console.error(`[vrchat-udon-mcp] Failed to sync docs: ${result.message}`);
      if (wasPresent) {
        console.error(
          '[vrchat-udon-mcp] Continuing with existing local documentation.',
        );
      } else {
        console.error(
          '[vrchat-udon-mcp] Run `pnpm update-docs` in a local checkout, or ensure git is available.',
        );
      }
      return false;
    }

    console.error(`[vrchat-udon-mcp] ${result.message}`);
    return true;
  }

  rebuildSearchIndex(): void {
    this.searchEngine.buildIndex(this.docsRepo.getSearchChunks());
  }

  shutdown(): void {
    this.fileWatcher?.stop();
    this.fileWatcher = null;
  }
}

let containerInstance: ServiceContainer | null = null;

export function getContainer(): ServiceContainer {
  if (!containerInstance) {
    containerInstance = new ServiceContainer();
    containerInstance.initialize();
  }
  return containerInstance;
}

export function resetContainer(): void {
  containerInstance?.shutdown();
  containerInstance = null;
}
