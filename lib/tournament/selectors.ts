import type { Match, Team, TournamentState } from "@/lib/types/tournament";
import { phaseLabel } from "@/lib/tournament/constants";

export function getAllGroupMatches(state: TournamentState): Match[] {
  return state.groups.flatMap((group) => group.matches);
}

export function getGroupMatchesForDay(state: TournamentState, day: number): Match[] {
  return getAllGroupMatches(state).filter((match) => match.round === day);
}

export function getAllKnockoutMatches(state: TournamentState): Match[] {
  return [
    ...state.r32Matches,
    ...state.r16Matches,
    ...state.quarterFinals,
    ...state.semiFinals,
    ...(state.thirdPlaceMatch ? [state.thirdPlaceMatch] : []),
    ...(state.finalMatch ? [state.finalMatch] : [])
  ];
}

export function findTeamByCodeOrName(state: TournamentState, codeOrName: string): Team | undefined {
  if (!state.active) return undefined;

  const normalized = codeOrName.toLowerCase();
  return state.allTeams.find(
    (team) => team.countryCode.toLowerCase() === normalized || team.name.toLowerCase() === normalized
  );
}

export function getMatchesForTeam(state: TournamentState, teamName: string): Match[] {
  const matches: Match[] = [];
  for (const group of state.groups) {
    collectTeamMatches(group.matches, teamName, matches);
  }
  collectTeamMatches(state.r32Matches, teamName, matches);
  collectTeamMatches(state.r16Matches, teamName, matches);
  collectTeamMatches(state.quarterFinals, teamName, matches);
  collectTeamMatches(state.semiFinals, teamName, matches);
  if (state.thirdPlaceMatch) collectTeamMatches([state.thirdPlaceMatch], teamName, matches);
  if (state.finalMatch) collectTeamMatches([state.finalMatch], teamName, matches);

  return matches;
}

export type TournamentMatchCollections = {
  groupMatches: Match[];
  knockoutMatches: Match[];
  playedGroupMatches: Match[];
  playedKnockoutMatches: Match[];
  playedMatches: Match[];
};

export function collectTournamentMatches(state: TournamentState): TournamentMatchCollections {
  const groupMatches = getAllGroupMatches(state);
  const knockoutMatches = getAllKnockoutMatches(state);
  const playedGroupMatches = groupMatches.filter((match) => match.played);
  const playedKnockoutMatches = knockoutMatches.filter((match) => match.played);

  return {
    groupMatches,
    knockoutMatches,
    playedGroupMatches,
    playedKnockoutMatches,
    playedMatches: [...playedGroupMatches, ...playedKnockoutMatches]
  };
}

export function isTournamentCompleted(state: TournamentState): boolean {
  return state.phase === "FINISHED" && Boolean(state.finalMatch?.played);
}

export type TournamentStats = {
  totalGroupMatches: number;
  simulatedGroupMatches: number;
  totalGoals: number;
  totalMatches: number;
  averageGoals: number;
  phase: string;
  currentGroupMatchDay: number;
  champion: string | null;
};

export function getTournamentStats(
  state: TournamentState,
  matches: TournamentMatchCollections = collectTournamentMatches(state)
): TournamentStats {
  const { groupMatches, playedGroupMatches, playedMatches } = matches;
  const totalGoals = playedMatches.reduce((sum, match) => sum + match.homeScore + match.awayScore, 0);

  return {
    totalGroupMatches: groupMatches.length,
    simulatedGroupMatches: playedGroupMatches.length,
    totalGoals,
    totalMatches: playedMatches.length,
    averageGoals: playedMatches.length ? Math.round((totalGoals / playedMatches.length) * 100) / 100 : 0,
    phase: phaseLabel(state.phase),
    currentGroupMatchDay: state.currentGroupMatchDay,
    champion: state.champion?.name ?? null
  };
}

export function getMatchActivityTime(match: Pick<Match, "date" | "matchNumber" | "round">): number {
  if (match.date) return new Date(match.date).getTime();
  return match.matchNumber ? Date.UTC(2026, 6, match.matchNumber) : match.round;
}

function collectTeamMatches(source: Match[], teamName: string, target: Match[]) {
  for (const match of source) {
    if (match.homeTeam.name === teamName || match.awayTeam.name === teamName) {
      target.push(match);
    }
  }
}
