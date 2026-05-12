import { describe, expect, it } from "vitest";
import { generateNextRound, generateR32Bracket, generateThirdAndFinal } from "@/lib/tournament/bracket";
import { getAllTeams } from "@/lib/teams";
import { simulateAllGroupMatchDays, simulateCurrentKnockoutRound } from "@/lib/tournament/simulation";
import { initializeTournament } from "@/lib/tournament/state";

describe("generateR32Bracket", () => {
  it("creates 16 round-of-32 matches from group stage results", () => {
    const state = simulateAllGroupMatchDays(initializeTournament(getAllTeams()));
    const bracket = generateR32Bracket(state.groups, state.qualified3rd);

    expect(bracket).toHaveLength(16);
    expect(bracket.every((match) => match.knockout)).toBe(true);
    expect(bracket.every((match) => match.knockoutRound === "ROUND_OF_32")).toBe(true);
    expect(bracket.every((match) => !match.played)).toBe(true);
  });

  it("assigns sequential match numbers starting at 73", () => {
    const state = simulateAllGroupMatchDays(initializeTournament(getAllTeams()));
    const bracket = generateR32Bracket(state.groups, state.qualified3rd);

    const matchNumbers = bracket.map((match) => match.matchNumber);
    expect(matchNumbers).toEqual([73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88]);
  });

  it("places group winners and runners-up correctly", () => {
    const state = simulateAllGroupMatchDays(initializeTournament(getAllTeams()));
    const bracket = generateR32Bracket(state.groups, state.qualified3rd);

    const firstMatch = bracket[0];
    expect(firstMatch).toBeDefined();
    expect(firstMatch.homeTeam).toBeDefined();
    expect(firstMatch.awayTeam).toBeDefined();
  });
});

describe("generateNextRound", () => {
  it("generates half as many matches from the previous round winners", () => {
    const state = simulateAllGroupMatchDays(initializeTournament(getAllTeams()));
    const r32 = simulateCurrentKnockoutRound(state).r32Matches;
    const r16 = generateNextRound(r32, 89, "ROUND_OF_16");

    expect(r16).toHaveLength(8);
    expect(r16.every((match) => match.knockoutRound === "ROUND_OF_16")).toBe(true);
    expect(r16.every((match) => !match.played)).toBe(true);
  });

  it("assigns correct match numbers starting from the given index", () => {
    const state = simulateAllGroupMatchDays(initializeTournament(getAllTeams()));
    const r32 = simulateCurrentKnockoutRound(state).r32Matches;
    const r16 = generateNextRound(r32, 89, "ROUND_OF_16");

    const matchNumbers = r16.map((match) => match.matchNumber);
    expect(matchNumbers).toEqual([89, 90, 91, 92, 93, 94, 95, 96]);
  });
});

describe("generateThirdAndFinal", () => {
  it("creates third-place and final matches from semi-final results", () => {
    let state = simulateAllGroupMatchDays(initializeTournament(getAllTeams()));
    state = simulateCurrentKnockoutRound(state);
    state = simulateCurrentKnockoutRound(state);
    state = simulateCurrentKnockoutRound(state);
    const semiFinalState = simulateCurrentKnockoutRound(state);

    const [thirdPlace, finalMatch] = generateThirdAndFinal(semiFinalState.semiFinals);

    expect(thirdPlace).toBeDefined();
    expect(finalMatch).toBeDefined();
    expect(thirdPlace!.knockoutRound).toBe("THIRD_PLACE");
    expect(finalMatch!.knockoutRound).toBe("FINAL");
    expect(thirdPlace!.matchNumber).toBe(103);
    expect(finalMatch!.matchNumber).toBe(104);
  });
});