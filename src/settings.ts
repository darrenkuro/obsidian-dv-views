import { App, PluginSettingTab, Setting } from "obsidian";
import type DvViewsPlugin from "./main";

export interface StatusAlias {
	char: string;
	label: string;
}

export interface DvViewsSettings {
	excludedStatuses: string[];
	respectDefer: boolean;
	onlyFirst: boolean;
	aliases: Record<string, string>;
}

export const DEFAULT_SETTINGS: DvViewsSettings = {
	excludedStatuses: ["!", "*", "\"", "l", "b", "i", "S", "p", "c", "f", "k", "w", "u", "d"],
	respectDefer: true,
	onlyFirst: true,
	aliases: {
		"QUOTE": "\"",
		"BOOKMARK": "b",
		"STAR": "*",
		"LOCATION": "l",
		"INFO": "i",
	},
};

// Known status characters and their human-readable labels
const STATUS_LABELS: Record<string, string> = {
	"!": "important",
	"*": "star",
	"\"": "quote",
	"l": "location",
	"b": "bookmark",
	"i": "information",
	"S": "savings",
	"p": "pros",
	"c": "cons",
	"f": "fire",
	"k": "key",
	"w": "win",
	"u": "up",
	"d": "down",
};

export class DvViewsSettingTab extends PluginSettingTab {
	plugin: DvViewsPlugin;

	constructor(app: App, plugin: DvViewsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// --- Global defaults ---
		containerEl.createEl("h2", { text: "Global defaults" });

		new Setting(containerEl)
			.setName("Only show first per section")
			.setDesc("Mimics dependency — only the first incomplete task per heading is shown.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.onlyFirst).onChange(async (value) => {
					this.plugin.settings.onlyFirst = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Respect defer dates")
			.setDesc("Hide tasks whose deferUntil date is in the future.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.respectDefer).onChange(async (value) => {
					this.plugin.settings.respectDefer = value;
					await this.plugin.saveSettings();
				})
			);

		// --- Excluded statuses ---
		containerEl.createEl("h2", { text: "Excluded status characters" });
		containerEl.createEl("p", {
			text: "Toggle which checkbox statuses are excluded from TASK queries.",
			cls: "setting-item-description",
		});

		for (const [char, label] of Object.entries(STATUS_LABELS)) {
			new Setting(containerEl)
				.setName(`[${char}] ${label}`)
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.excludedStatuses.includes(char))
						.onChange(async (value) => {
							const excluded = this.plugin.settings.excludedStatuses;
							if (value && !excluded.includes(char)) {
								excluded.push(char);
							} else if (!value) {
								const idx = excluded.indexOf(char);
								if (idx !== -1) excluded.splice(idx, 1);
							}
							await this.plugin.saveSettings();
						})
				);
		}

		// --- Aliases ---
		containerEl.createEl("h2", { text: "Query aliases" });
		containerEl.createEl("p", {
			text: "Map alias names to status characters. Use these in ```dv blocks (e.g. QUOTE → TASK WHERE status = '\"').",
			cls: "setting-item-description",
		});

		for (const [alias, char] of Object.entries(this.plugin.settings.aliases)) {
			new Setting(containerEl)
				.setName(alias)
				.addText((text) =>
					text.setValue(char).onChange(async (value) => {
						this.plugin.settings.aliases[alias] = value;
						await this.plugin.saveSettings();
					})
				)
				.addExtraButton((btn) =>
					btn.setIcon("trash").setTooltip("Remove alias").onClick(async () => {
						delete this.plugin.settings.aliases[alias];
						await this.plugin.saveSettings();
						this.display();
					})
				);
		}

		new Setting(containerEl)
			.addButton((btn) =>
				btn.setButtonText("Add alias").onClick(async () => {
					this.plugin.settings.aliases["NEW_ALIAS"] = " ";
					await this.plugin.saveSettings();
					this.display();
				})
			);
	}
}
