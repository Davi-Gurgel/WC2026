import type { Match, Team, TournamentState, WorldCupGroup } from "@/lib/types/tournament";
import { GROUP_LETTERS } from "@/lib/tournament/constants";
import { buildGroupMatch } from "@/lib/tournament/matches";
import { computeStandings } from "@/lib/tournament/standings";

export function createEmptyTournamentState(): TournamentState {
  return {
    allTeams: [],
    groups: [],
    topScorers: [],
    r32Matches: [],
    r16Matches: [],
    quarterFinals: [],
    semiFinals: [],
    thirdPlaceMatch: null,
    finalMatch: null,
    phase: "NOT_STARTED",
    currentGroupMatchDay: 0,
    active: false,
    champion: null,
    runnerUp: null,
    qualified3rd: []
  };
}

export function initializeTournament(teams: Team[]): TournamentState {
  if (teams.length !== 48) {
    throw new Error("Exactly 48 teams are required to start the World Cup.");
  }

  const allTeams = [...teams].sort((a, b) => a.group.localeCompare(b.group) || a.fifaRanking - b.fifaRanking);
  const groups = GROUP_LETTERS.map<WorldCupGroup>((letter) => ({
    letter,
    teams: allTeams.filter((team) => team.group.toUpperCase() === letter),
    matches: [],
    standings: []
  }));

  for (const group of groups) {
    group.matches = generateGroupMatches(group);
    group.standings = computeStandings(group.teams, []);
  }

  return {
    ...createEmptyTournamentState(),
    allTeams,
    groups,
    phase: "GROUP_STAGE",
    currentGroupMatchDay: 1,
    active: true
  };
}

function generateGroupMatches(group: WorldCupGroup): Match[] {
  const [t0, t1, t2, t3] = group.teams;
  if (!t0 || !t1 || !t2 || !t3) return [];
  const base = new Date("2026-06-11T00:00:00Z");

  return [
    buildGroupMatch(t0, t1, base, group.letter, 1, 1),
    buildGroupMatch(t2, t3, base, group.letter, 1, 2),
    buildGroupMatch(t0, t2, addDays(base, 3), group.letter, 2, 3),
    buildGroupMatch(t1, t3, addDays(base, 3), group.letter, 2, 4),
    buildGroupMatch(t0, t3, addDays(base, 6), group.letter, 3, 5),
    buildGroupMatch(t1, t2, addDays(base, 6), group.letter, 3, 6)
  ];
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
