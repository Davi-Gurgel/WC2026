import type { Match, Scorer, TournamentPhase } from "@/lib/types/tournament";

export function isTournamentPhase(value: unknown): value is TournamentPhase {
  return (
    value === "NOT_STARTED" ||
    value === "GROUP_STAGE" ||
    value === "ROUND_OF_32" ||
    value === "ROUND_OF_16" ||
    value === "QUARTERFINAL" ||
    value === "SEMIFINAL" ||
    value === "FINAL" ||
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
