import { describe, expect, it, vi } from "vitest";
import { createSnippetEditor, type BaseEditor } from "./editor.js";

class FakeEditor implements BaseEditor {
  tui = { requestRender: vi.fn() };
  private text = "";
  readonly handled: string[] = [];

  constructor(_tui?: unknown, _theme?: unknown, _keybindings?: unknown) {}

  getText(): string {
    return this.text;
  }

  setText(text: string): void {
    this.text = text;
  }

  handleInput(data: string): void {
    this.handled.push(data);
  }
}

describe("SnippetEditor", () => {
  it("opens history snippet picker on quote tab and applies selected history snippet", async () => {
    const openHistorySnippetPicker = vi.fn(async () => "ctx.sessionManager");
    const Editor = createSnippetEditor({
      CustomEditor: FakeEditor,
      matchesKey: (input, key) => input === key,
      shouldTriggerSnippets: () => false,
      getSnippetTriggerQuery: () => null,
      applySnippetCompletion: (text, picked) => `${text}:${picked}`,
      shouldTriggerHistorySnippets: (text) => text === "'ctx",
      getHistorySnippetTriggerQuery: () => "ctx",
      applyHistorySnippetCompletion: (_text, picked) => picked,
    });
    const editor = new Editor(undefined, undefined, undefined, vi.fn(), openHistorySnippetPicker);
    editor.setText("'ctx");

    editor.handleInput("tab");
    await vi.waitFor(() => expect(editor.getText()).toBe("ctx.sessionManager"));

    expect(openHistorySnippetPicker).toHaveBeenCalledWith("ctx");
    expect(editor.tui.requestRender).toHaveBeenCalled();
  });
});
