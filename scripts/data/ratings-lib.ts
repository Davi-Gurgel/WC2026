import type { ExportedTeam } from "./lib";

// === CSV parsing ===

// Accepts the most common column names from Kaggle EA FC datasets.
const NAME_COLS = ["short_name", "name", "long_name", "player_name", "fullname"];
const OVR_COLS = ["overall", "ovr", "rating", "oa"];

export type RatingRow = { name: string; overall: number };

export function parseCsvRatings(csv: string): RatingRow[] {
  const lines = csv.split(/\r?\n/);
  if (lines.length < 2) throw new Error("CSV has no data rows");

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());

  const nameIdx = NAME_COLS.map((c) => header.indexOf(c)).find((i) => i !== -1);
  const ovrIdx = OVR_COLS.map((c) => header.indexOf(c)).find((i) => i !== -1);

  if (nameIdx === undefined) {
    throw new Error(
      `Could not find a name column. Expected one of: ${NAME_COLS.join(", ")}. Found: ${header.join(", ")}`
    );
  }
  if (ovrIdx === undefined) {
    throw new Error(
      `Could not find an overall rating column. Expected one of: ${OVR_COLS.join(", ")}. Found: ${header.join(", ")}`
    );
  }

  const rows: RatingRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const fields = parseCsvLine(line);
    const name = fields[nameIdx]?.trim();
    const ovrRaw = fields[ovrIdx]?.trim();
    if (!name || !ovrRaw) continue;
    const overall = parseInt(ovrRaw, 10);
    if (isNaN(overall)) continue;
    rows.push({ name, overall });
  }
  return rows;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(field);
      field = "";
    } else {
      field += ch;
    }
  }
  fields.push(field);
  return fields;
}

// === Name matching ===

export type RatingIndex = {
  byExact: Map<string, number>;
  byReversed: Map<string, number>;
  byLastName: Map<string, number[]>; // last token → all OVRs (used for unique-last-name lookup)
};

export function buildRatingMap(rows: RatingRow[]): RatingIndex {
  const byExact = new Map<string, number>();
  const byReversed = new Map<string, number>();
  const byLastName = new Map<string, number[]>();

  for (const row of rows) {
    const key = normalize(row.name);
    const best = (map: Map<string, number>, k: string) => {
      const ex = map.get(k);
      if (ex === undefined || row.overall > ex) map.set(k, row.overall);
    };

    best(byExact, key);

    const tokens = key.split(" ").filter(Boolean);
    if (tokens.length >= 2) {
      // Tier 2: reversed token order (fixes "Son Heung-min" ↔ "Heung-Min Son")
      const reversed = [...tokens].reverse().join(" ");
      if (reversed !== key) best(byReversed, reversed);

      // Tier 3: index by last token for unique-last-name fallback
      const last = tokens[tokens.length - 1];
      if (!byLastName.has(last)) byLastName.set(last, []);
      byLastName.get(last)!.push(row.overall);
    }
  }

  return { byExact, byReversed, byLastName };
}

// === Apply ratings to teams ===

export type RatingsPlan = {
  updated: Array<{
    countryCode: string;
    name: string;
    matched: number;
    defaulted: number;
    teamMedian: number;
  }>;
};

export function applyRatingsToTeams(
  teams: ExportedTeam[],
  index: RatingIndex
): { teams: ExportedTeam[]; plan: RatingsPlan } {
  const plan: RatingsPlan = { updated: [] };

  const next = teams.map((team) => {
    const matchedStrengths: number[] = [];

    for (const player of team.players) {
      const rating = lookupRating(player.name, index);
      if (rating !== undefined) matchedStrengths.push(rating);
    }

    const teamMedian =
      matchedStrengths.length > 0 ? median(matchedStrengths) : team.strength;

    let matched = 0;
    let defaulted = 0;

    const newPlayers: ExportedTeam["players"] = team.players.map((player) => {
      const rating = lookupRating(player.name, index);
      if (rating !== undefined) {
        matched++;
        return { ...player, strength: rating };
      }
      defaulted++;
      return { ...player, strength: defaultStrength(player.name, team.countryCode, teamMedian) };
    });

    plan.updated.push({
      countryCode: team.countryCode,
      name: team.name,
      matched,
      defaulted,
      teamMedian,
    });

    return { ...team, players: newPlayers };
  });

  return { teams: next, plan };
}

function lookupRating(name: string, index: RatingIndex): number | undefined {
  const key = normalize(name);

  // Tier 1: exact normalized match
  const exact = index.byExact.get(key);
  if (exact !== undefined) return exact;

  // Tier 2: reversed token order ("Son Heung-min" ↔ "Heung-Min Son")
  // byReversed is keyed by the reversed form of the CSV name, so look up by our key directly.
  const tokens = key.split(" ").filter(Boolean);
  if (tokens.length >= 2) {
    const rev = index.byReversed.get(key);
    if (rev !== undefined) return rev;

    // Tier 3: unique last name — only match when there is exactly one player
    // in the entire CSV with this last name (avoids false positives on Kim/Lee)
    const last = tokens[tokens.length - 1];
    const candidates = index.byLastName.get(last);
    if (candidates?.length === 1) return candidates[0];
  }

  return undefined;
}

function normalize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

function defaultStrength(playerName: string, countryCode: string, teamMedian: number): number {
  const offset = (stableHash(`${countryCode}|${playerName}`) % 7) - 3;
  return clampStrength(teamMedian + offset);
}

function stableHash(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function clampStrength(value: number): number {
  return Math.min(100, Math.max(1, value));
}

// === Team strength recalculation ===

export function recalculateTeamStrengths(teams: ExportedTeam[]): ExportedTeam[] {
  return teams.map((team) => {
    const all = team.players.map((p) => p.strength);
    const forwards = team.players.filter((p) => p.position === "FORWARD").map((p) => p.strength);
    const defenders = team.players
      .filter((p) => p.position === "DEFENDER" || p.position === "GOALKEEPER")
      .map((p) => p.strength);
    const midfielders = team.players.filter((p) => p.position === "MIDFIELDER").map((p) => p.strength);

    return {
      ...team,
      strength: median(all),
      attackStrength: forwards.length > 0 ? median(forwards) : median(all),
      defenseStrength: defenders.length > 0 ? median(defenders) : median(all),
      midfieldStrength: midfielders.length > 0 ? median(midfielders) : median(all),
    };
  });
}

export function renderSeedTeamsSql(teams: ExportedTeam[]): string {
  const lines = ["BEGIN TRANSACTION;"];
  for (const team of teams) {
    lines.push(
      `INSERT INTO teams (country_code, name, confederation, group_letter, strength, attack_strength, defense_strength, midfield_strength, fifa_ranking) VALUES (` +
        `${sqlString(team.countryCode)}, ${sqlString(team.name)}, ${sqlString(team.confederation)}, ${sqlString(team.group)}, ` +
        `${team.strength}, ${team.attackStrength}, ${team.defenseStrength}, ${team.midfieldStrength}, ${team.fifaRanking});`
    );
  }
  lines.push("COMMIT;");
  return `${lines.join("\n")}\n`;
}

function sqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}
