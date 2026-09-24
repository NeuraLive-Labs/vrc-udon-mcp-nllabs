/**
 * Rebuilds search indexes from agent-skills-vrc-udon repository.
 * Run: pnpm build-index
 */
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../src/config/loader.js';
import { DocsRepository } from '../src/repositories/docs-repository.js';
import { SearchEngine } from '../src/services/search-engine.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const config = loadConfig(join(__dirname, '../config.json'));
  mkdirSync(config.indexPath, { recursive: true });

  const repo = new DocsRepository(config.repository.path, config.indexPath);
  const documents = repo.rebuild();
  const chunks = repo.getSearchChunks();

  const search = new SearchEngine(config.search);
  search.buildIndex(chunks);

  const fileTypes = [...new Set(documents.map((d) => d.fileType))];
  console.log(`✓ Indexed ${documents.length} documents (${chunks.length} search chunks)`);
  console.log(`✓ Index saved to ${config.indexPath}`);
  console.log(`✓ Repository: ${config.repository.path}`);
  console.log('File types:', fileTypes.join(', '));
  console.log(`✓ Validation rules: ${repo.getRules().length}`);
}

main().catch(console.error);
