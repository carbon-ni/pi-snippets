import { access, readFile, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Snippet } from "../lib/snippets";

const MAX_FILE_BYTES = 512 * 1024; // 512 KB
const MAX_SNIPPET_COUNT = 100;
const MAX_KEY_LENGTH = 128;
const MAX_CONTENT_LENGTH = 4096;

type SnippetFile = {
  version?: number;
  snippets?: unknown;
};

function isValidSnippet(value: unknown): value is Snippet {
  if (!value || typeof value !== "object") return false;
  const snippet = value as Partial<Snippet>;
  if (typeof snippet.key !== "string" || !snippet.key.trim()) return false;
  if (snippet.key.length > MAX_KEY_LENGTH) return false;
  if (typeof snippet.content !== "string" || !snippet.content.trim()) return false;
  if (snippet.content.length > MAX_CONTENT_LENGTH) return false;
  return snippet.description === undefined || typeof snippet.description === "string";
}

async function loadSnippetsFile(filePath: string): Promise<Snippet[] | undefined> {
  try {
    await access(filePath);
  } catch {
    return undefined;
  }

  try {
    const fileStat = await stat(filePath);
    if (fileStat.size > MAX_FILE_BYTES) return [];

    const content = await readFile(filePath, "utf8");
    const parsed = JSON.parse(content);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];

    const file = parsed as SnippetFile;
    if (!Array.isArray(file.snippets)) return [];
    return file.snippets.slice(0, MAX_SNIPPET_COUNT).filter(isValidSnippet);
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
