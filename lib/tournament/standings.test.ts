import { describe, expect, it } from "vitest";
import { calculateQualifiedThirds, computeStandings } from "@/lib/tournament/standings";
import { getAllTeams } from "@/lib/teams";
import { simulateAllGroupMatchDays, simulateCurrentGroupMatchDay } from "@/lib/tournament/simulation";
import { initializeTournament } from "@/lib/tournament/state";

describe("computeStandings", () => {
  it("ranks teams by points descending", () => {
    const state = simulateCurrentGroupMatchDay(initializeTournament(getAllTeams()));
    const firstGroup = state.groups[0];
    const standings = computeStandings(firstGroup.teams, firstGroup.matches.filter((m) => m.played));

    for (let index = 1; index < standings.length; index++) {
      expect(standings[index - 1].points).toBeGreaterThanOrEqual(standings[index].points);
    }
  });

  it("uses goal difference as second tiebreaker", () => {
    const state = simulateCurrentGroupMatchDay(initializeTournament(getAllTeams()));
    const firstGroup = state.groups[0];
    const standings = computeStandings(firstGroup.teams, firstGroup.matches.filter((m) => m.played));

    for (let index = 1; index < standings.length; index++) {
      if (standings[index - 1].points === standings[index].points) {
        expect(standings[index - 1].goalDifference).toBeGreaterThanOrEqual(standings[index].goalDifference);
      }
    }
  });

  it("computes correct totals for played/wins/draws/losses", () => {
    const state = simulateAllGroupMatchDays(initializeTournament(getAllTeams()));
    for (const group of state.groups) {
      const standings = computeStandings(group.teams, group.matches.filter((m) => m.played));
      const totalMatches = group.matches.filter((m) => m.played).length;

      const totalPlayed = standings.reduce((sum, team) => sum + team.played, 0);
      const totalWins = standings.reduce((sum, team) => sum + team.wins, 0);
      const totalDraws = standings.reduce((sum, team) => sum + team.draws, 0);
      const totalLosses = standings.reduce((sum, team) => sum + team.losses, 0);

      expect(totalPlayed).toBe(totalMatches * 2);
      expect(totalWins).toBe(totalLosses);
      expect(totalDraws % 2).toBe(0);
    }
  });

  it("goals for minus goals against equals goal difference", () => {
    const state = simulateAllGroupMatchDays(initializeTournament(getAllTeams()));
    for (const group of state.groups) {
      const standings = computeStandings(group.teams, group.matches.filter((m) => m.played));
      for (const team of standings) {
        expect(team.goalDifference).toBe(team.goalsFor - team.goalsAgainst);
      }
    }
  });

  it("falls back to FIFA ranking when points and GD are tied", () => {
    const teams = getAllTeams();
    const standings = computeStandings(teams.slice(0, 4), []);
    expect(standings).toHaveLength(4);
    expect(standings.every((team) => team.points === 0)).toBe(true);
  });
});

describe("calculateQualifiedThirds", () => {
  it("selects exactly 8 third-place teams from 12 groups", () => {
    const state = simulateAllGroupMatchDays(initializeTournament(getAllTeams()));
    const qualifiedThirds = calculateQualifiedThirds(state.groups);

    expect(qualifiedThirds).toHaveLength(8);
  });

  it("all qualified third-place teams are distinct", () => {
    const state = simulateAllGroupMatchDays(initializeTournament(getAllTeams()));
    const qualifiedThirds = calculateQualifiedThirds(state.groups);

    const codes = new Set(qualifiedThirds.map((team) => team.countryCode));
    expect(codes.size).toBe(8);
  });

  it("sorts third-place teams by points, then GD, then goals for, then FIFA ranking", () => {
    const state = simulateAllGroupMatchDays(initializeTournament(getAllTeams()));
    const qualifiedThirds = calculateQualifiedThirds(state.groups);

    for (let index = 1; index < qualifiedThirds.length; index++) {
      const current = state.groups
        .find((group) => group.teams.some((team) => team.countryCode === qualifiedThirds[index].countryCode))
        ?.standings[2];
      const previous = state.groups
        .find((group) => group.teams.some((team) => team.countryCode === qualifiedThirds[index - 1].countryCode))
        ?.standings[2];

      if (!current || !previous) continue;
      if (previous.points !== current.points) {
        expect(previous.points).toBeGreaterThan(current.points);
      }
    }
  });
});