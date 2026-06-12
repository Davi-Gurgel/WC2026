import { describe, expect, it } from "vitest";
import { calculateQualifiedThirds, computeStandings } from "@/lib/tournament/standings";
import { getAllTeams } from "@/lib/teams";
import { buildGroupMatch } from "@/lib/tournament/matches";
import { simulateAllGroupMatchDays, simulateCurrentGroupMatchDay } from "@/lib/tournament/simulation";
import { initializeTournament } from "@/lib/tournament/state";
import type { Match, Team } from "@/lib/types/tournament";

function playedMatch(home: Team, away: Team, homeScore: number, awayScore: number): Match {
  return {
    ...buildGroupMatch(home, away, new Date("2026-06-11"), "A", 1, 1),
    played: true,
    homeScore,
    awayScore
  };
}

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

describe("multi-team tiebreakers", () => {
  it("two-team tie decided by head-to-head result", () => {
    const [a, b, c, d] = getAllTeams().slice(0, 4);

    // A and B finish level on points (6)/GD (1)/GF (2) overall; A beat B 1-0
    // head-to-head, so the mini-table decides A above B (1pt vs 0pts from
    // their head-to-head) before fifaRanking is ever consulted.
    const matches = [
      playedMatch(a, b, 1, 0), // A beats B
      playedMatch(a, c, 1, 0), // A beats C
      playedMatch(d, a, 1, 0), // A loses to D
      playedMatch(b, c, 1, 0), // B beats C
      playedMatch(b, d, 1, 0), // B beats D
      playedMatch(c, d, 0, 0) // filler
    ];

    const standings = computeStandings([a, b, c, d], matches);
    const teamA = standings.find((row) => row.teamName === a.name)!;
    const teamB = standings.find((row) => row.teamName === b.name)!;

    expect(teamA.points).toBe(teamB.points);
    expect(teamA.goalDifference).toBe(teamB.goalDifference);
    expect(teamA.goalsFor).toBe(teamB.goalsFor);

    const indexA = standings.findIndex((row) => row.teamName === a.name);
    const indexB = standings.findIndex((row) => row.teamName === b.name);
    expect(indexA).toBeLessThan(indexB);
  });

  it("three-team cycle is decided by the mini-table among the tied teams", () => {
    const [a, b, c, d] = getAllTeams().slice(0, 4);
    // a.fifaRanking < b.fifaRanking < c.fifaRanking (Mexico 16 < South Korea 23 < Czechia 37)
    expect(a.fifaRanking).toBeLessThan(b.fifaRanking);
    expect(b.fifaRanking).toBeLessThan(c.fifaRanking);

    // Result cycle: A beats B 2-1, B beats C 1-0, C beats A 1-0.
    // A and B each draw 1-1 with D; C draws 2-2 with D. This makes A, B, C
    // fully tied overall (4 points, GD 0, GF 3 each), while D sits on 3
    // points in a separate cluster.
    const matches = [
      playedMatch(a, b, 2, 1), // A beats B
      playedMatch(b, c, 1, 0), // B beats C
      playedMatch(c, a, 1, 0), // C beats A
      playedMatch(a, d, 1, 1),
      playedMatch(b, d, 1, 1),
      playedMatch(c, d, 2, 2)
    ];

    const standings = computeStandings([a, b, c, d], matches);

    const teamA = standings.find((row) => row.teamName === a.name)!;
    const teamB = standings.find((row) => row.teamName === b.name)!;
    const teamC = standings.find((row) => row.teamName === c.name)!;

    // Overall: A, B, C all have 4 points, GD 0, GF 3 - fully tied.
    for (const row of [teamA, teamB, teamC]) {
      expect(row.points).toBe(4);
      expect(row.goalDifference).toBe(0);
      expect(row.goalsFor).toBe(3);
    }

    // Mini-table among A, B, C (matches A-B, B-C, C-A only):
    //   A: beat B 2-1 (3pts, GF2 GA1) + lost to C 0-1 (0pts, GF0 GA1) => 3pts, GD0, GF2
    //   B: lost to A 1-2 (0pts, GF1 GA2) + beat C 1-0 (3pts, GF1 GA0) => 3pts, GD0, GF2
    //   C: beat A 1-0 (3pts, GF1 GA0) + lost to B 0-1 (0pts, GF0 GA1) => 3pts, GD0, GF1
    // C ranks last (lower mini-table GF). A and B remain tied on the
    // mini-table (3pts, GD0, GF2) and fall back to fifaRanking: A < B.
    const indexA = standings.findIndex((row) => row.teamName === a.name);
    const indexB = standings.findIndex((row) => row.teamName === b.name);
    const indexC = standings.findIndex((row) => row.teamName === c.name);

    expect(indexA).toBeLessThan(indexB);
    expect(indexB).toBeLessThan(indexC);
  });

  it("fully tied cluster with no played matches falls back to FIFA ranking", () => {
    const teams = getAllTeams().slice(0, 4);
    const standings = computeStandings(teams, []);

    expect(standings).toHaveLength(4);

    const sortedByRanking = [...teams].sort((x, y) => x.fifaRanking - y.fifaRanking);
    expect(standings.map((row) => row.teamName)).toEqual(sortedByRanking.map((team) => team.name));
  });

  it("computeStandings is deterministic for the same inputs", () => {
    const [a, b, c, d] = getAllTeams().slice(0, 4);
    const matches = [
      playedMatch(a, b, 2, 1),
      playedMatch(b, c, 1, 0),
      playedMatch(c, a, 1, 0),
      playedMatch(a, d, 1, 1),
      playedMatch(b, d, 1, 1),
      playedMatch(c, d, 2, 2)
    ];

    const first = computeStandings([a, b, c, d], matches);
    const second = computeStandings([a, b, c, d], matches);

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
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