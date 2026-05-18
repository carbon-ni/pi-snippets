import {
  CustomEditor,
  DynamicBorder,
  type ExtensionAPI,
  type ExtensionContext,
} from "@mariozechner/pi-coding-agent";
import { Container, type SelectItem, SelectList, Text, matchesKey } from "@mariozechner/pi-tui";
import { loadExtensionConfig } from "./lib/config.js";
import { createSnippetEditor } from "./lib/editor.js";
import {
  applyHistorySnippetCompletion,
  collectLastAgentMessages,
  createOpenHistorySnippetPicker,
  getHistorySnippetTriggerQuery,
  shouldTriggerHistorySnippets,
} from "./lib/history-snippets.js";
import { createResolveOrPickSnippet } from "./lib/picker.js";
import { loadCustomSnippets } from "./lib/store.js";
import {
  applySnippetCompletion,
  DEFAULT_SNIPPETS,
  getSnippetTriggerQuery,
  mergeSnippets,
  shouldTriggerSnippets,
} from "./lib/snippets.js";

function selectWithTab(ctx: ExtensionContext, title: string, options: string[]) {
  return ctx.ui.custom<string | undefined>((tui, theme, _keybindings, done) => {
    const items: SelectItem[] = options.map((option) => ({ value: option, label: option }));
    let selectedIndex = 0;

    const container = new Container();
    container.addChild(new DynamicBorder((text: string) => theme.fg("accent", text)));
    container.addChild(new Text(theme.fg("accent", theme.bold(title)), 1, 0));

    const selectList = new SelectList(items, Math.min(items.length, 10), {
      selectedPrefix: (text) => theme.fg("accent", text),
      selectedText: (text) => theme.fg("accent", text),
      description: (text) => theme.fg("muted", text),
      scrollInfo: (text) => theme.fg("dim", text),
      noMatch: (text) => theme.fg("warning", text),
    });
    selectList.onSelect = (item) => done(item.value);
    selectList.onCancel = () => done(undefined);

    container.addChild(selectList);
    container.addChild(
      new Text(theme.fg("dim", "↑↓ navigate • tab/enter select • esc cancel"), 1, 0),
    );
    container.addChild(new DynamicBorder((text: string) => theme.fg("accent", text)));

    return {
      render: (width: number) => container.render(width),
      invalidate: () => container.invalidate(),
      handleInput: (data: string) => {
        if (matchesKey(data, "tab")) {
          done(items[selectedIndex]?.value);
          return;
        }

        if (matchesKey(data, "down")) {
          selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
        } else if (matchesKey(data, "up")) {
          selectedIndex = Math.max(selectedIndex - 1, 0);
        }

        selectList.handleInput(data);
        tui.requestRender();
      },
    };
  });
}

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
      shouldTriggerHistorySnippets,
      getHistorySnippetTriggerQuery,
      applyHistorySnippetCompletion,
    });

    ctx.ui.setEditorComponent((tui, theme, keybindings) => {
      const resolveOrPickSnippet = createResolveOrPickSnippet({
        snippets,
        notify: ctx.ui.notify,
        select: (title, options) => selectWithTab(ctx, title, options),
      });

      const openHistorySnippetPicker = createOpenHistorySnippetPicker({
        getMessages: () => collectLastAgentMessages(ctx.sessionManager.getBranch(), 3),
        messagesBack: 3,
        historySnippetSort: "recency",
        notify: ctx.ui.notify,
        select: (title, options) => selectWithTab(ctx, title, options),
      });

      return new SnippetEditor(
        tui,
        theme,
        keybindings,
        resolveOrPickSnippet,
        openHistorySnippetPicker,
      );
    });
  });
}
