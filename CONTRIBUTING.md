# Contribuir

## Commits en este repositorio

**No uses `git commit` desde el terminal integrado de Cursor.** Cursor puede envolver el comando e inyectar:

```text
Co-authored-by: Cursor <cursoragent@cursor.com>
```

y alterar el committer. Eso no está permitido en este proyecto.

### Cómo commitear

1. **Windows (PowerShell):**

   ```powershell
   .\scripts\commit-clean.ps1 "tipo: descripción del cambio"
   ```

2. **Git Bash / Linux / macOS:**

   ```bash
   chmod +x scripts/commit-clean.sh
   ./scripts/commit-clean.sh "tipo: descripción del cambio"
   ```

Los scripts usan `git commit-tree` con autor y committer explícitos (`MauDevVR` por defecto). Opcionalmente define `GIT_AUTHOR_NAME`, `GIT_AUTHOR_EMAIL`, `GIT_COMMITTER_NAME`, `GIT_COMMITTER_EMAIL` y `GIT_EXE` antes de ejecutarlos.

### Push

Usa el `git.exe` de Git for Windows o tu cliente habitual; evita wrappers que modifiquen metadatos del commit.

### Nota técnica

Git no ofrece un hook ni `.gitattributes` que bloquee trailers `Co-authored-by`. La política del repo es procedural: solo los scripts anteriores (o `commit-tree` manual con las mismas variables de entorno).
