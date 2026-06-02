import { readFile } from "node:fs/promises";
import { z } from "zod";
import { exportedTeamsSchema, paths, type ExportedTeam } from "./lib";

const WIKI_API_URL =
  "https://en.wikipedia.org/w/api.php?action=parse&page=2026_FIFA_World_Cup_squads&prop=wikitext&format=json&formatversion=2";

const ACCEPTED_FINAL_SQUAD_SIZES = [25, 26] as const;

// Wikipedia uses different display names than this app's DB for two nations.
export const WIKI_NAME_ALIASES: Record<string, string> = {
  "Czech Republic": "Czechia",
  Turkey: "Türkiye"
};

export const POSITION_MAP = {
  GK: "GOALKEEPER",
  DF: "DEFENDER",
  MF: "MIDFIELDER",
  FW: "FORWARD"
} as const satisfies Record<string, ExportedTeam["players"][number]["position"]>;

type WikiPosition = keyof typeof POSITION_MAP;
type Position = ExportedTeam["players"][number]["position"];

export type ScrapedPlayer = {
  name: string;
  position: Position;
  club: string;
};

export type ScrapedNation = {
  wikiName: string;
  players: ScrapedPlayer[];
};

export type ScrapeResult = {
  byCountryCode: Map<string, ScrapedNation>;
  unknownHeadings: string[];
};

const apiSchema = z.object({
  parse: z.object({
    wikitext: z.string().min(1)
  })
});

export async function fetchWikitext(): Promise<string> {
  const response = await fetch(WIKI_API_URL, {
    headers: {
      "user-agent": "wc26-nextjs data scraper (https://github.com/Davi-Gurgel/WC2026)"
    }
  });
  if (!response.ok) {
    throw new Error(`Wikipedia API ${response.status} ${response.statusText}`);
  }
  const json = apiSchema.parse(await response.json());
  return json.parse.wikitext;
}

const HEADING_SPLIT = /^===\s*([^=\n][^\n]*?)\s*===\s*$/m;

export function parseSquadsWikitext(
  wikitext: string,
  nameToCountryCode: Map<string, string>
): ScrapeResult {
  // Split returns: [preamble, name1, body1, name2, body2, ...]
  const parts = wikitext.split(HEADING_SPLIT);
  const byCountryCode = new Map<string, ScrapedNation>();
  const unknownHeadings: string[] = [];

  for (let i = 1; i < parts.length; i += 2) {
    const rawName = parts[i]?.trim();
    const body = parts[i + 1] ?? "";
    if (!rawName) continue;

    const dbName = WIKI_NAME_ALIASES[rawName] ?? rawName;
    const code = nameToCountryCode.get(dbName);
    if (!code) {
      unknownHeadings.push(rawName);
      continue;
    }

    const players = parsePlayersFromBody(body);
    byCountryCode.set(code, { wikiName: rawName, players });
  }

  return { byCountryCode, unknownHeadings };
}

// Matches {{nat fs g player|...}} including one level of nested templates
// (e.g. age={{birth date and age2|...}}). The inner alternation accepts either
// a single-level nested template or any non-brace character.
const PLAYER_TEMPLATE_REGEX = /\{\{nat fs g player\|((?:\{\{[^{}]*\}\}|[^{}])*?)\}\}/g;
const WIKILINK_REGEX = /\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g;
const PIPE_SENTINEL = "␟";

function parsePlayersFromBody(body: string): ScrapedPlayer[] {
  const players: ScrapedPlayer[] = [];
  for (const match of body.matchAll(PLAYER_TEMPLATE_REGEX)) {
    const fields = parseTemplateFields(match[1] ?? "");
    const pos = fields.pos?.trim();
    const name = stripWikilinks(fields.name ?? "");
    const club = stripWikilinks(fields.club ?? "");
    if (!pos || !isWikiPosition(pos)) continue;
    if (!name) continue;
    players.push({ name, position: POSITION_MAP[pos], club });
  }
  return players;
}

function isWikiPosition(value: string): value is WikiPosition {
  return value in POSITION_MAP;
}

function parseTemplateFields(raw: string): Record<string, string> {
  // Pipes inside [[...]] and inside nested {{...}} are not delimiters.
  // Mask them with a sentinel, split on the remaining top-level pipes, restore.
  const masked = raw
    .replace(/\[\[[^\]]+\]\]/g, (m) => m.replaceAll("|", PIPE_SENTINEL))
    .replace(/\{\{[^{}]*\}\}/g, (m) => m.replaceAll("|", PIPE_SENTINEL));

  const out: Record<string, string> = {};
  for (const part of masked.split("|")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).replaceAll(PIPE_SENTINEL, "|").trim();
    if (key) out[key] = value;
  }
  return out;
}

function stripWikilinks(value: string): string {
  return value.replaceAll(WIKILINK_REGEX, (_, label: string) => label).trim();
}

// === Merge ===

export type MergePlan = {
  updated: Array<{
    countryCode: string;
    name: string;
    previousCount: number;
    nextCount: number;
    matched: number;
    defaulted: number;
  }>;
  skippedPreliminary: Array<{ countryCode: string; name: string; count: number }>;
  skippedEmpty: Array<{ countryCode: string; name: string }>;
  unknownHeadings: string[];
};

export function applyScrapeToTeams(
  teams: ExportedTeam[],
  scrape: ScrapeResult,
  options: { finalSquadSize?: number; acceptedFinalSquadSizes?: readonly number[] } = {}
): { teams: ExportedTeam[]; plan: MergePlan } {
  const acceptedFinalSquadSizes = options.finalSquadSize
    ? [options.finalSquadSize]
    : (options.acceptedFinalSquadSizes ?? ACCEPTED_FINAL_SQUAD_SIZES);
  const plan: MergePlan = {
    updated: [],
    skippedPreliminary: [],
    skippedEmpty: [],
    unknownHeadings: scrape.unknownHeadings
  };

  const next = teams.map((team) => {
    const scraped = scrape.byCountryCode.get(team.countryCode);
    if (!scraped) {
      // Wikipedia heading not present at all (unlikely; would mean a name-mapping bug).
      return team;
    }

    const count = scraped.players.length;
    if (count === 0) {
      plan.skippedEmpty.push({ countryCode: team.countryCode, name: team.name });
      return team;
    }
    if (!acceptedFinalSquadSizes.includes(count)) {
      plan.skippedPreliminary.push({ countryCode: team.countryCode, name: team.name, count });
      return team;
    }

    const previousByName = new Map<string, number>();
    const previousByNorm = new Map<string, number>();
    for (const player of team.players) {
      previousByName.set(player.name, player.strength);
      previousByNorm.set(normalize(player.name), player.strength);
    }

    let matched = 0;
    let defaulted = 0;
    const newPlayers: ExportedTeam["players"] = scraped.players.map((player) => {
      const exact = previousByName.get(player.name);
      if (exact !== undefined) {
        matched++;
        return { name: player.name, position: player.position, strength: exact };
      }
      const norm = previousByNorm.get(normalize(player.name));
      if (norm !== undefined) {
        matched++;
        return { name: player.name, position: player.position, strength: norm };
      }
      defaulted++;
      return { name: player.name, position: player.position, strength: team.strength };
    });

    plan.updated.push({
      countryCode: team.countryCode,
      name: team.name,
      previousCount: team.players.length,
      nextCount: newPlayers.length,
      matched,
      defaulted
    });

    return { ...team, players: newPlayers };
  });

  return { teams: next, plan };
}

function normalize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// === SQL emission ===

export function renderSeedPlayersSql(teams: ExportedTeam[]): string {
  const lines = ["BEGIN TRANSACTION;"];
  for (const team of teams) {
    team.players.forEach((player, index) => {
      lines.push(
        `INSERT INTO players (team_country_code, name, position, strength, sort_order) VALUES (` +
          `${sqlString(team.countryCode)}, ${sqlString(player.name)}, ${sqlString(player.position)}, ${player.strength}, ${index});`
      );
    });
  }
  lines.push("COMMIT;");
  return `${lines.join("\n")}\n`;
}

function sqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

// === Helpers ===

export async function loadCurrentTeams(): Promise<ExportedTeam[]> {
  const raw = await readFile(paths.generatedTeams, "utf8");
  return exportedTeamsSchema.parse(JSON.parse(raw));
}

export function buildNameToCountryCode(teams: ExportedTeam[]): Map<string, string> {
  return new Map(teams.map((t) => [t.name, t.countryCode]));
}
