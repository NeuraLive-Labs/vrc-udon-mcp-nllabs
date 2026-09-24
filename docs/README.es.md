# VRC Udon NLLabs

**NeuraLive Labs** · Udon MCP para VRChat

Servidor [Model Context Protocol (MCP)](https://modelcontextprotocol.io) que expone el repositorio [agent-skills-vrc-udon](https://github.com/niaka3dayo/agent-skills-vrc-udon) como interfaz MCP para el desarrollo UdonSharp en VRChat.

**El repositorio `agent-skills-vrc-udon` es la única fuente de verdad.** Este MCP no contiene documentación hardcodeada: indexa, busca y valida dinámicamente todo el contenido del repositorio.

[← Volver a la página principal](../README.md) · [English](README.en.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

---

## Índice

- [Características](#características)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Sincronización del repositorio](#sincronización-del-repositorio)
- [Uso](#uso)
- [Integración MCP](#integración-mcp)
- [Herramientas MCP](#herramientas-mcp)
- [Recursos MCP](#recursos-mcp)
- [Arquitectura](#arquitectura)
- [Scripts](#scripts)
- [Contribuir](#contribuir)
- [Créditos](#créditos)
- [Licencia](#licencia)

---

## Características

- **18 herramientas MCP** impulsadas por el repositorio de conocimiento
- **Recursos MCP dinámicos** (skills, rules, cheatsheets, templates, matriz SDK)
- Indexación recursiva de `skills/`, `rules/`, `references/`, `templates/`, `hooks/`, `assets/`
- Búsqueda MiniSearch con ranking: encabezado > título > cuerpo
- Validación de código desde reglas del repositorio (tablas + hooks)
- File watcher con reconstrucción automática del índice
- Sincronización git del repositorio remoto
- TypeScript estricto, Vitest, ESLint, Prettier

---

## Requisitos

| Dependencia | Versión |
|-------------|---------|
| **Node.js** | 22+ |
| **pnpm** | 9+ |
| **git** | versión reciente (para sincronizar documentación) |

---

## Instalación

```bash
git clone https://github.com/NeuraLive-Labs/vrc-udon-mcp-nllabs.git
cd vrchat-udon-mcp
pnpm install
pnpm update-docs    # Clona/actualiza agent-skills-vrc-udon
pnpm build-index    # Construye el índice de búsqueda
pnpm build
```

---

## Configuración

Edita `config.json` en la raíz del proyecto:

```json
{
  "repository": {
    "url": "https://github.com/niaka3dayo/agent-skills-vrc-udon",
    "path": "./agent-skills-vrc-udon",
    "branch": "main"
  },
  "sdkVersion": "3.10.4",
  "language": "es",
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

| Campo | Descripción |
|-------|-------------|
| `repository.url` | URL del repositorio fuente |
| `repository.path` | Ruta local del repositorio clonado |
| `repository.branch` | Rama a sincronizar |
| `sdkVersion` | Versión SDK por defecto para filtros |
| `watch` | Reconstruir índice al detectar cambios en el repo |
| `indexPath` | Carpeta del índice persistido |

También puedes usar la variable de entorno `UDON_MCP_CONFIG` para apuntar a otro archivo de configuración.

---

## Sincronización del repositorio

En **cada arranque** del MCP (Cursor/`npx` o `pnpm start`) el servidor sincroniza `agent-skills-vrc-udon` automáticamente: clona si falta, o hace un `git fetch --depth 1` + reset si ya existe. El fetch tiene un timeout corto (~30 s); si falla (red lenta u offline), el MCP sigue con la documentación local y registra el error en stderr. No hay throttle: se intenta actualizar en cada inicio.

```bash
# Clonar o actualizar agent-skills-vrc-udon y reconstruir índice (manual)
pnpm update-docs

# Solo reconstruir índice (sin git pull)
pnpm build-index
```

El repositorio se clona en `./agent-skills-vrc-udon` (configurable). Tras un sync exitoso se reconstruye el índice. `pnpm update-docs` sigue siendo útil en desarrollo local para forzar una actualización fuera del ciclo de arranque.

---

## Uso

```bash
pnpm start      # Inicia el servidor MCP (stdio)
pnpm dev        # Modo desarrollo con recarga
pnpm test       # Ejecuta tests Vitest
```

---

## Integración MCP

### Instalación rápida (Cursor)

[![Add to Cursor](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=vrchat-udon&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsImdpdGh1YjpOZXVyYUxpdmUtTGFicy92cmMtdWRvbi1tY3AtbmxsYWJzIl19)

Instalación en un clic: abre Cursor y añade la entrada portable `npx`. O escríbela en `~/.cursor/mcp.json` (o `%USERPROFILE%\.cursor\mcp.json` en Windows) sin borrar otros servidores:

```bash
npx -y github:NeuraLive-Labs/vrc-udon-mcp-nllabs -- install
```

Opcional: también Claude Desktop con `--claude`. Luego **Refresh MCP** en Cursor (solo si instalaste por CLI).

> **No uses rutas absolutas** como `C:\Users\tu-usuario\...` en la configuración MCP.
> No son portables entre equipos, exponen tu nombre de usuario y dejan de funcionar si mueves el proyecto.
> Prefiere rutas relativas al workspace, `npx` desde GitHub, o instalar el paquete globalmente.

Antes de conectar el MCP, ejecuta al menos una vez:

```bash
pnpm update-docs && pnpm build-index && pnpm build
```

### Opción A — Workspace local (`docs/mcp-config.example.json`)

Recomendada al desarrollar este repositorio. Copia [mcp-config.example.json](mcp-config.example.json) a la configuración MCP de tu IDE:

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

También puedes usar `"./dist/index.js"`; Cursor resuelve rutas relativas al workspace.

### Opción B — `npx` desde GitHub (sin clonar manualmente)

No requiere rutas locales. `npx` descarga el repo, ejecuta `prepare` (compila TypeScript) y lanza el binario:

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

Con pnpm: `pnpm dlx github:NeuraLive-Labs/vrc-udon-mcp-nllabs` (equivalente en terminal).

**Nota:** La primera ejecución compila el proyecto y puede tardar. En cada arranque el servidor clona o actualiza automáticamente `agent-skills-vrc-udon` junto al `config.json` empaquetado (caché de npx) y reconstruye el índice si el sync tiene éxito. Si el pull falla, usa la copia local ya existente. No hace falta `UDON_MCP_CONFIG` ni rutas personales.

### Opción C — Instalación global

```bash
git clone https://github.com/NeuraLive-Labs/vrc-udon-mcp-nllabs.git
cd vrchat-udon-mcp
pnpm install && pnpm update-docs && pnpm build-index && pnpm build
pnpm link --global
```

Configuración MCP (Cursor o Claude Desktop):

```json
{
  "mcpServers": {
    "vrchat-udon": {
      "command": "vrchat-udon-mcp"
    }
  }
}
```

Alternativa sin link global: `"command": "pnpm", "args": ["exec", "vrchat-udon-mcp"]` desde el directorio del repo.

### Opción D — Submodule en tu proyecto VRChat

Añade el MCP como submódulo y usa una ruta relativa al workspace de tu mundo:

```bash
git submodule add https://github.com/NeuraLive-Labs/vrc-udon-mcp-nllabs.git tools/vrchat-udon-mcp
cd tools/vrchat-udon-mcp && pnpm install && pnpm update-docs && pnpm build-index && pnpm build
```

En la configuración MCP de tu proyecto VRChat:

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

### Opción E — Dependencia git en tu proyecto

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

En **Cursor Settings → MCP**, pega cualquiera de las opciones anteriores. Evita rutas absolutas con tu usuario de Windows.

### Claude Desktop

En `%APPDATA%\Claude\claude_desktop_config.json` (Windows) o `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS), usa las opciones B, C o E. Para desarrollo local del repo, Opción A con ruta relativa al clone.

### ChatGPT Desktop

Configura un servidor MCP stdio con cualquiera de las opciones anteriores (evita rutas absolutas con tu usuario de Windows).

---

## Herramientas MCP

| Herramienta | Descripción |
|-------------|-------------|
| `search_documentation` | Búsqueda keyword/fuzzy en toda la documentación |
| `explain_topic` | Explicación con citas (path, heading, líneas) |
| `list_skills` | Descubre skills automáticamente |
| `read_skill` | Lee SKILL.md con metadata, rules, references, templates |
| `list_rules` | Lista reglas UdonSharp |
| `read_rule` | Lee regla con constraints y ejemplos |
| `search_reference` | Busca en `references/` |
| `list_templates` | Lista plantillas `.cs` |
| `get_template` | Obtiene plantilla con código completo |
| `validate_code` | Valida código con reglas del repositorio |
| `explain_validation` | Explica fallo citando la regla fuente |
| `sdk_matrix` | Matriz de versiones SDK desde `templates/AGENTS.md` |
| `search_sdk_feature` | Busca features (NetworkCallable, PlayerData, etc.) |
| `search_constraints` | Busca restricciones (List, Coroutine, etc.) |
| `search_networking` | Busca temas de networking y sync |
| `search_examples` | Busca ejemplos de código |
| `search_best_practice` | Busca patrones recomendados |
| `search_antipattern` | Busca anti-patrones |

---

## Recursos MCP

| URI | Contenido |
|-----|-----------|
| `udon://skills/{id}` | SKILL.md de cada skill |
| `udon://rules/{id}` | Archivos de reglas |
| `udon://sdk/matrix` | Matriz de versiones SDK |
| `udon://templates/index` | Índice de plantillas |
| `udon://cheatsheet/{id}` | CHEATSHEET.md por skill |

---

## Arquitectura

```
agent-skills-vrc-udon/     ← Fuente de verdad (git clone)
        ↓
KnowledgeParser            ← Indexa recursivamente todos los archivos
        ↓
DocsRepository             ← Persiste índice en data/indexes/
        ↓
SearchEngine (MiniSearch)  ← Búsqueda con ranking ponderado
RuleParser                 ← Reglas desde hooks/ y tablas rules/
        ↓
MCP Tools (18)             ← Interfaz para el agente IA
```

---

## Scripts

| Script | Descripción |
|--------|-------------|
| `pnpm build` | Compila TypeScript |
| `pnpm start` | Inicia servidor MCP |
| `pnpm test` | Tests Vitest |
| `pnpm update-docs` | git clone/pull del repositorio fuente |
| `pnpm build-index` | Reconstruye índice de búsqueda |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier |

---

## Contribuir

Cualquier fork y ayuda son bienvenidos. Ver [CONTRIBUTING.md](../CONTRIBUTING.md) para las pautas.

---

## Créditos

- Documentación y skills: [niaka3dayo/agent-skills-vrc-udon](https://github.com/niaka3dayo/agent-skills-vrc-udon)
- Servidor MCP: [NeuraLive-Labs/vrc-udon-mcp-nllabs](https://github.com/NeuraLive-Labs/vrc-udon-mcp-nllabs)

---

## Licencia

MIT
