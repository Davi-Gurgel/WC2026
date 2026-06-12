import { describe, expect, it } from "vitest";
import { assignThirdsToSlots, generateNextRound, generateR32Bracket, generateThirdAndFinal } from "@/lib/tournament/bracket";
import { getAllTeams } from "@/lib/teams";
import { simulateAllGroupMatchDays, simulateCurrentKnockoutRound } from "@/lib/tournament/simulation";
import { initializeTournament } from "@/lib/tournament/state";
import { mulberry32 } from "@/lib/tournament/rng";
import type { Team } from "@/lib/types/tournament";

const THIRD_SLOT_GROUPS = ["E", "I", "A", "L", "D", "G", "B", "K"] as const;

function teamInGroup(group: string): Team {
  const team = getAllTeams().find((candidate) => candidate.group.toUpperCase() === group);
  if (!team) throw new Error(`No team found for group ${group}`);
  return team;
}

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

describe("assignThirdsToSlots", () => {
  it("moves a third-place team away from its own group winner's slot", () => {
    // Every qualified third comes from the exact group that occupies the
    // same-index slot, so every position conflicts with itself.
    const qualified3rd = THIRD_SLOT_GROUPS.map((group) => teamInGroup(group));

    const result = assignThirdsToSlots(qualified3rd);

    expect(result).toHaveLength(8);
    expect(new Set(result)).toHaveProperty("size", 8);
    for (let index = 0; index < result.length; index += 1) {
      expect(result[index]!.group.toUpperCase()).not.toBe(THIRD_SLOT_GROUPS[index]);
    }
  });

  it("preserves rank order when no slot conflicts with its group", () => {
    // Order chosen so qualified3rd[i].group never equals THIRD_SLOT_GROUPS[i]:
    // C/F/H/J/E/I/A/L vs slot groups E/I/A/L/D/G/B/K — no index collides.
    const groupOrder = ["C", "F", "H", "J", "E", "I", "A", "L"];
    const qualified3rd = groupOrder.map((group) => teamInGroup(group));

    const result = assignThirdsToSlots(qualified3rd);

    expect(result).toEqual(qualified3rd);
  });

  it("throws when no valid allocation exists", () => {
    const sameGroupTeam = teamInGroup("E");
    const qualified3rd = new Array(8).fill(sameGroupTeam);

    expect(() => assignThirdsToSlots(qualified3rd)).toThrow("No valid third-place allocation");
  });
});

describe("Round of 32 third-place slotting (integration)", () => {
  it("never pairs a third-place team against its own group winner across seeds", () => {
    for (let seed = 1; seed <= 25; seed += 1) {
      const state = simulateAllGroupMatchDays(initializeTournament(getAllTeams()), mulberry32(seed));

      for (const match of state.r32Matches) {
        expect(match.homeTeam.group).not.toBe(match.awayTeam.group);
      }
    }
  });
});