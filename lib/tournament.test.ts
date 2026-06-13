import { describe, expect, it } from "vitest";
import { getAllTeams } from "@/lib/teams";
import { bracketFinal, roundMatches } from "@/lib/tournament/bracket";
import { getLoser, getWinner } from "@/lib/tournament/matches";
import { mulberry32 } from "@/lib/tournament/rng";
import { getAllGroupMatches } from "@/lib/tournament/selectors";
import { simulateAllGroupMatchDays, simulateCurrentGroupMatchDay, simulateCurrentKnockoutRound, simulatePenalties } from "@/lib/tournament/simulation";
import { calculateQualifiedThirds } from "@/lib/tournament/standings";
import { initializeTournament } from "@/lib/tournament/state";
import type { Match } from "@/lib/types/tournament";

describe("tournament rules", () => {
  it("rejects initialization without exactly 48 teams", () => {
    expect(() => initializeTournament(getAllTeams().slice(0, 47))).toThrow("Exactly 48 teams");
  });

  it("initializes 12 groups with 4 teams and 6 matches each", () => {
    const state = initializeTournament(getAllTeams());

    expect(state.groups).toHaveLength(12);
    expect(state.groups.every((group) => group.teams.length === 4)).toBe(true);
    expect(state.groups.every((group) => group.matches.length === 6)).toBe(true);
    expect(getAllGroupMatches(state)).toHaveLength(72);
  });

  it("simulates only the current group matchday", () => {
    const state = initializeTournament(getAllTeams());
    const next = simulateCurrentGroupMatchDay(state);

    expect(next.currentGroupMatchDay).toBe(2);
    expect(getAllGroupMatches(next).filter((match) => match.played)).toHaveLength(24);
    expect(getAllGroupMatches(next).filter((match) => match.played && match.round !== 1)).toHaveLength(0);
  });

  it("moves to round of 32 after all group rounds and selects 8 third-place teams", () => {
    const state = simulateAllGroupMatchDays(initializeTournament(getAllTeams()));

    expect(state.phase).toBe("ROUND_OF_32");
    expect(roundMatches(state.bracket, "ROUND_OF_32")).toHaveLength(16);
    expect(roundMatches(state.bracket, "ROUND_OF_32").map((match) => match.matchNumber)).toEqual([...Array.from({ length: 16 }, (_, index) => index + 73)]);
    expect(calculateQualifiedThirds(state.groups)).toHaveLength(8);
  });

  it("same seed produces identical simulations", () => {
    const first = simulateAllGroupMatchDays(initializeTournament(getAllTeams()), mulberry32(7));
    const second = simulateAllGroupMatchDays(initializeTournament(getAllTeams()), mulberry32(7));

    expect(JSON.stringify(first.groups)).toBe(JSON.stringify(second.groups));
  });

  it("advances knockout phases to the champion", () => {
    let state = simulateAllGroupMatchDays(initializeTournament(getAllTeams()));

    state = simulateCurrentKnockoutRound(state);
    expect(state.phase).toBe("ROUND_OF_16");
    expect(roundMatches(state.bracket, "ROUND_OF_16")).toHaveLength(8);

    state = simulateCurrentKnockoutRound(state);
    expect(state.phase).toBe("QUARTERFINAL");
    expect(roundMatches(state.bracket, "QUARTERFINAL")).toHaveLength(4);

    state = simulateCurrentKnockoutRound(state);
    expect(state.phase).toBe("SEMIFINAL");
    expect(roundMatches(state.bracket, "SEMIFINAL")).toHaveLength(2);

    state = simulateCurrentKnockoutRound(state);
    expect(state.phase).toBe("FINAL");
    expect(state.bracket.thirdPlace?.matchNumber).toBe(103);
    expect(bracketFinal(state.bracket)?.matchNumber).toBe(104);

    state = simulateCurrentKnockoutRound(state);
    expect(state.phase).toBe("FINISHED");
    expect(bracketFinal(state.bracket)?.played).toBe(true);
    expect(state.champion).toBeTruthy();
    expect(state.runnerUp).toBeTruthy();
  });

  it("penalties never finish tied", () => {
    for (let index = 0; index < 100; index += 1) {
      const [home, away] = simulatePenalties();
      expect(home).not.toBe(away);
    }
  });

  it("gets winners and losers in normal time and penalties", () => {
    const [homeTeam, awayTeam] = getAllTeams();
    const normal = {
      homeTeam,
      awayTeam,
      homeScore: 2,
      awayScore: 1,
      played: true,
      wentToPenalties: false
    } as Match;
    const penalties = {
      homeTeam,
      awayTeam,
      homeScore: 1,
      awayScore: 1,
      played: true,
      wentToPenalties: true,
      homePenalties: 4,
      awayPenalties: 5
    } as Match;

    expect(getWinner(normal)?.name).toBe(homeTeam.name);
    expect(getLoser(normal)?.name).toBe(awayTeam.name);
    expect(getWinner(penalties)?.name).toBe(awayTeam.name);
    expect(getLoser(penalties)?.name).toBe(homeTeam.name);
  });

  it("adds top scorer goals when matches are simulated", () => {
    const state = simulateCurrentGroupMatchDay(initializeTournament(getAllTeams()), mulberry32(42));
    const totalScorerGoals = state.topScorers.reduce((sum, scorer) => sum + scorer.goals, 0);
    const totalMatchGoals = getAllGroupMatches(state)
      .filter((match) => match.played)
      .reduce((sum, match) => sum + match.homeScore + match.awayScore, 0);

    expect(totalScorerGoals).toBe(totalMatchGoals);
    expect(totalScorerGoals).toBeGreaterThan(0);
  });
});
