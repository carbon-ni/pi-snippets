export type HistorySnippetSortMode = "recency" | "alphabetical";

type NotifyLevel = "info" | "warn" | "error";

type HistorySnippetPickerDeps = {
  getMessages: () => string[];
  messagesBack: number;
  historySnippetSort: HistorySnippetSortMode;
  notify: (message: string, level: NotifyLevel) => void;
  select: (title: string, options: string[]) => Promise<string | undefined>;
};

const INLINE_CODE_REGEX = /(?<!`)`([^`\n]+)`(?!`)/g;
const TRIGGER_PATTERN = /(^|\s)'([^\s]*)$/;

type TextBlock = { type: "text"; text: string };

type MessageEntryLike = {
  type?: string;
  message?: {
    role?: string;
    content?: unknown;
  };
};

function getMessageText(content: unknown): string | null {
  if (typeof content === "string") return content.trim() || null;

  if (!Array.isArray(content)) return null;

  const text = content
    .filter((block): block is TextBlock => {
      if (!block || typeof block !== "object") return false;
      const maybe = block as Partial<TextBlock>;
      return maybe.type === "text" && typeof maybe.text === "string";
    })
    .map((block) => block.text.trim())
    .filter(Boolean)
    .join("\n");

  return text || null;
}

function parseHistorySnippetTrigger(text: string): { query: string; triggerStart: number } | null {
  const match = TRIGGER_PATTERN.exec(text);
  if (!match) return null;

  const leading = match[1] ?? "";
  const query = match[2] ?? "";
  return { query, triggerStart: match.index + leading.length };
}

function isSubsequence(needle: string, haystack: string): boolean {
  let cursor = 0;
  for (const char of haystack) {
    if (needle[cursor] === char) cursor++;
    if (cursor === needle.length) return true;
  }
  return cursor === needle.length;
}

function score(query: string, value: string): number {
  const q = query.toLowerCase();
  const v = value.toLowerCase();
  if (v === q) return 400;
  if (v.startsWith(q)) return 300;
  if (v.includes(q)) return 200;
  if (isSubsequence(q, v)) return 100;
  return -1;
}

export function collectLastAgentMessages(entries: MessageEntryLike[], limit = 3): string[] {
  if (limit <= 0) return [];

  const assistantMessages = entries
    .filter((entry) => entry.type === "message" && entry.message?.role === "assistant")
    .map((entry) => getMessageText(entry.message?.content))
    .filter((text): text is string => Boolean(text));

  return assistantMessages.slice(-limit);
}

export function extractHistorySnippetsFromMessages(messages: string[]): string[] {
  const historySnippets: string[] = [];
  const seen = new Set<string>();

  for (let messageIndex = messages.length - 1; messageIndex >= 0; messageIndex--) {
    const matches = [...messages[messageIndex]!.matchAll(INLINE_CODE_REGEX)];
    for (let matchIndex = matches.length - 1; matchIndex >= 0; matchIndex--) {
      const historySnippet = (matches[matchIndex]![1] ?? "").trim();
      if (!historySnippet || seen.has(historySnippet)) continue;
      seen.add(historySnippet);
      historySnippets.push(historySnippet);
    }
  }

  return historySnippets;
}

export function sortHistorySnippets(
  historySnippets: string[],
  mode: HistorySnippetSortMode,
): string[] {
  if (mode === "alphabetical") return [...historySnippets].sort((a, b) => a.localeCompare(b));
  return [...historySnippets];
}

export function filterHistorySnippets(options: string[], query: string): string[] {
  const normalized = query.trim();
  if (!normalized) return [...options];

  return options
    .map((value, index) => ({ value, index, score: score(normalized, value) }))
    .filter((candidate) => candidate.score >= 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((candidate) => candidate.value);
}

export function getHistorySnippetTriggerQuery(text: string): string | null {
  return parseHistorySnippetTrigger(text)?.query ?? null;
}

export function shouldTriggerHistorySnippets(text: string): boolean {
  return getHistorySnippetTriggerQuery(text) !== null;
}

export function applyHistorySnippetCompletion(text: string, completion: string): string {
  const parsed = parseHistorySnippetTrigger(text);
  if (!parsed) return text;
  return `${text.slice(0, parsed.triggerStart)}${completion}`;
}

export function createOpenHistorySnippetPicker(deps: HistorySnippetPickerDeps) {
  return async (query: string): Promise<string | undefined> => {
    const historySnippets = sortHistorySnippets(
      extractHistorySnippetsFromMessages(deps.getMessages()),
      deps.historySnippetSort,
    );
    const options = filterHistorySnippets(historySnippets, query);

    if (options.length === 0) {
      deps.notify(
        `No matching snippets found in history from the last ${deps.messagesBack} assistant messages`,
        "info",
      );
      return undefined;
    }

    return deps.select("Pick snippet from history", options);
  };
}
