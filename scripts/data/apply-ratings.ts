import { readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import {
  buildDatabase,
  exportTeamsFromDatabase,
  exportedTeamsSchema,
  paths,
  writeExportedTeams,
} from "./lib";
import {
  applyRatingsToTeams,
  buildRatingMap,
  parseCsvRatings,
  recalculateTeamStrengths,
  renderSeedTeamsSql,
  type RatingsPlan,
} from "./ratings-lib";
import { loadCurrentTeams, renderSeedPlayersSql } from "./scrape-lib";

async function main() {
  const { values } = parseArgs({
    options: {
      csv: { type: "string" },
      "dry-run": { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
  });

  if (values.help || !values.csv) {
    printHelp();
    return;
  }

  const csvText = await readFile(values.csv, "utf8");
  const rows = parseCsvRatings(csvText);
  console.log(`Loaded ${rows.length} player ratings from ${values.csv}`);

  const ratingMap = buildRatingMap(rows);
  const currentTeams = await loadCurrentTeams();
  const { teams: ratedTeams, plan } = applyRatingsToTeams(currentTeams, ratingMap);
  const nextTeams = recalculateTeamStrengths(ratedTeams);

  printPlan(plan);

  // Validate before writing
  exportedTeamsSchema.parse(nextTeams);

  if (values["dry-run"]) {
    console.log("\nDry run; not writing files.");
    return;
  }

  const teamSql = renderSeedTeamsSql(nextTeams);
  await writeFile(paths.seedTeams, teamSql);
  console.log(`\nWrote ${paths.seedTeams}`);

  const sql = renderSeedPlayersSql(nextTeams);
  await writeFile(paths.seedPlayers, sql);
  console.log(`Wrote ${paths.seedPlayers}`);

  await buildDatabase();
  console.log(`Wrote ${paths.database}`);

  await writeExportedTeams(exportTeamsFromDatabase());
  console.log(`Wrote ${paths.generatedTeams}`);

  console.log("\nDone. Run `npm test` to verify, then commit data/ changes.");
}

function printHelp() {
  console.log(
    `Apply EA FC player ratings from a CSV file to national team squads.

Usage:
  npm run data:ratings -- --csv <path/to/ratings.csv> [options]

Options:
  --csv <path>    Path to the EA FC ratings CSV file (required).
  --dry-run       Parse, plan, and print summary without writing.
  --help          Show this message.

Supported CSV column names:
  Name:    short_name | name | long_name | player_name | fullname
  Rating:  overall | ovr | rating | oa

Pipeline:
  read CSV -> match player names -> rewrite data/sql/seed_players.sql
           -> rebuild data/wc2026.sqlite -> rewrite data/national_teams.json

Unmatched players get the team median ± a small deterministic offset.
`
  );
}

function printPlan(plan: RatingsPlan) {
  const totalMatched = plan.updated.reduce((s, u) => s + u.matched, 0);
  const totalDefaulted = plan.updated.reduce((s, u) => s + u.defaulted, 0);
  console.log(`\n${totalMatched} players matched, ${totalDefaulted} defaulted to team median.\n`);

  for (const u of plan.updated) {
    const pct = Math.round((u.matched / (u.matched + u.defaulted)) * 100);
    console.log(
      `  ${u.countryCode}  ${u.name.padEnd(26)} ${String(u.matched).padStart(2)} matched  ${String(u.defaulted).padStart(2)} defaulted  median=${u.teamMedian}  (${pct}%)`
    );
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
