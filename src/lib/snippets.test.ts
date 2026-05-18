import { describe, expect, it } from "vitest";
import {
  applySnippetCompletion,
  filterSnippetOptions,
  getSnippetTriggerQuery,
  mergeSnippets,
  resolveSnippetByAlias,
  shouldTriggerSnippets,
} from "./snippets.js";

describe("snippet trigger", () => {
  it("detects snippet trigger and query", () => {
    expect(shouldTriggerSnippets(";")).toBe(true);
    expect(shouldTriggerSnippets("hello ;tes")).toBe(true);
    expect(shouldTriggerSnippets("hello ; tes")).toBe(false);
    expect(getSnippetTriggerQuery("hello ;tes")).toBe("tes");
    expect(getSnippetTriggerQuery("hello")).toBeNull();
  });

  it("replaces trailing trigger with snippet content", () => {
    expect(applySnippetCompletion(";tdd", "Write tests first")).toBe("Write tests first");
    expect(applySnippetCompletion("please ;tdd", "Write tests first")).toBe(
      "please Write tests first",
    );
  });
});

describe("snippet catalog", () => {
  it("resolves snippet aliases case-insensitively", () => {
    const snippets = [{ key: "TDD", content: "Write failing test first" }];

    expect(resolveSnippetByAlias(snippets, "tdd")?.content).toBe("Write failing test first");
    expect(resolveSnippetByAlias(snippets, "missing")).toBeUndefined();
  });

  it("filters snippets by key and content", () => {
    const snippets = [
      { key: "review", content: "Review code" },
      { key: "tdd", content: "Write failing tests first" },
    ];

    expect(filterSnippetOptions(snippets, "test").map((snippet) => snippet.key)).toEqual(["tdd"]);
  });

  it("merges custom snippets over built-ins by key", () => {
    const merged = mergeSnippets(
      [
        { key: "review", content: "default review" },
        { key: "tdd", content: "default tdd" },
      ],
      [
        { key: "TDD", content: "custom tdd" },
        { key: "jira", content: "custom jira" },
      ],
    );

    expect(merged).toEqual([
      { key: "review", content: "default review" },
      { key: "TDD", content: "custom tdd" },
      { key: "jira", content: "custom jira" },
    ]);
  });
});
