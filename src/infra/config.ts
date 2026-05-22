import { access, readFile, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

export type ExtensionConfig = {
  snippetTrigger: string;
};

const DEFAULT_CONFIG: ExtensionConfig = {
  snippetTrigger: ";",
};

const MAX_CONFIG_FILE_BYTES = 16 * 1024; // 16 KB — configs are tiny
const MAX_TRIGGER_LENGTH = 8;

function normalizeSnippetTrigger(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) return DEFAULT_CONFIG.snippetTrigger;
  if (value.length > MAX_TRIGGER_LENGTH) return DEFAULT_CONFIG.snippetTrigger;
  return value;
}

async function loadConfigFile(filePath: string): Promise<ExtensionConfig | undefined> {
  try {
    await access(filePath);
  } catch {
    return undefined;
  }

  try {
    const fileStat = await stat(filePath);
    if (fileStat.size > MAX_CONFIG_FILE_BYTES) return undefined;

    const content = await readFile(filePath, "utf8");
    const parsed = JSON.parse(content);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;

    return {
      snippetTrigger: normalizeSnippetTrigger((parsed as Record<string, unknown>).snippetTrigger),
    };
  } catch {
    return undefined;
  }
}

export async function loadExtensionConfig(cwd: string, home = homedir()): Promise<ExtensionConfig> {
  const projectConfig = await loadConfigFile(join(cwd, ".pi", "pi-snippets.json"));
  if (projectConfig) return projectConfig;

  const globalConfig = await loadConfigFile(join(home, ".pi", "agent", "pi-snippets.json"));
  if (globalConfig) return globalConfig;

  return DEFAULT_CONFIG;
}
