/**
 * Syncs agent-skills-vrc-udon repository via git clone/pull.
 * Run: pnpm update-docs
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../src/config/loader.js';
import { RepositorySync } from '../src/services/repository-sync.js';
import { DocsRepository } from '../src/repositories/docs-repository.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const config = loadConfig(join(__dirname, '../config.json'));
  const sync = new RepositorySync(config.repository);

  console.log(`Syncing ${config.repository.url} → ${config.repository.path}`);
  const result = sync.sync();

  if (!result.success) {
    console.error(`✗ ${result.message}`);
    process.exit(1);
  }

  console.log(`✓ ${result.message}`);

  const repo = new DocsRepository(config.repository.path, config.indexPath);
  const documents = repo.rebuild();
  console.log(`✓ Rebuilt index: ${documents.length} documents`);
  console.log('Run `pnpm build-index` to verify the search index.');
}

main().catch(console.error);
