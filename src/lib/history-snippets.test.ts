import { describe, expect, it } from "vitest";
import {
  applyHistorySnippetCompletion,
  collectLastAgentMessages,
  extractHistorySnippetsFromMessages,
  filterHistorySnippets,
  createOpenHistorySnippetPicker,
  getHistorySnippetTriggerQuery,
  shouldTriggerHistorySnippets,
  sortHistorySnippets,
} from "./history-snippets.js";

describe("history snippet trigger", () => {
  it("detects quote tab trigger and query", () => {
    expect(shouldTriggerHistorySnippets("'")).toBe(true);
    expect(shouldTriggerHistorySnippets("use 'ctx")).toBe(true);
    expect(shouldTriggerHistorySnippets("word'ctx")).toBe(false);
    expect(getHistorySnippetTriggerQuery("use 'ctx")).toBe("ctx");
  });

  it("replaces trailing quote trigger with selected history snippet", () => {
    expect(applyHistorySnippetCompletion("'", "ctx.sessionManager")).toBe("ctx.sessionManager");
    expect(applyHistorySnippetCompletion("inspect 'ctx", "ctx.sessionManager")).toBe(
      "inspect ctx.sessionManager",
    );
  });
});

describe("history snippet catalog", () => {
  it("collects recent assistant text messages only", () => {
    const messages = collectLastAgentMessages(
      [
        { type: "message", message: { role: "user", content: "ignore `userSymbol`" } },
        { type: "message", message: { role: "assistant", content: "first `alpha`" } },
        {
          type: "message",
          message: { role: "assistant", content: [{ type: "text", text: "second `beta`" }] },
        },
      ],
      1,
    );

    expect(messages).toEqual(["second `beta`"]);
  });

  it("extracts inline code snippets from history by recency and removes duplicates", () => {
    expect(
      extractHistorySnippetsFromMessages(["old `alpha` `beta`", "new `alpha` `gamma`"]),
    ).toEqual(["gamma", "alpha", "beta"]);
  });

  it("sorts and fuzzy filters snippets from history", () => {
    expect(sortHistorySnippets(["beta", "alpha"], "alphabetical")).toEqual(["alpha", "beta"]);
    expect(filterHistorySnippets(["sessionManager", "SnippetEditor"], "sm")).toEqual([
      "sessionManager",
    ]);
  });
});

describe("Pick snippet from history", () => {
  it("selects fuzzy matches from recent assistant snippets", async () => {
    const titles: string[] = [];
    const select = async (title: string, options: string[]) => {
      titles.push(title);
      return options[0];
    };
    const openPicker = createOpenHistorySnippetPicker({
      getMessages: () => ["Use `ctx.sessionManager` and `SnippetEditor`"],
      messagesBack: 3,
      historySnippetSort: "recency",
      notify: () => undefined,
      select,
    });

    await expect(openPicker("ctx")).resolves.toBe("ctx.sessionManager");
    expect(titles).toEqual(["Pick snippet from history"]);
  });

  it("notifies when no snippets from history match", async () => {
    const notifications: string[] = [];
    const openPicker = createOpenHistorySnippetPicker({
      getMessages: () => ["Use `SnippetEditor`"],
      messagesBack: 2,
      historySnippetSort: "recency",
      notify: (message) => notifications.push(message),
      select: async () => undefined,
    });

    await expect(openPicker("zzz")).resolves.toBeUndefined();
    expect(notifications).toEqual([
      "No matching snippets found in history from the last 2 assistant messages",
    ]);
  });
});
