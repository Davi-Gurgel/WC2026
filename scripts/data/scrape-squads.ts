import { readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { exportedTeamsSchema, buildDatabase, exportTeamsFromDatabase, paths, writeExportedTeams } from "./lib";
import {
  applyScrapeToTeams,
  buildNameToCountryCode,
  fetchWikitext,
  loadCurrentTeams,
  parseSquadsWikitext,
  renderSeedPlayersSql,
  type MergePlan
} from "./scrape-lib";

async function main() {
  const { values } = parseArgs({
    options: {
      "dry-run": { type: "boolean", default: false },
      "from-file": { type: "string" },
      help: { type: "boolean", default: false }
    }
  });

  if (values.help) {
    printHelp();
    return;
  }

  const currentTeams = await loadCurrentTeams();
  const nameMap = buildNameToCountryCode(currentTeams);

  const wikitext = values["from-file"]
    ? await readFile(values["from-file"], "utf8")
    : await fetchWikitext();

  const scrape = parseSquadsWikitext(wikitext, nameMap);
  const { teams: nextTeams, plan } = applyScrapeToTeams(currentTeams, scrape);

  printPlan(plan);

  if (plan.updated.length === 0) {
    console.log("\nNo nations had an accepted final 25/26-player squad to apply. Nothing to write.");
    return;
  }

  // Validate the merged data before touching the SQL file.
  exportedTeamsSchema.parse(nextTeams);

  if (values["dry-run"]) {
    console.log("\nDry run; not writing files.");
    return;
  }

  const sql = renderSeedPlayersSql(nextTeams);
  await writeFile(paths.seedPlayers, sql);
  console.log(`\nWrote ${paths.seedPlayers}`);

  await buildDatabase();
  console.log(`Wrote ${paths.database}`);

  await writeExportedTeams(exportTeamsFromDatabase());
  console.log(`Wrote ${paths.generatedTeams}`);

  console.log("\nDone. Run `npm test` to verify, then commit data/ changes.");
}

function printHelp() {
  console.log(
    `Scrape 2026 FIFA World Cup squads from Wikipedia and refresh SQL seeds.

Usage:
  npm run data:scrape -- [options]

Options:
  --dry-run             Parse, plan, and print summary without writing.
  --from-file <path>    Read wikitext from a local file instead of fetching.
  --help                Show this message.

Pipeline:
  scrape -> rewrite data/sql/seed_players.sql
         -> rebuild data/wc2026.sqlite
         -> rewrite data/national_teams.json

Nations with a final 25- or 26-player squad are updated. Preliminary lists
(>26) and unannounced placeholders (0) are skipped; existing players are retained.
`
  );
}

function printPlan(plan: MergePlan) {
  console.log(`Updated ${plan.updated.length} nation(s) with final 25/26-player squads:`);
  for (const u of plan.updated) {
    console.log(
      `  ${u.countryCode}  ${u.name.padEnd(24)} ${u.previousCount}->${u.nextCount} players  (${u.matched} matched, ${u.defaulted} defaulted)`
    );
  }

  if (plan.skippedPreliminary.length > 0) {
    console.log(`\nSkipped ${plan.skippedPreliminary.length} preliminary list(s) outside accepted 25/26 size:`);
    for (const s of plan.skippedPreliminary) {
      console.log(`  ${s.countryCode}  ${s.name.padEnd(24)} ${s.count} players`);
    }
  }

  if (plan.skippedEmpty.length > 0) {
    console.log(`\nSkipped ${plan.skippedEmpty.length} unannounced squad(s):`);
    console.log(`  ${plan.skippedEmpty.map((s) => `${s.countryCode} ${s.name}`).join(", ")}`);
  }

  if (plan.unknownHeadings.length > 0) {
    console.log(
      `\nIgnored ${plan.unknownHeadings.length} unknown heading(s) (not a tracked nation): ${plan.unknownHeadings.join(", ")}`
    );
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
