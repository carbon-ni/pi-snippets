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

describe("documented architecture", () => {
  it("keeps lib free from infrastructure imports", async () => {
    const libFiles = await collectTypeScriptFiles("src/lib");
    const contents = await Promise.all(libFiles.map((file) => readFile(file, "utf8")));

    expect(contents.join("\n")).not.toMatch(/from "node:/);
  });
});
