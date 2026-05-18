import { CustomEditor, type ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { matchesKey } from "@mariozechner/pi-tui";
import { loadExtensionConfig } from "./lib/config.js";
import { createSnippetEditor } from "./lib/editor.js";
import { createResolveOrPickSnippet } from "./lib/picker.js";
import { loadCustomSnippets } from "./lib/store.js";
import {
  applySnippetCompletion,
  DEFAULT_SNIPPETS,
  getSnippetTriggerQuery,
  mergeSnippets,
  shouldTriggerSnippets,
} from "./lib/snippets.js";

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    const config = await loadExtensionConfig(ctx.cwd);
    const snippets = mergeSnippets(DEFAULT_SNIPPETS, await loadCustomSnippets(ctx.cwd));

    const SnippetEditor = createSnippetEditor({
      CustomEditor,
      matchesKey,
      shouldTriggerSnippets: (text) => shouldTriggerSnippets(text, config.snippetTrigger),
      getSnippetTriggerQuery: (text) => getSnippetTriggerQuery(text, config.snippetTrigger),
      applySnippetCompletion: (text, picked) =>
        applySnippetCompletion(text, picked, config.snippetTrigger),
    });

    ctx.ui.setEditorComponent((tui, theme, keybindings) => {
      const resolveOrPickSnippet = createResolveOrPickSnippet({
        snippets,
        notify: ctx.ui.notify,
        select: ctx.ui.select,
      });

      return new SnippetEditor(tui, theme, keybindings, resolveOrPickSnippet);
    });
  });
}
