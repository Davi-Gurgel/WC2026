import { readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { z } from "zod";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export const paths = {
  projectRoot,
  database: join(projectRoot, "data/wc2026.sqlite"),
  schema: join(projectRoot, "data/sql/schema.sql"),
  seedTeams: join(projectRoot, "data/sql/seed_teams.sql"),
  seedPlayers: join(projectRoot, "data/sql/seed_players.sql"),
  generatedTeams: join(projectRoot, "data/national_teams.json")
};

const positionSchema = z.enum(["GOALKEEPER", "DEFENDER", "MIDFIELDER", "FORWARD"]);
const confederationSchema = z.enum(["AFC", "CAF", "CONCACAF", "CONMEBOL", "OFC", "UEFA"]);
const groupSchema = z.enum(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]);
const strengthSchema = z.number().int().min(1).max(100).finite();

const playerSchema = z
  .object({
    name: z.string().min(1),
    strength: strengthSchema,
    position: positionSchema
  })
  .strict();

export const exportedTeamSchema = z
  .object({
    name: z.string().min(1),
    strength: strengthSchema,
    players: z.array(playerSchema).min(1),
    attackStrength: strengthSchema,
    defenseStrength: strengthSchema,
    midfieldStrength: strengthSchema,
    countryCode: z.string().trim().min(2).max(3).regex(/^[A-Z]+$/),
    confederation: confederationSchema,
    group: groupSchema,
    fifaRanking: z.number().int().min(1).max(250).finite()
  })
  .strict()
  .superRefine((team, context) => {
    if (!team.players.some((player) => player.position === "GOALKEEPER")) {
      context.addIssue({
        code: "custom",
        message: `${team.countryCode} must have at least one goalkeeper`,
        path: ["players"]
      });
    }
  });

export const exportedTeamsSchema = z.array(exportedTeamSchema).length(48).superRefine((items, context) => {
  const seenCodes = new Set<string>();
  const groupCounts = new Map<string, number>();

  for (const [index, team] of items.entries()) {
    if ("flagEmoji" in team) {
      context.addIssue({
        code: "custom",
        message: "flagEmoji must not be exported",
        path: [index, "flagEmoji"]
      });
    }

    if (seenCodes.has(team.countryCode)) {
      context.addIssue({
        code: "custom",
        message: `Duplicate country code: ${team.countryCode}`,
        path: [index, "countryCode"]
      });
    }

    seenCodes.add(team.countryCode);
    groupCounts.set(team.group, (groupCounts.get(team.group) ?? 0) + 1);
  }

  for (const group of groupSchema.options) {
    if ((groupCounts.get(group) ?? 0) !== 4) {
      context.addIssue({
        code: "custom",
        message: `Group ${group} must contain exactly four teams`
      });
    }
  }
});

export type ExportedTeam = z.infer<typeof exportedTeamSchema>;

type TeamRow = {
  country_code: string;
  name: string;
  confederation: string;
  group_letter: string;
  strength: number;
  attack_strength: number;
  defense_strength: number;
  midfield_strength: number;
  fifa_ranking: number;
};

type PlayerRow = {
  name: string;
  position: string;
  strength: number;
};

export async function buildDatabase(databasePath = paths.database): Promise<void> {
  await rm(databasePath, { force: true });

  const database = new DatabaseSync(databasePath);
  try {
    database.exec("PRAGMA foreign_keys = ON;");
    database.exec(await readFile(paths.schema, "utf8"));
    database.exec(await readFile(paths.seedTeams, "utf8"));
    database.exec(await readFile(paths.seedPlayers, "utf8"));
    validateDatabase(database);
  } finally {
    database.close();
  }
}

export function exportTeamsFromDatabase(databasePath = paths.database): ExportedTeam[] {
  const database = new DatabaseSync(databasePath, { readOnly: true });
  try {
    const teams = database
      .prepare(
        `SELECT country_code, name, confederation, group_letter, strength, attack_strength,
                defense_strength, midfield_strength, fifa_ranking
           FROM teams
          ORDER BY group_letter ASC, fifa_ranking ASC, name ASC`
      )
      .all() as TeamRow[];

    const playerStatement = database.prepare(
      `SELECT name, position, strength
         FROM players
        WHERE team_country_code = ?
        ORDER BY sort_order ASC, name ASC`
    );

    const exported = teams.map((team) => ({
      name: team.name,
      countryCode: team.country_code,
      confederation: team.confederation,
      group: team.group_letter,
      strength: team.strength,
      attackStrength: team.attack_strength,
      defenseStrength: team.defense_strength,
      midfieldStrength: team.midfield_strength,
      fifaRanking: team.fifa_ranking,
      players: (playerStatement.all(team.country_code) as PlayerRow[]).map((player) => ({
        name: player.name,
        position: player.position,
        strength: player.strength
      }))
    }));

    return exportedTeamsSchema.parse(exported);
  } finally {
    database.close();
  }
}

export function stringifyTeams(teams: ExportedTeam[]): string {
  const first = `${JSON.stringify(teams, null, 2)}\n`;
  const second = `${JSON.stringify(exportedTeamsSchema.parse(JSON.parse(first)), null, 2)}\n`;

  if (first !== second) {
    throw new Error("Export is not deterministic.");
  }

  return first;
}

export async function writeExportedTeams(teams: ExportedTeam[], outputPath = paths.generatedTeams): Promise<void> {
  await writeFile(outputPath, stringifyTeams(teams));
}

export function createTempDatabasePath(): string {
  return join(tmpdir(), `wc2026-${randomUUID()}.sqlite`);
}

function validateDatabase(database: DatabaseSync): void {
  const foreignKeyIssues = database.prepare("PRAGMA foreign_key_check;").all();
  if (foreignKeyIssues.length > 0) {
    throw new Error(`SQLite foreign key check failed: ${JSON.stringify(foreignKeyIssues)}`);
  }

  const integrity = database.prepare("PRAGMA integrity_check;").all() as Array<{ integrity_check: string }>;
  const integrityResult = integrity.map((row) => row.integrity_check).join("\n");
  if (integrityResult !== "ok") {
    throw new Error(`SQLite integrity check failed: ${integrityResult}`);
  }
}
