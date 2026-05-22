import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadExtensionConfig } from "./config";

describe("loadExtensionConfig", () => {
  it("returns default config when project/global files are missing", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pi-snippets-config-"));
    const home = await mkdtemp(join(tmpdir(), "pi-snippets-home-"));
    const config = await loadExtensionConfig(dir, home);
    expect(config).toEqual({ snippetTrigger: ";" });
  });

  it("loads config from project .pi/pi-snippets.json", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pi-snippets-config-"));
    const home = await mkdtemp(join(tmpdir(), "pi-snippets-home-"));
    await mkdir(join(dir, ".pi"), { recursive: true });
    await writeFile(
      join(dir, ".pi", "pi-snippets.json"),
      JSON.stringify({ snippetTrigger: ":" }),
      "utf8",
    );

    const config = await loadExtensionConfig(dir, home);
    expect(config).toEqual({ snippetTrigger: ":" });
  });

  it("loads config from global when project config is missing", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pi-snippets-config-"));
    const home = await mkdtemp(join(tmpdir(), "pi-snippets-home-"));
    await mkdir(join(home, ".pi", "agent"), { recursive: true });
    await writeFile(
      join(home, ".pi", "agent", "pi-snippets.json"),
      JSON.stringify({ snippetTrigger: ":" }),
      "utf8",
    );

    const config = await loadExtensionConfig(dir, home);
    expect(config).toEqual({ snippetTrigger: ":" });
  });

  it("prefers project config over global config", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pi-snippets-config-"));
    const home = await mkdtemp(join(tmpdir(), "pi-snippets-home-"));

    await mkdir(join(home, ".pi", "agent"), { recursive: true });
    await writeFile(
      join(home, ".pi", "agent", "pi-snippets.json"),
      JSON.stringify({ snippetTrigger: ":" }),
      "utf8",
    );

    await mkdir(join(dir, ".pi"), { recursive: true });
    await writeFile(
      join(dir, ".pi", "pi-snippets.json"),
      JSON.stringify({ snippetTrigger: "/" }),
      "utf8",
    );

    const config = await loadExtensionConfig(dir, home);
    expect(config).toEqual({ snippetTrigger: "/" });
  });

  it("falls back to default when values are invalid", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pi-snippets-config-"));
    const home = await mkdtemp(join(tmpdir(), "pi-snippets-home-"));
    await mkdir(join(dir, ".pi"), { recursive: true });
    await writeFile(
      join(dir, ".pi", "pi-snippets.json"),
      JSON.stringify({ snippetTrigger: "" }),
      "utf8",
    );

    const config = await loadExtensionConfig(dir, home);
    expect(config).toEqual({ snippetTrigger: ";" });
  });
});

// --- Security tests ---

describe("loadExtensionConfig security", () => {
  it("rejects trigger exceeding max length", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pi-snippets-config-"));
    const home = await mkdtemp(join(tmpdir(), "pi-snippets-home-"));
    await mkdir(join(dir, ".pi"), { recursive: true });
    await writeFile(
      join(dir, ".pi", "pi-snippets.json"),
      JSON.stringify({ snippetTrigger: ";".repeat(20) }),
      "utf8",
    );

    const config = await loadExtensionConfig(dir, home);
    expect(config).toEqual({ snippetTrigger: ";" });
  });

  it("rejects config files exceeding max size", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pi-snippets-config-"));
    const home = await mkdtemp(join(tmpdir(), "pi-snippets-home-"));
    await mkdir(join(dir, ".pi"), { recursive: true });
    await writeFile(
      join(dir, ".pi", "pi-snippets.json"),
      JSON.stringify({ snippetTrigger: ";", padding: "x".repeat(32 * 1024) }),
      "utf8",
    );

    const config = await loadExtensionConfig(dir, home);
    expect(config).toEqual({ snippetTrigger: ";" });
  });

  it("returns default for malformed JSON", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pi-snippets-config-"));
    const home = await mkdtemp(join(tmpdir(), "pi-snippets-home-"));
    await mkdir(join(dir, ".pi"), { recursive: true });
    await writeFile(join(dir, ".pi", "pi-snippets.json"), "not json", "utf8");

    const config = await loadExtensionConfig(dir, home);
    expect(config).toEqual({ snippetTrigger: ";" });
  });

  it("returns default when parsed value is not an object", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pi-snippets-config-"));
    const home = await mkdtemp(join(tmpdir(), "pi-snippets-home-"));
    await mkdir(join(dir, ".pi"), { recursive: true });
    await writeFile(join(dir, ".pi", "pi-snippets.json"), "42", "utf8");

    const config = await loadExtensionConfig(dir, home);
    expect(config).toEqual({ snippetTrigger: ";" });
  });
});
