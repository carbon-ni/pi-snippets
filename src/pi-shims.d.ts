declare module "@mariozechner/pi-coding-agent" {
  export const CustomEditor: new (...args: never[]) => {
    getText(): string;
    setText(text: string): void;
    handleInput(data: string): void;
    tui: { requestRender(): void };
  };

  export const DynamicBorder: new (style: (text: string) => string) => {
    render(width: number): string;
    invalidate(): void;
  };

  export type ExtensionAPI = {
    on(
      event: "session_start",
      handler: (event: unknown, ctx: ExtensionContext) => Promise<void> | void,
    ): void;
  };

  export type ExtensionContext = {
    cwd: string;
    sessionManager: {
      getBranch(): Array<{
        type?: string;
        message?: { role?: string; content?: unknown };
      }>;
    };
    ui: {
      notify(message: string, level: "info" | "warn" | "error"): void;
      select(title: string, options: string[]): Promise<string | undefined>;
      custom<T>(
        factory: (
          tui: { requestRender(): void },
          theme: {
            fg(kind: string, text: string): string;
            bold(text: string): string;
          },
          keybindings: unknown,
          done: (result: T) => void,
        ) => {
          render(width: number): string;
          invalidate(): void;
          handleInput(data: string): void;
        },
      ): Promise<T>;
      setEditorComponent(
        factory: (tui: unknown, theme: unknown, keybindings: unknown) => unknown,
      ): void;
    };
  };
}

declare module "@mariozechner/pi-tui" {
  export type SelectItem = { value: string; label: string; description?: string };

  export class Container {
    addChild(child: { render(width: number): string; invalidate(): void }): void;
    render(width: number): string;
    invalidate(): void;
  }

  export class SelectList {
    onSelect?: (item: SelectItem) => void;
    onCancel?: () => void;
    constructor(
      items: SelectItem[],
      visibleCount: number,
      theme: {
        selectedPrefix(text: string): string;
        selectedText(text: string): string;
        description(text: string): string;
        scrollInfo(text: string): string;
        noMatch(text: string): string;
      },
    );
    handleInput(data: string): void;
    render(width: number): string;
    invalidate(): void;
  }

  export class Text {
    constructor(text: string, x?: number, y?: number);
    render(width: number): string;
    invalidate(): void;
  }

  export function matchesKey(input: string, key: string): boolean;
}
