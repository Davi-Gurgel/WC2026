import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import {
  buildDatabase,
  createTempDatabasePath,
  exportTeamsFromDatabase,
  paths,
  stringifyTeams,
  writeExportedTeams
} from "./lib";

async function withTempDir<T>(callback: (directory: string) => Promise<T>): Promise<T> {
  const directory = await mkdtemp(join(tmpdir(), "wc2026-data-test-"));
  try {
    return await callback(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

describe("data scripts", () => {
  it("builds a valid SQLite database from SQL seeds", async () => {
    const databasePath = createTempDatabasePath();
    try {
      await buildDatabase(databasePath);
      expect(exportTeamsFromDatabase(databasePath)).toHaveLength(48);
    } finally {
      await rm(databasePath, { force: true });
    }
  });

  it("exports deterministic JSON without flagEmoji", async () => {
    const databasePath = createTempDatabasePath();
    try {
      await buildDatabase(databasePath);
      const teams = exportTeamsFromDatabase(databasePath);
      const first = stringifyTeams(teams);
      const second = stringifyTeams(exportTeamsFromDatabase(databasePath));

      expect(first).toBe(second);
      expect(first).not.toContain("flagEmoji");
    } finally {
      await rm(databasePath, { force: true });
    }
  });

  it("can compare generated data with the committed JSON artifact", async () => {
    const databasePath = createTempDatabasePath();
    try {
      await buildDatabase(databasePath);
      const generated = stringifyTeams(exportTeamsFromDatabase(databasePath));
      const committed = await readFile(paths.generatedTeams, "utf8");

      expect(generated).toBe(committed);
    } finally {
      await rm(databasePath, { force: true });
    }
  });

  it("writes an exported JSON artifact to an explicit output path", async () => {
    await withTempDir(async (directory) => {
      const databasePath = createTempDatabasePath();
      try {
        await buildDatabase(databasePath);
        const outputPath = join(directory, "teams.json");

        await writeExportedTeams(exportTeamsFromDatabase(databasePath), outputPath);

        const written = await readFile(outputPath, "utf8");
        expect(written).toBe(stringifyTeams(exportTeamsFromDatabase(databasePath)));
      } finally {
        await rm(databasePath, { force: true });
      }
    });
  });

  it("detects diverged generated JSON content", async () => {
    await withTempDir(async (directory) => {
      const outputPath = join(directory, "teams.json");
      await writeFile(outputPath, "[]\n");

      const databasePath = createTempDatabasePath();
      try {
        await buildDatabase(databasePath);
        const generated = stringifyTeams(exportTeamsFromDatabase(databasePath));
        const stale = await readFile(outputPath, "utf8");

        expect(generated).not.toBe(stale);
      } finally {
        await rm(databasePath, { force: true });
      }
    });
  });
});
