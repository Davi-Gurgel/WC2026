import { isArrayOf, isFiniteNumber, isKnockoutRound, isNullable, isRecord, isScorer, isString, isTournamentPhase } from "@/lib/tournament/guards";
import { STORAGE_VERSION } from "@/lib/tournament/storage-schema";
import type { CompactGroup, CompactMatch, CompactTournamentState, StoredCompactTournamentState, StoredTournamentState } from "@/lib/tournament/storage-schema";

export function isStoredTournamentState(value: unknown): value is StoredTournamentState {
  return isStoredCompactTournamentState(value);
}

function isStoredCompactTournamentState(value: unknown): value is StoredCompactTournamentState {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<StoredCompactTournamentState>;
  return candidate.version === STORAGE_VERSION && isCompactTournamentState(candidate.state);
}

function isCompactTournamentState(value: unknown): value is CompactTournamentState {
  if (!isRecord(value)) return false;

  return (
    isArrayOf(value.groups, isCompactGroup) &&
    isArrayOf(value.topScorers, isScorer) &&
    isArrayOf(value.r32Matches, isCompactMatch) &&
    isArrayOf(value.r16Matches, isCompactMatch) &&
    isArrayOf(value.quarterFinals, isCompactMatch) &&
    isArrayOf(value.semiFinals, isCompactMatch) &&
    isNullable(value.thirdPlaceMatch, isCompactMatch) &&
    isNullable(value.finalMatch, isCompactMatch) &&
    isTournamentPhase(value.phase) &&
    isFiniteNumber(value.currentGroupMatchDay) &&
    typeof value.active === "boolean" &&
    (value.championCode === null || isString(value.championCode)) &&
    (value.runnerUpCode === null || isString(value.runnerUpCode)) &&
    isArrayOf(value.qualified3rdCodes, isString)
  );
}

function isCompactGroup(value: unknown): value is CompactGroup {
  return isRecord(value) && isString(value.letter) && isArrayOf(value.matches, isCompactMatch);
}

function isCompactMatch(value: unknown): value is CompactMatch {
  if (!isRecord(value)) return false;

  return (
    isString(value.id) &&
    isString(value.h) &&
    isString(value.a) &&
    isFiniteNumber(value.hs) &&
    isFiniteNumber(value.as) &&
    (value.d === null || isString(value.d)) &&
    isFiniteNumber(value.r) &&
    typeof value.p === "boolean" &&
    (value.g === undefined || isString(value.g)) &&
    typeof value.k === "boolean" &&
    (value.kr === undefined || isKnockoutRound(value.kr)) &&
    typeof value.et === "boolean" &&
    typeof value.pen === "boolean" &&
    isFiniteNumber(value.hp) &&
    isFiniteNumber(value.ap) &&
    (value.v === undefined || isString(value.v)) &&
    (value.n === undefined || isFiniteNumber(value.n)) &&
    isArrayOf(value.hsc, isString) &&
    isArrayOf(value.asc, isString)
  );
}
