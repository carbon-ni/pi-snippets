import { filterSnippetOptions, resolveSnippetByAlias, type Snippet } from "./snippets.js";

type NotifyLevel = "info" | "warn" | "error";

type SnippetPickerDeps = {
  snippets: Snippet[];
  notify: (message: string, level: NotifyLevel) => void;
  select: (title: string, options: string[]) => Promise<string | undefined>;
};

function renderOption(snippet: Snippet): string {
  return `${snippet.key} — ${snippet.content}`;
}

function parseOption(option: string): string {
  return option.split(" — ").slice(1).join(" — ");
}

export function createResolveOrPickSnippet(deps: SnippetPickerDeps) {
  return async (alias: string): Promise<string | undefined> => {
    const exact = resolveSnippetByAlias(deps.snippets, alias);
    if (exact) return exact.content;

    const options = filterSnippetOptions(deps.snippets, alias);
    if (options.length === 0) {
      deps.notify("No matching snippets found", "info");
      return undefined;
    }

    const selected = await deps.select("Pick a snippet", options.map(renderOption));
    if (!selected) return undefined;
    return parseOption(selected);
  };
}
