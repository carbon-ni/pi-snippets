export type BaseEditor = {
  getText(): string;
  setText(text: string): void;
  handleInput(data: string): void;
  tui: { requestRender(): void };
};

export type CustomEditorCtor = new (...args: never[]) => BaseEditor;

export type EditorDeps = {
  CustomEditor: CustomEditorCtor;
  matchesKey: (input: string, key: string) => boolean;
  shouldTriggerSnippets: (text: string) => boolean;
  getSnippetTriggerQuery: (text: string) => string | null;
  applySnippetCompletion: (text: string, picked: string) => string;
};

export type ResolveSnippet = (alias: string) => Promise<string | undefined>;

export function createSnippetEditor(deps: EditorDeps) {
  return class SnippetEditor extends deps.CustomEditor {
    private pickerOpen = false;

    constructor(
      tui: unknown,
      theme: unknown,
      keybindings: unknown,
      private readonly resolveOrPickSnippet: ResolveSnippet,
    ) {
      super(tui as never, theme as never, keybindings as never);
    }

    handleInput(data: string): void {
      if (
        deps.matchesKey(data, "tab") &&
        !this.pickerOpen &&
        deps.shouldTriggerSnippets(this.getText())
      ) {
        const alias = deps.getSnippetTriggerQuery(this.getText()) ?? "";
        this.pickerOpen = true;
        void this.resolveOrPickSnippet(alias)
          .then((picked) => {
            if (!picked) return;
            this.setText(deps.applySnippetCompletion(this.getText(), picked));
            this.tui.requestRender();
          })
          .finally(() => {
            this.pickerOpen = false;
          });
        return;
      }

      super.handleInput(data);
    }
  };
}
