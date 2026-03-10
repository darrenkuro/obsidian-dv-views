<h1 align="center">DV Views</h1>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/obsidian-%3E%3D1.5.7-7c3aed" alt="Obsidian">
</p>

> Custom Dataview-powered codeblock preprocessor for Obsidian. Define aliases for filtered TASK queries.

> **Note:** This plugin is built for personal use. I'm unlikely to accept pull requests or feature requests.

---

## Overview

DV Views registers a `dv` codeblock processor that intercepts queries before they reach Dataview. It rewrites alias keywords (like `QUOTE` or `BOOKMARK`) into full `TASK` queries filtered by checkbox status character, and automatically excludes configurable statuses from plain `TASK` blocks.

## Features

- **Aliases** -- map keywords to status characters (e.g. `QUOTE` -> `["]`, `BOOKMARK` -> `[b]`, `STAR` -> `[*]`)
- **Excluded statuses** -- plain `TASK` queries automatically filter out toggled status characters
- **Settings tab** -- add/remove aliases, toggle excluded statuses, configure global defaults
- **Pass-through** -- unrecognized queries are forwarded to Dataview unchanged

## Usage

Write a fenced `dv` codeblock using an alias or a standard Dataview query:

````markdown
```dv
QUOTE
FROM "Daily Notes"
```
````

This expands to:

```
TASK
FROM "Daily Notes"
WHERE status = "\""
```

Plain `TASK` queries have excluded statuses injected automatically:

````markdown
```dv
TASK
FROM "Projects"
```
````

## Installation

Install via [BRAT](https://github.com/TfTHacker/obsidian42-brat):

1. Open BRAT settings in Obsidian
2. **Add Beta Plugin** with the repo `darrenkuro/obsidian-dv-views`
3. Enable the plugin in Community Plugins

---

## License

[MIT](LICENSE) - Darren Kuro
