declare module "@mariozechner/pi-coding-agent" {
  export const CustomEditor: new (...args: never[]) => {
    getText(): string;
    setText(text: string): void;
    handleInput(data: string): void;
    tui: { requestRender(): void };
  };

  export type ExtensionAPI = {
    on(
      event: "session_start",
      handler: (event: unknown, ctx: ExtensionContext) => Promise<void> | void,
    ): void;
  };

  export type ExtensionContext = {
    cwd: string;
    ui: {
      notify(message: string, level: "info" | "warn" | "error"): void;
      select(title: string, options: string[]): Promise<string | undefined>;
      setEditorComponent(
        factory: (tui: unknown, theme: unknown, keybindings: unknown) => unknown,
      ): void;
    };
  };
}

declare module "@mariozechner/pi-tui" {
  export function matchesKey(input: string, key: string): boolean;
}
