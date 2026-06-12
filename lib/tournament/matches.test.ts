import { describe, expect, it } from "vitest";
import { getAllTeams } from "@/lib/teams";
import { buildGroupMatch, buildKnockoutMatch, getLoser, getWinner, scoreDisplay } from "@/lib/tournament/matches";

const [teamA, teamB] = getAllTeams();

describe("buildGroupMatch", () => {
  it("builds a match with the expected id, date, and defaults", () => {
    const match = buildGroupMatch(teamA, teamB, new Date("2026-06-11T00:00:00Z"), "A", 1, 1);

    expect(match.id).toBe("A-1-1");
    expect(match.date).toBe("2026-06-11");
    expect(match.knockout).toBe(false);
    expect(match.played).toBe(false);
    expect(match.groupName).toBe("A");
    expect(match.round).toBe(1);
  });

  it("initializes empty goalScorers arrays keyed by both team names", () => {
    const match = buildGroupMatch(teamA, teamB, new Date("2026-06-11T00:00:00Z"), "A", 1, 1);

    expect(match.goalScorers[teamA.name]).toEqual([]);
    expect(match.goalScorers[teamB.name]).toEqual([]);
  });
});

describe("buildKnockoutMatch", () => {
  it("builds a match with id M{n}, matchNumber, and knockoutRound", () => {
    const match = buildKnockoutMatch(teamA, teamB, 73, "ROUND_OF_32");

    expect(match.id).toBe("M73");
    expect(match.matchNumber).toBe(73);
    expect(match.knockoutRound).toBe("ROUND_OF_32");
    expect(match.knockout).toBe(true);
    expect(match.date).toBeNull();
    expect(match.played).toBe(false);
  });
});

describe("scoreDisplay", () => {
  it("returns 'vs' for an unplayed match", () => {
    const match = buildKnockoutMatch(teamA, teamB, 1, "ROUND_OF_32");
    expect(scoreDisplay(match)).toBe("vs");
  });

  it("returns 'H - A' for a normally played match", () => {
    const match = { ...buildKnockoutMatch(teamA, teamB, 1, "ROUND_OF_32"), played: true, homeScore: 2, awayScore: 1 };
    expect(scoreDisplay(match)).toBe("2 - 1");
  });

  it("appends '(prorr.)' when the match went to extra time", () => {
    const match = {
      ...buildKnockoutMatch(teamA, teamB, 1, "ROUND_OF_32"),
      played: true,
      homeScore: 1,
      awayScore: 1,
      wentToExtraTime: true
    };
    expect(scoreDisplay(match)).toContain("(prorr.)");
  });

  it("appends '(pen: hp-ap)' when the match went to penalties", () => {
    const match = {
      ...buildKnockoutMatch(teamA, teamB, 1, "ROUND_OF_32"),
      played: true,
      homeScore: 1,
      awayScore: 1,
      wentToExtraTime: true,
      wentToPenalties: true,
      homePenalties: 4,
      awayPenalties: 3
    };
    expect(scoreDisplay(match)).toContain("(pen: 4-3)");
  });
});

describe("getWinner / getLoser", () => {
  it("returns null for an unplayed match", () => {
    const match = buildKnockoutMatch(teamA, teamB, 1, "ROUND_OF_32");
    expect(getWinner(match)).toBeNull();
    expect(getLoser(match)).toBeNull();
  });

  it("returns the home team as winner for a home win", () => {
    const match = { ...buildKnockoutMatch(teamA, teamB, 1, "ROUND_OF_32"), played: true, homeScore: 2, awayScore: 0 };
    expect(getWinner(match)).toBe(teamA);
    expect(getLoser(match)).toBe(teamB);
  });

  it("returns the away team as winner for an away win", () => {
    const match = { ...buildKnockoutMatch(teamA, teamB, 1, "ROUND_OF_32"), played: true, homeScore: 0, awayScore: 2 };
    expect(getWinner(match)).toBe(teamB);
    expect(getLoser(match)).toBe(teamA);
  });

  it("returns null for a drawn non-penalty (group) match", () => {
    const match = buildGroupMatch(teamA, teamB, new Date("2026-06-11T00:00:00Z"), "A", 1, 1);
    const played = { ...match, played: true, homeScore: 1, awayScore: 1 };
    expect(getWinner(played)).toBeNull();
    expect(getLoser(played)).toBeNull();
  });

  it("returns the team with more penalties as winner when decided on penalties", () => {
    const match = {
      ...buildKnockoutMatch(teamA, teamB, 1, "ROUND_OF_32"),
      played: true,
      homeScore: 1,
      awayScore: 1,
      wentToExtraTime: true,
      wentToPenalties: true,
      homePenalties: 3,
      awayPenalties: 5
    };
    expect(getWinner(match)).toBe(teamB);
    expect(getLoser(match)).toBe(teamA);
  });
});
