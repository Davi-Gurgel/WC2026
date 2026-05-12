import type { Match, Player, Scorer, Team, TeamGroupStats, TournamentState, WorldCupGroup } from "@/lib/types/tournament";

export function isTournamentState(value: unknown): value is TournamentState {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<TournamentState>;
  return (
    isArrayOf(candidate.allTeams, isTeam) &&
    isArrayOf(candidate.groups, isWorldCupGroup) &&
    isArrayOf(candidate.topScorers, isScorer) &&
    isArrayOf(candidate.r32Matches, isMatch) &&
    isArrayOf(candidate.r16Matches, isMatch) &&
    isArrayOf(candidate.quarterFinals, isMatch) &&
    isArrayOf(candidate.semiFinals, isMatch) &&
    isTournamentPhase(candidate.phase) &&
    typeof candidate.currentGroupMatchDay === "number" &&
    typeof candidate.active === "boolean" &&
    isNullable(candidate.thirdPlaceMatch, isMatch) &&
    isNullable(candidate.finalMatch, isMatch) &&
    isNullable(candidate.champion, isTeam) &&
    isNullable(candidate.runnerUp, isTeam) &&
    isArrayOf(candidate.qualified3rd, isTeam)
  );
}

export function isTournamentPhase(value: unknown): value is TournamentState["phase"] {
  return (
    value === "NOT_STARTED" ||
    value === "GROUP_STAGE" ||
    value === "ROUND_OF_32" ||
    value === "ROUND_OF_16" ||
    value === "QUARTERFINAL" ||
    value === "SEMIFINAL" ||
    value === "FINISHED"
  );
}

export function isScorer(value: unknown): value is Scorer {
  if (!isRecord(value)) return false;
  return isString(value.playerName) && isString(value.teamName) && isFiniteNumber(value.goals);
}

export function isKnockoutRound(value: unknown): value is Match["knockoutRound"] {
  return (
    value === "ROUND_OF_32" ||
    value === "ROUND_OF_16" ||
    value === "QUARTERFINAL" ||
    value === "SEMIFINAL" ||
    value === "THIRD_PLACE" ||
    value === "FINAL"
  );
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

export function isArrayOf<T>(value: unknown, guard: (item: unknown) => item is T): value is T[] {
  return Array.isArray(value) && value.every(guard);
}

export function isNullable<T>(value: unknown, guard: (item: unknown) => item is T): value is T | null {
  return value === null || guard(value);
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isPosition(value: unknown): value is Player["position"] {
  return value === "GOALKEEPER" || value === "DEFENDER" || value === "MIDFIELDER" || value === "FORWARD";
}

function isPlayer(value: unknown): value is Player {
  if (!isRecord(value)) return false;
  return isString(value.name) && isFiniteNumber(value.strength) && isPosition(value.position);
}

function isTeam(value: unknown): value is Team {
  if (!isRecord(value)) return false;
  return (
    isString(value.name) &&
    isFiniteNumber(value.strength) &&
    isArrayOf(value.players, isPlayer) &&
    isFiniteNumber(value.attackStrength) &&
    isFiniteNumber(value.defenseStrength) &&
    isFiniteNumber(value.midfieldStrength) &&
    (value.maxPlayerStrength === undefined || isFiniteNumber(value.maxPlayerStrength)) &&
    isString(value.countryCode) &&
    isString(value.confederation) &&
    isString(value.group) &&
    isFiniteNumber(value.fifaRanking)
  );
}

function isTeamGroupStats(value: unknown): value is TeamGroupStats {
  if (!isRecord(value)) return false;
  return (
    isString(value.teamName) &&
    (value.countryCode === undefined || isString(value.countryCode)) &&
    isFiniteNumber(value.played) &&
    isFiniteNumber(value.wins) &&
    isFiniteNumber(value.draws) &&
    isFiniteNumber(value.losses) &&
    isFiniteNumber(value.goalsFor) &&
    isFiniteNumber(value.goalsAgainst) &&
    isFiniteNumber(value.goalDifference) &&
    isFiniteNumber(value.points)
  );
}

function isGoalScorers(value: unknown): value is Record<string, string[]> {
  return isRecord(value) && Object.values(value).every((scorers) => isArrayOf(scorers, isString));
}

function isMatch(value: unknown): value is Match {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isTeam(value.homeTeam) &&
    isTeam(value.awayTeam) &&
    isFiniteNumber(value.homeScore) &&
    isFiniteNumber(value.awayScore) &&
    (value.date === null || isString(value.date)) &&
    isFiniteNumber(value.round) &&
    typeof value.played === "boolean" &&
    (value.groupName === undefined || isString(value.groupName)) &&
    typeof value.knockout === "boolean" &&
    (value.knockoutRound === undefined || isKnockoutRound(value.knockoutRound)) &&
    typeof value.wentToExtraTime === "boolean" &&
    typeof value.wentToPenalties === "boolean" &&
    isFiniteNumber(value.homePenalties) &&
    isFiniteNumber(value.awayPenalties) &&
    (value.venue === undefined || isString(value.venue)) &&
    (value.matchNumber === undefined || isFiniteNumber(value.matchNumber)) &&
    isGoalScorers(value.goalScorers)
  );
}

function isWorldCupGroup(value: unknown): value is WorldCupGroup {
  if (!isRecord(value)) return false;
  return isString(value.letter) && isArrayOf(value.teams, isTeam) && isArrayOf(value.matches, isMatch) && isArrayOf(value.standings, isTeamGroupStats);
}
