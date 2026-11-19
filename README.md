# @dephub/layer 🧱

> A tiny builder for transforming source content into typed, validated, and cache-aware layers — with first-class CLI, watcher, and programmatic APIs.

[![NPM version](https://img.shields.io/npm/v/@dephub/layer.svg?style=flat)](https://npmjs.org/package/@dephub/layer)
[![ESM-only](https://img.shields.io/badge/ESM-only-brightgreen?style=flat)](https://nodejs.org/)

## Features ✨

- 🏗️ **Builder API** — Resolve, parse, validate, and write content in one pass.
- 🛡️ **Schema validation** — Optional per-group schema validation powered by `@dephub/schema`.
- 🔁 **Transformers** — Fully-typed per-group data transforms after validation.
- ⚡ **Incremental builds** — mtime + config-hash caching skips unchanged files.
- 👀 **Watch mode** — Debounced file watcher rebuilds automatically on change.
- 🧩 **CLI & API** — Ships with a ready-to-use CLI (`build` / `b`) and composable functions.
- 🪝 **Post-build tasks** — Async hooks receive the full build context (e.g. for manifests).

---

## Installation 📦

- npm: `npm install @dephub/layer`
- pnpm: `pnpm add @dephub/layer`
- yarn: `yarn add @dephub/layer`
- bun: `bun add @dephub/layer`

---

## Usage 🎯

### CLI 💻

```sh
# Build from the default config (layer.config.ts) and content directory
npx layer build

# Build a specific content directory
npx layer build ./content

# Filter by document type, custom output dir, exclude folders
npx layer build -d Service -o ./dist/services -e drafts temp

# Watch for changes
npx layer build -w

# Use a custom config file
npx layer build -c ./config/layer.config.ts

# Silent mode (errors still shown)
npx layer build -s
```

**Config file** — `layer.config.ts`:

```ts
import { defineConfig } from '@dephub/layer/config';

export default defineConfig({
  contentDir: './content',
  outDir: '.layer',
  exclude: ['_drafts'],
});
```

### API 🧩

```ts
// Use the CLI programmatically
import { useCli } from '@dephub/layer';
import { readFile } from '@dephub/read';

await useCli({
  defaultConfigPath: 'layer.config.ts',
  defaultOutDir: '.layer',
  description: 'Build documentation content',
  name: 'my-docs',
  outExtension: '.json',
  pattern: '**/*.json',
  parser: async (entry) => JSON.parse(await readFile(entry)),
  version: '1.0.0',
});
```

```ts
// Or compose the builder / watcher directly
import { useBuilder, useWatcher } from '@dephub/layer';
import { readFile } from '@dephub/read';
import { s } from '@dephub/schema';

//builder
const builder = await useBuilder({
  defaultOutDir: '.layer',
  name: 'my-docs',
  outExtension: '.json',
  parser: async (entry) => JSON.parse(await readFile(entry)),
  pattern: '**/*.json',
  tasks: [async (ctx) => console.log('Built!', ctx.importsMap)],
  version: '1.0.0',
});

await builder({
  contentDir: './content',
  schemas: {
    es: s.object({ title: s.string() }),
    en: s.object({ title: s.string() }),
  },
  transformers: {
    es: (data) => ({ ...data, lang: 'es' }),
    en: (data) => ({ ...data, lang: 'en' }),
  },
});

// watcher
const watcher = await useWatcher({
  defaultOutDir: '.layer',
  name: 'my-docs',
  outExtension: '.json',
  parser: async (entry) => JSON.parse(await readFile(entry)),
  pattern: '**/*.json',
  tasks: [async (ctx) => console.log('Built!', ctx.importsMap)],
  version: '1.0.0',
});

await watcher({
  contentDir: './content',
  schemas: {
    es: s.object({ title: s.string() }),
    en: s.object({ title: s.string() }),
  },
  transformers: {
    es: (data) => ({ ...data, lang: 'es' }),
    en: (data) => ({ ...data, lang: 'en' }),
  },
});
```

### Available exports

| Category   | Functions                                                                                            |
| ---------- | ---------------------------------------------------------------------------------------------------- |
| **Core**   | `useBuilder`, `useWatcher`, `useCli`                                                                 |
| **Config** | `defineConfig`                                                                                       |
| **Types**  | `Builder`, `BuilderConfig`, `BuilderContext`, `CliConfig`, `LayerConfig`, `Watcher`, `WatcherConfig` |

---

## 📁 Folder Structure

```text
content/
├── es.json
├── en.json
```

## 📁 Output Structure

```text
.layer/
├── cache/
│   └── timestamp.json
├── es.json
└── en.json
```

---

## License 📄

MIT License – see [LICENSE](LICENSE) for details.

**Author:** Estarlin R ([estarlincito.com](https://estarlincito.com))
