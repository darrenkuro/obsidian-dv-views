# CLAUDE.md

## Commands

```
pnpm install          # install dependencies
pnpm run dev          # watch mode
pnpm run build        # typecheck + production bundle
pnpm run lint         # eslint
```

No test suite — testing is manual in an Obsidian vault.

## Architecture

Obsidian plugin that acts as a **Dataview query preprocessor**. Registers a `dv` codeblock processor that transforms the query source, then delegates to Dataview's `api.execute()` for rendering.

This means Dataview handles all rendering (checkboxes, links, live-updating). This plugin only rewrites the query string.

### Key insight: `dvApi.execute()`

Dataview exposes `api.execute(source, el, component, filePath)` — the same method its own codeblock processor calls. Another plugin **cannot** intercept Dataview's `dataview` codeblock (processors are exclusive per language), but it **can** register its own language (`dv`) and delegate to Dataview after transforming the query.

### File structure

- `src/main.ts` — plugin entry, registers `dv` codeblock processor, query preprocessing logic
- `src/settings.ts` — settings interface, defaults, settings tab
- `src/views/` — reserved for future standalone DataviewJS views (next-tasks, etc.)

### How preprocessing works

1. User writes a `dv` codeblock with an alias (e.g., `QUOTE`, `BOOKMARK`) or `TASK`
2. Plugin checks if the first keyword matches an alias in settings
3. If alias: rewrites to `TASK` + injects `WHERE status = "<char>"` after any `FROM` clause
4. If `TASK`: injects `WHERE` clause excluding all configured NON_TASK status characters
5. Passes the transformed DQL string to `dvApi.execute()` — Dataview renders it

### Settings

- **excludedStatuses**: status chars to filter out of TASK queries (default: all NON_TASK chars from Tasks plugin)
- **respectDefer**: hide tasks with future `deferUntil` dates (global default)
- **onlyFirst**: show only first incomplete task per section (global default)
- **aliases**: map names to status chars (e.g., QUOTE → `"`, BOOKMARK → `b`)

### Dataview API access

Accessed at runtime via `app.plugins.plugins.dataview.api`. Not bundled — the API is available because Dataview is a peer dependency at runtime.

### Obsidian codeblock processor constraints

- `registerMarkdownCodeBlockProcessor` is **exclusive per language** — first processor to run consumes the `<pre><code>` element
- Dataview registers at sortOrder `-100` — cannot be intercepted
- No pre-processor API exists in Obsidian
- Only viable approach: register a **different** language and delegate to Dataview's API

## Release process

CI runs on tag push. Builds and uploads `manifest.json`, `main.js`, and `styles.css` to a draft GitHub release.

**Version must be bumped in both `manifest.json` and `package.json` before pushing.**

```bash
pnpm version patch   # bumps both files via version-bump.mjs
git push && git push --tags
```

## Vault testing

Installed via BRAT from `darrenkuro/obsidian-dv-views`. Push + tag → CI release → BRAT auto-updates.

## Adding a new view

1. Create `src/views/<name>.ts` exporting a render function
2. Register it in `src/main.ts` with `registerMarkdownCodeBlockProcessor` or integrate into the `dv` processor
3. Bump version
