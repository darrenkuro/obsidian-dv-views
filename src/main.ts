import { Component, Plugin } from "obsidian";
import { DEFAULT_SETTINGS, DvViewsSettings, DvViewsSettingTab } from "./settings";

interface DataviewApi {
	execute: (source: string, el: HTMLElement, component: Component, filePath: string) => Promise<void>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	pages: (query?: string) => any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	date: (input: string) => any;
	fileLink: (path: string, embed?: boolean, display?: string) => unknown;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	taskList: (tasks: any, groupByFile: boolean, el: HTMLElement, component: Component) => Promise<void>;
}

const getDataviewApi = (plugin: Plugin): DataviewApi | undefined =>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(plugin.app as any).plugins?.plugins?.dataview?.api as DataviewApi | undefined;

export default class DvViewsPlugin extends Plugin {
	settings: DvViewsSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new DvViewsSettingTab(this.app, this));

		// Register the `dv` codeblock processor — preprocesses then delegates to Dataview
		this.registerMarkdownCodeBlockProcessor("dv", async (source, el, ctx) => {
			const api = getDataviewApi(this);
			if (!api) {
				el.createEl("p", { text: "Dataview plugin is not available." });
				return;
			}

			const transformed = this.preprocessQuery(source);
			const component = new Component();
			ctx.addChild(component);
			await api.execute(transformed, el, component, ctx.sourcePath);
		});
	}

	preprocessQuery(source: string): string {
		const lines = source.trim().split("\n");
		if (lines.length === 0) return source;

		const firstLine = lines[0].trim();

		// Check if first line matches an alias (e.g., QUOTE, BOOKMARK)
		// Aliases can be standalone or followed by DQL clauses on subsequent lines
		const aliasMatch = firstLine.match(/^(\w+)(.*)$/);
		if (aliasMatch) {
			const keyword = aliasMatch[1].toUpperCase();
			const remainder = aliasMatch[2].trim();

			if (keyword in this.settings.aliases) {
				const char = this.settings.aliases[keyword];
				const statusFilter = `WHERE status = "${char}"`;

				// Reconstruct: TASK + status filter + any remaining DQL from first line + rest of lines
				const restLines = lines.slice(1).join("\n");
				const parts = ["TASK"];

				// Find where to inject status filter — after FROM if present
				const allDql = (remainder ? remainder + "\n" : "") + restLines;
				const dqlLines = allDql.split("\n").filter((l) => l.trim());

				// Find first FROM line, inject status filter after it
				const fromIdx = dqlLines.findIndex((l) => l.trim().toUpperCase().startsWith("FROM"));
				if (fromIdx !== -1) {
					dqlLines.splice(fromIdx + 1, 0, statusFilter);
				} else {
					// No FROM — inject status filter right after TASK
					dqlLines.unshift(statusFilter);
				}

				parts.push(...dqlLines);
				return parts.join("\n");
			}

			// Check if it's TASK — apply excluded statuses filter
			if (keyword === "TASK") {
				const excluded = this.settings.excludedStatuses;
				if (excluded.length > 0) {
					const excludeFilter = excluded
						.map((c) => `status != "${c}"`)
						.join(" AND ");

					const restLines = lines.slice(1).join("\n");
					const allDql = (remainder ? remainder + "\n" : "") + restLines;
					const dqlLines = allDql.split("\n").filter((l) => l.trim());

					const fromIdx = dqlLines.findIndex((l) => l.trim().toUpperCase().startsWith("FROM"));
					if (fromIdx !== -1) {
						dqlLines.splice(fromIdx + 1, 0, `WHERE ${excludeFilter}`);
					} else {
						dqlLines.unshift(`WHERE ${excludeFilter}`);
					}

					return ["TASK", ...dqlLines].join("\n");
				}
			}
		}

		// No alias match — pass through to Dataview as-is
		return source;
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
