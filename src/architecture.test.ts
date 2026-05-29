import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

async function collectTypeScriptFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return collectTypeScriptFiles(path);
      return path.endsWith(".ts") && !path.endsWith(".test.ts") && !path.endsWith(".d.ts")
        ? [path]
        : [];
    }),
  );

  return files.flat();
}

async function readSourceFiles(
  directory: string,
): Promise<Array<{ file: string; source: string }>> {
  const files = await collectTypeScriptFiles(directory);
  return Promise.all(files.map(async (file) => ({ file, source: await readFile(file, "utf8") })));
}

describe("documented architecture", () => {
  it("keeps lib limited to shared helper modules", async () => {
    const libFiles = await collectTypeScriptFiles("src/lib");

    expect(libFiles.sort()).toEqual([
      "src/lib/history-snippets.ts",
      "src/lib/snippet-template.ts",
      "src/lib/snippets.ts",
    ]);
  });

  it("keeps lib free from infrastructure imports", async () => {
    const sources = await readSourceFiles("src/lib");

    expect(sources.map(({ source }) => source).join("\n")).not.toMatch(/from "node:/);
  });

  it("keeps TypeScript source imports free from emitted JavaScript extensions", async () => {
    const sources = await readSourceFiles("src");
    const violations = sources
      .filter(({ source }) => /from "[^"\n]+\.js"/.test(source))
      .map(({ file }) => file);

    expect(violations).toEqual([]);
  });

  it("keeps dependency direction between layers", async () => {
    const layers = [
      {
        directory: "src/domain",
        forbiddenImport: /from "\.\.\/(infra|bin)\//,
      },
      {
        directory: "src/lib",
        forbiddenImport: /from "\.\.\/(domain|infra|bin)\//,
      },
      {
        directory: "src/infra",
        forbiddenImport: /from "\.\.\/bin\//,
      },
    ];

    const violations = (
      await Promise.all(
        layers.map(async ({ directory, forbiddenImport }) => {
          const sources = await readSourceFiles(directory);
          return sources
            .filter(({ source }) => forbiddenImport.test(source))
            .map(({ file }) => file);
        }),
      )
    ).flat();

    expect(violations).toEqual([]);
  });
});
