import { buildDatabase, exportTeamsFromDatabase, paths } from "./lib";
import { loadCurrentTeams } from "./scrape-lib";
import { recalculateTeamStrengths, renderSeedTeamsSql } from "./ratings-lib";
import { writeFile } from "node:fs/promises";

async function main() {
  const teams = await loadCurrentTeams();
  const next = recalculateTeamStrengths(teams);

  await writeFile(paths.seedTeams, renderSeedTeamsSql(next));
  console.log(`Wrote ${paths.seedTeams}`);

  await buildDatabase();
  console.log(`Wrote ${paths.database}`);

  const { writeExportedTeams } = await import("./lib");
  await writeExportedTeams(exportTeamsFromDatabase());
  console.log(`Wrote ${paths.generatedTeams}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
