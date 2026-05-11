import { describe, expect, it } from "vitest";
import { collectTournamentMatches, findTeamByCodeOrName, getMatchesForTeam, getTournamentStats, isTournamentCompleted } from "@/lib/tournament/selectors";
import { getAllTeams } from "@/lib/teams";
import { simulateAllGroupMatchDays, simulateCurrentKnockoutRound } from "@/lib/tournament/simulation";
import { initializeTournament } from "@/lib/tournament/state";

describe("getAllGroupMatches", () => {
  it("returns all 72 group matches after initialization", () => {
    const state = initializeTournament(getAllTeams());
    const { groupMatches } = collectTournamentMatches(state);
    expect(groupMatches).toHaveLength(72);
  });
});

describe("collectTournamentMatches", () => {
  it("separates played and unplayed matches", () => {
    const state = simulateAllGroupMatchDays(initializeTournament(getAllTeams()));
    const { playedGroupMatches, playedKnockoutMatches, playedMatches } = collectTournamentMatches(state);

    expect(playedGroupMatches).toHaveLength(72);
    expect(playedKnockoutMatches).toHaveLength(0);
    expect(playedMatches).toHaveLength(72);
  });

  it("includes knockout matches after simulation", () => {
    let state = simulateAllGroupMatchDays(initializeTournament(getAllTeams()));
    state = simulateCurrentKnockoutRound(state);
    const { knockoutMatches, playedKnockoutMatches } = collectTournamentMatches(state);

    expect(knockoutMatches.length).toBeGreaterThanOrEqual(16);
    expect(playedKnockoutMatches).toHaveLength(16);
  });
});

describe("getTournamentStats", () => {
  it("returns zero stats for uninitialized tournament", () => {
    const state = initializeTournament(getAllTeams());
    const stats = getTournamentStats(state);

    expect(stats.totalGroupMatches).toBe(72);
    expect(stats.simulatedGroupMatches).toBe(0);
    expect(stats.totalMatches).toBe(0);
    expect(stats.totalGoals).toBe(0);
    expect(stats.averageGoals).toBe(0);
    expect(stats.champion).toBeNull();
  });

  it("tracks goals after match simulation", () => {
    const state = simulateAllGroupMatchDays(initializeTournament(getAllTeams()));
    const stats = getTournamentStats(state);

    expect(stats.simulatedGroupMatches).toBe(72);
    expect(stats.totalMatches).toBe(72);
    expect(stats.totalGoals).toBeGreaterThan(0);
    expect(stats.averageGoals).toBeGreaterThan(0);
  });
});

describe("isTournamentCompleted", () => {
  it("returns false during group stage", () => {
    const state = simulateAllGroupMatchDays(initializeTournament(getAllTeams()));
    expect(isTournamentCompleted(state)).toBe(false);
  });

  it("returns true after final match is played", () => {
    let state = simulateAllGroupMatchDays(initializeTournament(getAllTeams()));
    state = simulateCurrentKnockoutRound(state);
    state = simulateCurrentKnockoutRound(state);
    state = simulateCurrentKnockoutRound(state);
    state = simulateCurrentKnockoutRound(state);
    state = simulateCurrentKnockoutRound(state);

    expect(isTournamentCompleted(state)).toBe(true);
  });
});

describe("findTeamByCodeOrName", () => {
  it("finds team by country code", () => {
    const state = initializeTournament(getAllTeams());
    const team = findTeamByCodeOrName(state, "BRA");
    expect(team).toBeDefined();
    expect(team!.countryCode).toBe("BRA");
  });

  it("finds team by name", () => {
    const state = initializeTournament(getAllTeams());
    const team = findTeamByCodeOrName(state, "Brazil");
    expect(team).toBeDefined();
    expect(team!.countryCode).toBe("BRA");
  });

  it("returns undefined for inactive tournament", () => {
    const state = initializeTournament(getAllTeams());
    const inactive = { ...state, active: false };
    expect(findTeamByCodeOrName(inactive, "BRA")).toBeUndefined();
  });
});

describe("getMatchesForTeam", () => {
  it("returns group matches for a team", () => {
    const state = simulateAllGroupMatchDays(initializeTournament(getAllTeams()));
    const teams = getAllTeams();
    const matches = getMatchesForTeam(state, teams[0].name);

    expect(matches.length).toBeGreaterThanOrEqual(3);
    expect(matches.every((m) => m.homeTeam.name === teams[0].name || m.awayTeam.name === teams[0].name)).toBe(true);
  });
});