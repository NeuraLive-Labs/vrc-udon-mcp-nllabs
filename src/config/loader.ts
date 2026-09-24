import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AppConfig } from '../types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_CONFIG_PATH = resolve(__dirname, '../../config.json');

/**
 * Loads application configuration from config.json with defaults.
 */
export function loadConfig(configPath?: string): AppConfig {
  const path = configPath ?? process.env.UDON_MCP_CONFIG ?? DEFAULT_CONFIG_PATH;
  const rootDir = resolve(dirname(path));

  if (!existsSync(path)) {
    return getDefaultConfig(rootDir);
  }

  const raw = JSON.parse(readFileSync(path, 'utf-8')) as Partial<AppConfig>;
  const defaults = getDefaultConfig(rootDir);

  return {
    repository: {
      url: raw.repository?.url ?? defaults.repository.url,
      path: resolve(rootDir, raw.repository?.path ?? defaults.repository.path),
      branch: raw.repository?.branch ?? defaults.repository.branch,
    },
    sdkVersion: raw.sdkVersion ?? defaults.sdkVersion,
    language: raw.language ?? defaults.language,
    watch: raw.watch ?? defaults.watch,
    indexPath: resolve(rootDir, raw.indexPath ?? defaults.indexPath),
    search: {
      fuzzy: raw.search?.fuzzy ?? defaults.search.fuzzy,
      headingWeight: raw.search?.headingWeight ?? defaults.search.headingWeight,
      titleWeight: raw.search?.titleWeight ?? defaults.search.titleWeight,
      exampleWeight: raw.search?.exampleWeight ?? defaults.search.exampleWeight,
      ruleWeight: raw.search?.ruleWeight ?? defaults.search.ruleWeight,
      skillWeight: raw.search?.skillWeight ?? defaults.search.skillWeight,
      cheatsheetWeight: raw.search?.cheatsheetWeight ?? defaults.search.cheatsheetWeight,
      maxResults: raw.search?.maxResults ?? defaults.search.maxResults,
    },
  };
}

function getDefaultConfig(rootDir: string): AppConfig {
  return {
    repository: {
      url: 'https://github.com/niaka3dayo/agent-skills-vrc-udon',
      path: resolve(rootDir, 'agent-skills-vrc-udon'),
      branch: 'main',
    },
    sdkVersion: '3.10.4',
    language: 'es',
    watch: true,
    indexPath: resolve(rootDir, 'data/indexes'),
    search: {
      fuzzy: 0.2,
      headingWeight: 3.0,
      titleWeight: 2.5,
      exampleWeight: 1.5,
      ruleWeight: 2.0,
      skillWeight: 2.5,
      cheatsheetWeight: 2.5,
      maxResults: 20,
    },
  };
}

let configInstance: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!configInstance) {
    configInstance = loadConfig();
  }
  return configInstance;
}

export function resetConfig(): void {
  configInstance = null;
}
