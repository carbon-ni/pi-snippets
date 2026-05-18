export type Snippet = {
  key: string;
  content: string;
  description?: string;
};

export const DEFAULT_SNIPPETS: Snippet[] = [
  {
    key: "refactor",
    content: "Refactor this code keeping behavior unchanged and explain trade-offs.",
  },
  {
    key: "tests",
    content: "Write deterministic tests first, then implement the minimum code to pass.",
  },
  {
    key: "review",
    content: "Review this change for readability, coupling/cohesion, and edge-case safety.",
  },
  {
    key: "readme",
    content: "Update README with problem, solution, usage, and examples.",
  },
];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildTriggerPattern(trigger: string): RegExp {
  return new RegExp(`(^|\\s)${escapeRegex(trigger)}([^\\s]*)$`);
}

function parseSnippetTrigger(
  text: string,
  trigger = ";",
): { query: string; triggerStart: number } | null {
  const match = buildTriggerPattern(trigger).exec(text);
  if (!match) return null;

  const leading = match[1] ?? "";
  const query = match[2] ?? "";
  return { query, triggerStart: match.index + leading.length };
}

export function getSnippetTriggerQuery(text: string, trigger = ";"): string | null {
  return parseSnippetTrigger(text, trigger)?.query ?? null;
}

export function shouldTriggerSnippets(text: string, trigger = ";"): boolean {
  return getSnippetTriggerQuery(text, trigger) !== null;
}

export function applySnippetCompletion(text: string, snippet: string, trigger = ";"): string {
  const parsed = parseSnippetTrigger(text, trigger);
  if (!parsed) return text;
  return `${text.slice(0, parsed.triggerStart)}${snippet} `;
}

function score(value: string, query: string): number | null {
  const lowerValue = value.toLowerCase();
  const lowerQuery = query.toLowerCase();
  if (!lowerQuery) return 0;
  if (lowerValue === lowerQuery) return 0;
  if (lowerValue.startsWith(lowerQuery)) return 1;
  if (lowerValue.includes(lowerQuery)) return 2 + lowerValue.indexOf(lowerQuery) / 100;

  let cursor = 0;
  let gaps = 0;
  for (const char of lowerQuery) {
    const index = lowerValue.indexOf(char, cursor);
    if (index === -1) return null;
    gaps += index - cursor;
    cursor = index + 1;
  }
  return 3 + gaps / 100;
}

export function filterSnippetOptions(snippets: Snippet[], query: string): Snippet[] {
  const trimmed = query.trim();
  if (!trimmed) return snippets;

  return snippets
    .map((snippet, index) => {
      const keyScore = score(snippet.key, trimmed);
      const contentScore = score(snippet.content, trimmed);
      const bestScore = Math.min(keyScore ?? Infinity, contentScore ?? Infinity);
      return Number.isFinite(bestScore) ? { snippet, score: bestScore, index } : undefined;
    })
    .filter((item): item is { snippet: Snippet; score: number; index: number } => Boolean(item))
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .map((item) => item.snippet);
}

export function resolveSnippetByAlias(snippets: Snippet[], alias: string): Snippet | undefined {
  const normalized = alias.trim().toLowerCase();
  if (!normalized) return undefined;
  return snippets.find((snippet) => snippet.key.toLowerCase() === normalized);
}

export function mergeSnippets(defaults: Snippet[], custom: Snippet[]): Snippet[] {
  const positions = new Map<string, number>();
  const merged: Snippet[] = [];

  for (const snippet of defaults) {
    positions.set(snippet.key.toLowerCase(), merged.length);
    merged.push(snippet);
  }

  for (const snippet of custom) {
    const key = snippet.key.toLowerCase();
    const existing = positions.get(key);
    if (existing === undefined) {
      positions.set(key, merged.length);
      merged.push(snippet);
      continue;
    }
    merged[existing] = snippet;
  }

  return merged;
}
