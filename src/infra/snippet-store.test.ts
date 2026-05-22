import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadCustomSnippets } from "../infra/snippet-store";

describe("loadCustomSnippets", () => {
  it("returns empty when project/global files do not exist", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pi-snippets-"));
    const home = await mkdtemp(join(tmpdir(), "pi-snippets-home-"));
    const result = await loadCustomSnippets(dir, home);
    expect(result).toEqual([]);
  });

  it("loads valid snippets from project .pi/snippets.json", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pi-snippets-"));
    const home = await mkdtemp(join(tmpdir(), "pi-snippets-home-"));
    await mkdir(join(dir, ".pi"), { recursive: true });
    await writeFile(
      join(dir, ".pi", "snippets.json"),
      JSON.stringify({
        version: 1,
        snippets: [{ key: "hello", content: "Hello snippet" }],
      }),
      "utf8",
    );

    const result = await loadCustomSnippets(dir, home);
    expect(result).toEqual([{ key: "hello", content: "Hello snippet" }]);
  });

  it("loads snippets from global when project file is missing", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pi-snippets-"));
    const home = await mkdtemp(join(tmpdir(), "pi-snippets-home-"));
    await mkdir(join(home, ".pi", "agent"), { recursive: true });
    await writeFile(
      join(home, ".pi", "agent", "snippets.json"),
      JSON.stringify({
        version: 1,
        snippets: [{ key: "global", content: "Global snippet" }],
      }),
      "utf8",
    );

    const result = await loadCustomSnippets(dir, home);
    expect(result).toEqual([{ key: "global", content: "Global snippet" }]);
  });

  it("prefers project snippets over global snippets", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pi-snippets-"));
    const home = await mkdtemp(join(tmpdir(), "pi-snippets-home-"));

    await mkdir(join(home, ".pi", "agent"), { recursive: true });
    await writeFile(
      join(home, ".pi", "agent", "snippets.json"),
      JSON.stringify({
        version: 1,
        snippets: [{ key: "global", content: "Global snippet" }],
      }),
      "utf8",
    );

    await mkdir(join(dir, ".pi"), { recursive: true });
    await writeFile(
      join(dir, ".pi", "snippets.json"),
      JSON.stringify({
        version: 1,
        snippets: [{ key: "project", content: "Project snippet" }],
      }),
      "utf8",
    );

    const result = await loadCustomSnippets(dir, home);
    expect(result).toEqual([{ key: "project", content: "Project snippet" }]);
  });

  it("ignores invalid items", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pi-snippets-"));
    const home = await mkdtemp(join(tmpdir(), "pi-snippets-home-"));
    await mkdir(join(dir, ".pi"), { recursive: true });
    await writeFile(
      join(dir, ".pi", "snippets.json"),
      JSON.stringify({
        version: 1,
        snippets: [{ key: "ok", content: "A" }, { key: "", content: "B" }, { content: "x" }],
      }),
      "utf8",
    );

    const result = await loadCustomSnippets(dir, home);
    expect(result).toEqual([{ key: "ok", content: "A" }]);
  });
});

// --- Security tests ---

describe("loadCustomSnippets security", () => {
  it("rejects files exceeding max size", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pi-snippets-"));
    const home = await mkdtemp(join(tmpdir(), "pi-snippets-home-"));
    await mkdir(join(dir, ".pi"), { recursive: true });
    await writeFile(
      join(dir, ".pi", "snippets.json"),
      JSON.stringify({
        version: 1,
        snippets: [{ key: "big", content: "x".repeat(1024 * 1024) }],
      }),
      "utf8",
    );

    const result = await loadCustomSnippets(dir, home);
    expect(result).toEqual([]);
  });

  it("caps snippet count at maximum", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pi-snippets-"));
    const home = await mkdtemp(join(tmpdir(), "pi-snippets-home-"));
    await mkdir(join(dir, ".pi"), { recursive: true });
    const snippets = Array.from({ length: 200 }, (_, i) => ({
      key: `s${i}`,
      content: `content ${i}`,
    }));
    await writeFile(
      join(dir, ".pi", "snippets.json"),
      JSON.stringify({ version: 1, snippets }),
      "utf8",
    );

    const result = await loadCustomSnippets(dir, home);
    expect(result.length).toBeLessThanOrEqual(100);
    expect(result[0]).toEqual({ key: "s0", content: "content 0" });
  });

  it("rejects snippets with keys exceeding max length", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pi-snippets-"));
    const home = await mkdtemp(join(tmpdir(), "pi-snippets-home-"));
    await mkdir(join(dir, ".pi"), { recursive: true });
    await writeFile(
      join(dir, ".pi", "snippets.json"),
      JSON.stringify({
        version: 1,
        snippets: [
          { key: "x".repeat(300), content: "valid" },
          { key: "ok", content: "valid" },
        ],
      }),
      "utf8",
    );

    const result = await loadCustomSnippets(dir, home);
    expect(result).toEqual([{ key: "ok", content: "valid" }]);
  });

  it("rejects snippets with content exceeding max length", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pi-snippets-"));
    const home = await mkdtemp(join(tmpdir(), "pi-snippets-home-"));
    await mkdir(join(dir, ".pi"), { recursive: true });
    await writeFile(
      join(dir, ".pi", "snippets.json"),
      JSON.stringify({
        version: 1,
        snippets: [
          { key: "big", content: "x".repeat(5000) },
          { key: "ok", content: "valid" },
        ],
      }),
      "utf8",
    );

    const result = await loadCustomSnippets(dir, home);
    expect(result).toEqual([{ key: "ok", content: "valid" }]);
  });

  it("returns empty for malformed JSON", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pi-snippets-"));
    const home = await mkdtemp(join(tmpdir(), "pi-snippets-home-"));
    await mkdir(join(dir, ".pi"), { recursive: true });
    await writeFile(join(dir, ".pi", "snippets.json"), "{invalid json", "utf8");

    const result = await loadCustomSnippets(dir, home);
    expect(result).toEqual([]);
  });

  it("returns empty when parsed value is not an object", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pi-snippets-"));
    const home = await mkdtemp(join(tmpdir(), "pi-snippets-home-"));
    await mkdir(join(dir, ".pi"), { recursive: true });
    await writeFile(join(dir, ".pi", "snippets.json"), "42", "utf8");

    const result = await loadCustomSnippets(dir, home);
    expect(result).toEqual([]);
  });
});
