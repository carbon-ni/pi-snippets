import { access, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

export type ExtensionConfig = {
  snippetTrigger: string;
};

const DEFAULT_CONFIG: ExtensionConfig = {
  snippetTrigger: ";",
};

function normalizeSnippetTrigger(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) return DEFAULT_CONFIG.snippetTrigger;
  return value;
}

async function loadConfigFile(filePath: string): Promise<ExtensionConfig | undefined> {
  try {
    await access(filePath);
  } catch {
    return undefined;
  }

  try {
    const content = await readFile(filePath, "utf8");
    const parsed = JSON.parse(content) as { snippetTrigger?: unknown };
    return { snippetTrigger: normalizeSnippetTrigger(parsed.snippetTrigger) };
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
