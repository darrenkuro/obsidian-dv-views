# obsidian-dv-views — Implementation Plan

## Core Concept

Dataview query preprocessor plugin. Registers a `dv` codeblock language that transforms queries then delegates to `dvApi.execute()`. Dataview does all rendering.

## Architecture Decisions

- **Cannot intercept Dataview's codeblock** — Obsidian codeblock processors are exclusive per language. Dataview registers at sortOrder -100.
- **Use `dvApi.execute()`** — the same internal method Dataview calls. Our plugin is just a thin transform layer.
- **Settings-driven aliases** — map names (QUOTE, BOOKMARK) to status chars, configurable in settings tab.
- **Excluded statuses** — replaces `status.type is not NON_TASK` from Tasks plugin with a Dataview-native filter.

## Tasks

- [x] Scaffold project (manifest, package.json, tsconfig, esbuild, CI)
- [x] Create src/main.ts with `dv` codeblock processor
- [x] Create src/settings.ts with settings tab (excluded statuses, aliases, global defaults)
- [x] Symlink to vault for dev testing
- [x] Create CLAUDE.md
- [ ] Fix build — resolve tsc errors (Component vs MarkdownRenderChild, Object.entries lib)
- [ ] Test basic alias expansion (QUOTE → TASK WHERE status = '"')
- [ ] Test TASK with excluded statuses filter
- [ ] Test DQL passthrough (FROM, WHERE, SORT after alias)
- [ ] Add `respectDefer` filter to preprocessor (currently only in settings, not wired)
- [ ] Add `onlyFirst` filter (first incomplete per section — needs DataviewJS, not pure DQL)
- [ ] Handle `dataview:refresh-views` event for live re-rendering
- [ ] README
- [ ] First release via BRAT

## Future Views (src/views/)

- `next-tasks` — standalone DataviewJS view: first incomplete task per section, defer filter, file link inline
- More as needed

## Notes

- `respectDefer` and `onlyFirst` can't be pure DQL transforms — they need DataviewJS logic. Options:
  1. Register a separate `dv-tasks` codeblock that uses DataviewJS instead of DQL
  2. Detect these flags in config and switch from `api.execute()` to custom JS rendering
  3. Keep them as separate `dv.view()`-style views in src/views/
- The `%%` comment trick for hiding inline fields (deferUntil, created) works with Dataview — it's a bug in Obsidian's Properties panel (#2158), not in Dataview parsing.
