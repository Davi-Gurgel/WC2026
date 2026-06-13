import { describe, expect, it } from "vitest";
import { getAllTeams } from "@/lib/teams";
import { GROUP_LETTERS } from "@/lib/tournament/constants";
import { initializeTournament } from "@/lib/tournament/state";

describe("initializeTournament", () => {
  it("throws when given fewer than 48 teams", () => {
    const teams = getAllTeams().slice(0, 47);
    expect(() => initializeTournament(teams)).toThrow("Exactly 48 teams");
  });

  it("throws when given more than 48 teams", () => {
    const teams = getAllTeams();
    const tooMany = [...teams, teams[0]];
    expect(() => initializeTournament(tooMany)).toThrow("Exactly 48 teams");
  });

  it("creates 12 groups lettered A-L in order, each with 4 teams matching the group letter", () => {
    const state = initializeTournament(getAllTeams());

    expect(state.groups).toHaveLength(12);
    expect(state.groups.map((group) => group.letter)).toEqual(GROUP_LETTERS);

    for (const group of state.groups) {
      expect(group.teams).toHaveLength(4);
      for (const team of group.teams) {
        expect(team.group.toUpperCase()).toBe(group.letter);
      }
    }
  });

  it("generates 6 matches per group, each team appears in exactly 3", () => {
    const state = initializeTournament(getAllTeams());

    for (const group of state.groups) {
      expect(group.matches).toHaveLength(6);

      for (const team of group.teams) {
        const appearances = group.matches.filter(
          (match) => match.homeTeam.name === team.name || match.awayTeam.name === team.name
        );
        expect(appearances).toHaveLength(3);
      }
    }
  });

  it("assigns rounds [1,1,2,2,3,3] with each team appearing exactly once per round", () => {
    const state = initializeTournament(getAllTeams());

    for (const group of state.groups) {
      expect(group.matches.map((match) => match.round)).toEqual([1, 1, 2, 2, 3, 3]);

      for (const round of [1, 2, 3]) {
        const roundMatches = group.matches.filter((match) => match.round === round);
        const teamsInRound = roundMatches.flatMap((match) => [match.homeTeam.name, match.awayTeam.name]);
        const uniqueTeams = new Set(teamsInRound);

        expect(teamsInRound).toHaveLength(group.teams.length);
        expect(uniqueTeams.size).toBe(group.teams.length);
      }
    }
  });

  it("sets match dates per round: 2026-06-11, 2026-06-14, 2026-06-17", () => {
    const state = initializeTournament(getAllTeams());

    for (const group of state.groups) {
      for (const match of group.matches) {
        if (match.round === 1) expect(match.date).toBe("2026-06-11");
        if (match.round === 2) expect(match.date).toBe("2026-06-14");
        if (match.round === 3) expect(match.date).toBe("2026-06-17");
      }
    }
  });

  it("sets up initial standings, phase, match day, active flag, and empty knockout state", () => {
    const state = initializeTournament(getAllTeams());

    for (const group of state.groups) {
      expect(group.standings).toHaveLength(4);
      for (const row of group.standings) {
        expect(row.played).toBe(0);
        expect(row.wins).toBe(0);
        expect(row.draws).toBe(0);
        expect(row.losses).toBe(0);
        expect(row.goalsFor).toBe(0);
        expect(row.goalsAgainst).toBe(0);
        expect(row.goalDifference).toBe(0);
        expect(row.points).toBe(0);
      }
    }

    expect(state.phase).toBe("GROUP_STAGE");
    expect(state.currentGroupMatchDay).toBe(1);
    expect(state.active).toBe(true);
    expect(state.bracket.rounds).toEqual([]);
    expect(state.bracket.thirdPlace).toBeNull();
    expect(state.champion).toBeNull();
    expect(state.runnerUp).toBeNull();
  });

  it("does not mutate the input teams array", () => {
    const teams = getAllTeams();
    const before = JSON.stringify(teams);

    initializeTournament(teams);

    expect(JSON.stringify(teams)).toBe(before);
  });
});
