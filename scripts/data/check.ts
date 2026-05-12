import { readFile, rm } from "node:fs/promises";
import { buildDatabase, createTempDatabasePath, exportTeamsFromDatabase, paths, stringifyTeams } from "./lib";

async function main() {
  const tempDatabase = createTempDatabasePath();

  try {
    await buildDatabase(tempDatabase);
    const expected = await readFile(paths.generatedTeams, "utf8");
    const actual = stringifyTeams(exportTeamsFromDatabase(tempDatabase));

    if (actual !== expected) {
      console.error("data/national_teams.json is out of sync with data/sql/*.sql.");
      console.error("Run: npm run data:build && npm run data:export");
      process.exitCode = 1;
    }
  } finally {
    await rm(tempDatabase, { force: true });
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
