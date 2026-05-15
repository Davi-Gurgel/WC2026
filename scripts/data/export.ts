import { exportTeamsFromDatabase, paths, writeExportedTeams } from "./lib";

async function main() {
  await writeExportedTeams(exportTeamsFromDatabase());
  console.log(`Wrote ${paths.generatedTeams}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
