import { describe, expect, it } from "vitest";
import { applyTabstopEdit, expandSnippetTemplate } from "./snippet-template";

describe("snippet template expansion", () => {
  it("expands placeholders, mirrors, and final cursor", () => {
    const expanded = expandSnippetTemplate("fn(${1:arg}) { return $1; }$0");

    expect(expanded.text).toBe("fn(arg) { return arg; }");
    expect(expanded.tabstops).toEqual([
      { index: 1, start: 3, end: 6 },
      { index: 0, start: 23, end: 23 },
    ]);
    expect(expanded.mirrors).toEqual([{ index: 1, start: 17, end: 20 }]);
    expect(expanded.finalCursor).toBe(23);
  });

  it("updates mirrors when a tabstop is edited", () => {
    const expanded = expandSnippetTemplate("fn(${1:arg}) { return $1; }$0");

    expect(applyTabstopEdit(expanded, 1, "value")).toEqual({
      text: "fn(value) { return value; }",
      tabstops: [
        { index: 1, start: 3, end: 8 },
        { index: 0, start: 27, end: 27 },
      ],
      mirrors: [{ index: 1, start: 19, end: 24 }],
      finalCursor: 27,
    });
  });
});
