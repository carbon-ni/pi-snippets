import { access, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Snippet } from "./snippets.js";

type SnippetFile = {
  version?: number;
  snippets?: unknown;
};

function isValidSnippet(value: unknown): value is Snippet {
  if (!value || typeof value !== "object") return false;
  const snippet = value as Partial<Snippet>;
  if (typeof snippet.key !== "string" || !snippet.key.trim()) return false;
  if (typeof snippet.content !== "string" || !snippet.content.trim()) return false;
  return snippet.description === undefined || typeof snippet.description === "string";
}

async function loadSnippetsFile(filePath: string): Promise<Snippet[] | undefined> {
  try {
    await access(filePath);
  } catch {
    return undefined;
  }

  try {
    const content = await readFile(filePath, "utf8");
    const parsed = JSON.parse(content) as SnippetFile;
    if (!Array.isArray(parsed.snippets)) return [];
    return parsed.snippets.filter(isValidSnippet);
  } catch {
    return undefined;
  }
}

export async function loadCustomSnippets(cwd: string, home = homedir()): Promise<Snippet[]> {
  const projectSnippets = await loadSnippetsFile(join(cwd, ".pi", "snippets.json"));
  if (projectSnippets) return projectSnippets;

  const globalSnippets = await loadSnippetsFile(join(home, ".pi", "agent", "snippets.json"));
  if (globalSnippets) return globalSnippets;

  return [];
}
