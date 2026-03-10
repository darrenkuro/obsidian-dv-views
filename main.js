var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => DvViewsPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian2 = require("obsidian");

// src/settings.ts
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  excludedStatuses: ["!", "*", '"', "l", "b", "i", "S", "p", "c", "f", "k", "w", "u", "d"],
  respectDefer: true,
  onlyFirst: true,
  aliases: {
    "QUOTE": '"',
    "BOOKMARK": "b",
    "STAR": "*",
    "LOCATION": "l",
    "INFO": "i"
  }
};
var STATUS_LABELS = {
  "!": "important",
  "*": "star",
  '"': "quote",
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
  "d": "down"
};
var DvViewsSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Global defaults" });
    new import_obsidian.Setting(containerEl).setName("Only show first per section").setDesc("Mimics dependency \u2014 only the first incomplete task per heading is shown.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.onlyFirst).onChange(async (value) => {
        this.plugin.settings.onlyFirst = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Respect defer dates").setDesc("Hide tasks whose deferUntil date is in the future.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.respectDefer).onChange(async (value) => {
        this.plugin.settings.respectDefer = value;
        await this.plugin.saveSettings();
      })
    );
    containerEl.createEl("h2", { text: "Excluded status characters" });
    containerEl.createEl("p", {
      text: "Toggle which checkbox statuses are excluded from TASK queries.",
      cls: "setting-item-description"
    });
    for (const [char, label] of Object.entries(STATUS_LABELS)) {
      new import_obsidian.Setting(containerEl).setName(`[${char}] ${label}`).addToggle(
        (toggle) => toggle.setValue(this.plugin.settings.excludedStatuses.includes(char)).onChange(async (value) => {
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
    containerEl.createEl("h2", { text: "Query aliases" });
    containerEl.createEl("p", {
      text: "Map alias names to status characters. Use these in ```dv blocks (e.g. QUOTE \u2192 TASK WHERE status = '\"').",
      cls: "setting-item-description"
    });
    for (const [alias, char] of Object.entries(this.plugin.settings.aliases)) {
      new import_obsidian.Setting(containerEl).setName(alias).addText(
        (text) => text.setValue(char).onChange(async (value) => {
          this.plugin.settings.aliases[alias] = value;
          await this.plugin.saveSettings();
        })
      ).addExtraButton(
        (btn) => btn.setIcon("trash").setTooltip("Remove alias").onClick(async () => {
          delete this.plugin.settings.aliases[alias];
          await this.plugin.saveSettings();
          this.display();
        })
      );
    }
    new import_obsidian.Setting(containerEl).addButton(
      (btn) => btn.setButtonText("Add alias").onClick(async () => {
        this.plugin.settings.aliases["NEW_ALIAS"] = " ";
        await this.plugin.saveSettings();
        this.display();
      })
    );
  }
};

// src/main.ts
var getDataviewApi = (plugin) => {
  var _a, _b, _c;
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (_c = (_b = (_a = plugin.app.plugins) == null ? void 0 : _a.plugins) == null ? void 0 : _b.dataview) == null ? void 0 : _c.api
  );
};
var DvViewsPlugin = class extends import_obsidian2.Plugin {
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new DvViewsSettingTab(this.app, this));
    this.registerMarkdownCodeBlockProcessor("dv", async (source, el, ctx) => {
      const api = getDataviewApi(this);
      if (!api) {
        el.createEl("p", { text: "Dataview plugin is not available." });
        return;
      }
      const transformed = this.preprocessQuery(source);
      const component = new import_obsidian2.Component();
      ctx.addChild(component);
      await api.execute(transformed, el, component, ctx.sourcePath);
    });
  }
  preprocessQuery(source) {
    const lines = source.trim().split("\n");
    if (lines.length === 0) return source;
    const firstLine = lines[0].trim();
    const aliasMatch = firstLine.match(/^(\w+)(.*)$/);
    if (aliasMatch) {
      const keyword = aliasMatch[1].toUpperCase();
      const remainder = aliasMatch[2].trim();
      if (keyword in this.settings.aliases) {
        const char = this.settings.aliases[keyword];
        const statusFilter = `WHERE status = "${char}"`;
        const restLines = lines.slice(1).join("\n");
        const parts = ["TASK"];
        const allDql = (remainder ? remainder + "\n" : "") + restLines;
        const dqlLines = allDql.split("\n").filter((l) => l.trim());
        const fromIdx = dqlLines.findIndex((l) => l.trim().toUpperCase().startsWith("FROM"));
        if (fromIdx !== -1) {
          dqlLines.splice(fromIdx + 1, 0, statusFilter);
        } else {
          dqlLines.unshift(statusFilter);
        }
        parts.push(...dqlLines);
        return parts.join("\n");
      }
      if (keyword === "TASK") {
        const excluded = this.settings.excludedStatuses;
        if (excluded.length > 0) {
          const excludeFilter = excluded.map((c) => `status != "${c}"`).join(" AND ");
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
    return source;
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
