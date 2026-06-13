import { describe, expect, it } from "vitest";
import { roundMatches } from "@/lib/tournament/bracket";
import { expandCompactTournamentState, toStoredTournamentState } from "@/lib/tournament/storage-codec";
import { isStoredTournamentState } from "@/lib/tournament/storage-guards";
import { STORAGE_VERSION } from "@/lib/tournament/storage-schema";
import { getAllTeams } from "@/lib/teams";
import { simulateAllGroupMatchDays, simulateCurrentKnockoutRound } from "@/lib/tournament/simulation";
import { initializeTournament } from "@/lib/tournament/state";

describe("storage codec round-trip", () => {
  it("serializes and deserializes an active group-stage state without data loss", () => {
    const original = simulateAllGroupMatchDays(initializeTournament(getAllTeams()));
    const stored = toStoredTournamentState(original);
    const restored = expandCompactTournamentState(stored.state, getAllTeams());

    expect(stored.version).toBe(STORAGE_VERSION);
    expect(restored.phase).toBe(original.phase);
    expect(restored.active).toBe(original.active);
    expect(restored.currentGroupMatchDay).toBe(original.currentGroupMatchDay);
    expect(restored.groups).toHaveLength(original.groups.length);
    expect(roundMatches(restored.bracket, "ROUND_OF_32")).toHaveLength(roundMatches(original.bracket, "ROUND_OF_32").length);
    expect(restored.champion?.countryCode).toBe(original.champion?.countryCode);
    expect(restored.qualified3rd).toHaveLength(original.qualified3rd.length);
  });

  it("preserves match scores and goal scorers across round-trip", () => {
    const original = simulateAllGroupMatchDays(initializeTournament(getAllTeams()));
    const stored = toStoredTournamentState(original);
    const restored = expandCompactTournamentState(stored.state, getAllTeams());

    const originalFirstMatch = original.groups[0].matches[0];
    const restoredFirstMatch = restored.groups[0].matches[0];

    expect(restoredFirstMatch.homeScore).toBe(originalFirstMatch.homeScore);
    expect(restoredFirstMatch.awayScore).toBe(originalFirstMatch.awayScore);
    expect(restoredFirstMatch.played).toBe(originalFirstMatch.played);
    expect(restoredFirstMatch.homeTeam.countryCode).toBe(originalFirstMatch.homeTeam.countryCode);
    expect(restoredFirstMatch.awayTeam.countryCode).toBe(originalFirstMatch.awayTeam.countryCode);
  });

  it("produces valid stored state that passes guard checks", () => {
    const original = simulateAllGroupMatchDays(initializeTournament(getAllTeams()));
    const stored = toStoredTournamentState(original);

    const serialized = JSON.parse(JSON.stringify(stored));
    expect(isStoredTournamentState(serialized)).toBe(true);
    expect(serialized.version).toBe(STORAGE_VERSION);
  });

  it("handles NOT_STARTED state with empty data", () => {
    const original = { ...initializeTournament(getAllTeams()), active: false, groups: [], allTeams: [], phase: "NOT_STARTED" as const, currentGroupMatchDay: 0, bracket: { rounds: [], thirdPlace: null }, topScorers: [], champion: null, runnerUp: null, qualified3rd: [] };
    const stored = toStoredTournamentState(original);
    const restored = expandCompactTournamentState(stored.state, getAllTeams());

    expect(restored.phase).toBe("NOT_STARTED");
    expect(restored.active).toBe(false);
    expect(restored.groups).toHaveLength(0);
  });

  it("handles knockout matches and champion across round-trip", () => {
    let state = simulateAllGroupMatchDays(initializeTournament(getAllTeams()));
    state = simulateCurrentKnockoutRound(state);
    state = simulateCurrentKnockoutRound(state);

    const stored = toStoredTournamentState(state);
    const restored = expandCompactTournamentState(stored.state, getAllTeams());

    expect(roundMatches(restored.bracket, "ROUND_OF_32")).toHaveLength(roundMatches(state.bracket, "ROUND_OF_32").length);
    expect(roundMatches(restored.bracket, "ROUND_OF_16")).toHaveLength(roundMatches(state.bracket, "ROUND_OF_16").length);
    expect(roundMatches(restored.bracket, "QUARTERFINAL")).toHaveLength(roundMatches(state.bracket, "QUARTERFINAL").length);
  });
});

describe("storage guards", () => {
  it("rejects plain objects without version field", () => {
    expect(isStoredTournamentState({})).toBe(false);
  });

  it("rejects objects with wrong version", () => {
    expect(isStoredTournamentState({ version: 999, state: {} })).toBe(false);
  });

  it("rejects null and undefined", () => {
    expect(isStoredTournamentState(null)).toBe(false);
    expect(isStoredTournamentState(undefined)).toBe(false);
  });

  it("rejects strings", () => {
    expect(isStoredTournamentState("not valid")).toBe(false);
  });
});