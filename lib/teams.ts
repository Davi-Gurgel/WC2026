import { z } from "zod";
import teams from "@/data/national_teams.json";
import type { Team } from "@/lib/types/tournament";

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

const teamSchema = z
  .object({
    name: z.string().min(1),
    strength: strengthSchema,
    players: z.array(playerSchema).min(1),
    attackStrength: strengthSchema,
    defenseStrength: strengthSchema,
    midfieldStrength: strengthSchema,
    countryCode: z.string().trim().min(2).max(3),
    confederation: confederationSchema,
    group: groupSchema,
    fifaRanking: z.number().int().min(1).max(250).finite()
  })
  .strict();

const teamsSchema = z.array(teamSchema).length(48).superRefine((items, context) => {
  const seenCodes = new Set<string>();
  const groupCounts = new Map<string, number>();

  for (const [index, team] of items.entries()) {
    const countryCode = team.countryCode.toUpperCase();
    if (seenCodes.has(countryCode)) {
      context.addIssue({
        code: "custom",
        message: `Duplicate country code: ${countryCode}`,
        path: [index, "countryCode"]
      });
    }
    seenCodes.add(countryCode);
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

let cachedTeams: Team[] | null = null;

export function getAllTeams(): Team[] {
  if (cachedTeams) return cachedTeams;

  const parsedTeams = teamsSchema.parse(teams);

  cachedTeams = parsedTeams
    .map((team) => {
      const players = Object.freeze(team.players.map((player) => Object.freeze({ ...player })));
      return {
        ...team,
        players,
        maxPlayerStrength: Math.max(...players.map((player) => player.strength), 0)
      };
    })
    .sort((a, b) => a.group.localeCompare(b.group) || a.fifaRanking - b.fifaRanking)
    .map((team) => Object.freeze(team) as Team);

  return cachedTeams;
}

export function getTeamByCodeOrName(code: string, source: Team[] = getAllTeams()): Team | undefined {
  let decodedCode = code;
  try {
    decodedCode = decodeURIComponent(code);
  } catch {
    decodedCode = code;
  }

  return source.find(
    (team) =>
      team.countryCode.toLowerCase() === code.toLowerCase() ||
      team.name.toLowerCase() === decodedCode.toLowerCase()
  );
}
