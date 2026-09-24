# VRC Udon NLLabs

**NeuraLive Labs** · Udon MCP pour VRChat

Serveur [Model Context Protocol (MCP)](https://modelcontextprotocol.io) qui expose le dépôt [agent-skills-vrc-udon](https://github.com/niaka3dayo/agent-skills-vrc-udon) comme interface MCP pour le développement UdonSharp sur VRChat.

**Le dépôt `agent-skills-vrc-udon` est la seule source de vérité.** Ce MCP ne contient aucune documentation en dur : il indexe, recherche et valide dynamiquement tout le contenu du dépôt distant.

[← Page d'accueil](../README.md) · [English](README.en.md) · [Español](README.es.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

---

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Synchronisation du dépôt](#synchronisation-du-dépôt)
- [Utilisation](#utilisation)
- [Intégration MCP](#intégration-mcp)
- [Outils MCP](#outils-mcp)
- [Ressources MCP](#ressources-mcp)
- [Architecture](#architecture)
- [Scripts](#scripts)
- [Crédits](#crédits)
- [Licence](#licence)

---

## Fonctionnalités

- **18 outils MCP** alimentés par le dépôt de connaissances
- **Ressources MCP dynamiques** — skills, règles, cheatsheets, templates, matrice SDK
- Indexation récursive de `skills/`, `rules/`, `references/`, `templates/`, `hooks/`, `assets/`
- Recherche MiniSearch avec pondération : titre de section > titre > corps
- Validation de code à partir des règles du dépôt (tableaux + hooks)
- File watcher avec reconstruction automatique de l'index
- Synchronisation git du dépôt de documentation
- TypeScript strict, Vitest, ESLint, Prettier

---

## Prérequis

| Dépendance | Version |
|------------|---------|
| **Node.js** | 22+ |
| **pnpm** | 9+ |
| **git** | version récente (sync doc) |

---

## Installation

```bash
git clone https://github.com/NeuraLive-Labs/vrc-udon-mcp-nllabs.git
cd vrchat-udon-mcp
pnpm install
pnpm update-docs    # Clone / met à jour agent-skills-vrc-udon
pnpm build-index    # Construit l'index de recherche
pnpm build
```

---

## Configuration

Modifiez `config.json` à la racine du projet :

```json
{
  "repository": {
    "url": "https://github.com/niaka3dayo/agent-skills-vrc-udon",
    "path": "./agent-skills-vrc-udon",
    "branch": "main"
  },
  "sdkVersion": "3.10.4",
  "language": "fr",
  "watch": true,
  "indexPath": "./data/indexes",
  "search": {
    "fuzzy": 0.2,
    "headingWeight": 3.0,
    "titleWeight": 2.5,
    "exampleWeight": 1.5,
    "ruleWeight": 2.0,
    "skillWeight": 2.5,
    "cheatsheetWeight": 2.5,
    "maxResults": 20
  }
}
```

| Champ | Description |
|-------|-------------|
| `repository.url` | URL du dépôt source |
| `repository.path` | Chemin local du clone |
| `repository.branch` | Branche à synchroniser |
| `sdkVersion` | Version SDK par défaut pour les filtres |
| `watch` | Reconstruire l'index à chaque modification |
| `indexPath` | Dossier de l'index persisté |

La variable d'environnement `UDON_MCP_CONFIG` permet de pointer vers un autre fichier de configuration.

---

## Synchronisation du dépôt

```bash
# Cloner ou mettre à jour agent-skills-vrc-udon et reconstruire l'index
pnpm update-docs

# Reconstruire l'index uniquement (sans git pull)
pnpm build-index
```

Le dépôt est cloné dans `./agent-skills-vrc-udon` par défaut. Les nouveaux fichiers sont indexés automatiquement, sans modification du code.

---

## Utilisation

```bash
pnpm start      # Démarre le serveur MCP (stdio)
pnpm dev        # Mode développement avec rechargement
pnpm test       # Lance les tests Vitest
```

---

## Intégration MCP

> **N'utilisez pas de chemins absolus** du type `C:\Users\votre-nom\...` dans la config MCP.
> Ils ne sont pas portables, exposent votre nom d'utilisateur et cassent si vous déplacez le projet.
> Préférez les chemins relatifs au workspace, `npx` depuis GitHub, ou une installation globale.

Avant de connecter le MCP, exécutez au moins une fois :

```bash
pnpm update-docs && pnpm build-index && pnpm build
```

### Option A — Workspace local (`docs/mcp-config.example.json`)

Recommandé pour développer ce dépôt. Copiez [mcp-config.example.json](mcp-config.example.json) dans les paramètres MCP de votre IDE :

```json
{
  "mcpServers": {
    "vrchat-udon": {
      "command": "node",
      "args": ["${workspaceFolder}/dist/index.js"]
    }
  }
}
```

`"./dist/index.js"` fonctionne aussi — Cursor résout les chemins relatifs au workspace.

### Option B — `npx` depuis GitHub (sans clone manuel)

Aucun chemin local requis. `npx` télécharge le dépôt, exécute `prepare` (compile TypeScript) et lance le binaire :

```json
{
  "mcpServers": {
    "vrchat-udon": {
      "command": "npx",
      "args": ["-y", "github:NeuraLive-Labs/vrc-udon-mcp-nllabs"]
    }
  }
}
```

Avec pnpm : `pnpm dlx github:NeuraLive-Labs/vrc-udon-mcp-nllabs`.

**Note :** La première exécution compile le projet et peut prendre du temps. La documentation indexée reste nécessaire — `npx` ne clone pas `agent-skills-vrc-udon` automatiquement. Lancez `pnpm update-docs` si vous avez cloné le repo, ou configurez `UDON_MCP_CONFIG` vers un `config.json` avec la doc déjà synchronisée.

### Option C — Installation globale

```bash
git clone https://github.com/NeuraLive-Labs/vrc-udon-mcp-nllabs.git
cd vrchat-udon-mcp
pnpm install && pnpm update-docs && pnpm build-index && pnpm build
pnpm link --global
```

```json
{
  "mcpServers": {
    "vrchat-udon": {
      "command": "vrchat-udon-mcp"
    }
  }
}
```

Sans link global : `"command": "pnpm", "args": ["exec", "vrchat-udon-mcp"]` depuis le dossier du repo.

### Option D — Sous-module git dans votre projet VRChat

```bash
git submodule add https://github.com/NeuraLive-Labs/vrc-udon-mcp-nllabs.git tools/vrchat-udon-mcp
cd tools/vrchat-udon-mcp && pnpm install && pnpm update-docs && pnpm build-index && pnpm build
```

```json
{
  "mcpServers": {
    "vrchat-udon": {
      "command": "node",
      "args": ["${workspaceFolder}/tools/vrchat-udon-mcp/dist/index.js"]
    }
  }
}
```

### Option E — Dépendance git

```bash
pnpm add github:NeuraLive-Labs/vrc-udon-mcp-nllabs
```

```json
{
  "mcpServers": {
    "vrchat-udon": {
      "command": "npx",
      "args": ["vrchat-udon-mcp"]
    }
  }
}
```

### Cursor

**Cursor Settings → MCP** — collez l'une des options ci-dessus. Évitez les chemins absolus Windows.

### Claude Desktop

Windows : `%APPDATA%\Claude\claude_desktop_config.json`  
macOS : `~/Library/Application Support/Claude/claude_desktop_config.json`

Options B, C ou E en production ; option A pour le développement local.

### ChatGPT Desktop

Configurez un serveur MCP stdio avec l'une des options ci-dessus (évitez les chemins absolus avec votre nom d'utilisateur Windows).

---

## Outils MCP

| Outil | Description |
|-------|-------------|
| `search_documentation` | Recherche mot-clé / floue sur toute la documentation |
| `explain_topic` | Explication avec citations (chemin, section, numéros de ligne) |
| `list_skills` | Découverte automatique des skills |
| `read_skill` | Lit SKILL.md avec métadonnées, règles, références, templates |
| `list_rules` | Liste les règles UdonSharp |
| `read_rule` | Lit une règle avec contraintes et exemples |
| `search_reference` | Recherche dans `references/` |
| `list_templates` | Liste les templates `.cs` |
| `get_template` | Récupère un template avec le code source complet |
| `validate_code` | Valide le code selon les règles du dépôt |
| `explain_validation` | Explique un échec en citant la règle source |
| `sdk_matrix` | Matrice des versions SDK depuis `templates/AGENTS.md` |
| `search_sdk_feature` | Recherche de fonctionnalités (NetworkCallable, PlayerData, etc.) |
| `search_constraints` | Recherche de contraintes (List, Coroutine, etc.) |
| `search_networking` | Réseau et synchronisation |
| `search_examples` | Recherche d'exemples de code |
| `search_best_practice` | Patterns recommandés |
| `search_antipattern` | Anti-patterns à éviter |

---

## Ressources MCP

| URI | Contenu |
|-----|---------|
| `udon://skills/{id}` | SKILL.md de chaque skill |
| `udon://rules/{id}` | Fichiers de règles |
| `udon://sdk/matrix` | Matrice des versions SDK |
| `udon://templates/index` | Index des templates |
| `udon://cheatsheet/{id}` | CHEATSHEET.md par skill |

---

## Architecture

```
agent-skills-vrc-udon/     ← Source de vérité (git clone)
        ↓
KnowledgeParser            ← Indexe récursivement tous les fichiers
        ↓
DocsRepository             ← Persiste l'index dans data/indexes/
        ↓
SearchEngine (MiniSearch)  ← Recherche avec pondération
RuleParser                 ← Règles depuis hooks/ et tableaux rules/
        ↓
MCP Tools (18)             ← Interface pour l'agent IA
```

---

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm build` | Compile TypeScript |
| `pnpm start` | Démarre le serveur MCP |
| `pnpm test` | Tests Vitest |
| `pnpm update-docs` | git clone / pull du dépôt source |
| `pnpm build-index` | Reconstruit l'index de recherche |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier |

---

## Crédits

- Documentation et skills : [niaka3dayo/agent-skills-vrc-udon](https://github.com/niaka3dayo/agent-skills-vrc-udon)
- Serveur MCP : [NeuraLive-Labs/vrc-udon-mcp-nllabs](https://github.com/NeuraLive-Labs/vrc-udon-mcp-nllabs)

---

## Licence

MIT
