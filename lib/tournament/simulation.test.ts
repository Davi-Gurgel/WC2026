import { describe, expect, it } from "vitest";
import { getAllTeams } from "@/lib/teams";
import { mulberry32 } from "@/lib/tournament/rng";
import type { Rng } from "@/lib/tournament/rng";
import {
  simulateAllGroupMatchDays,
  simulateCurrentGroupMatchDay,
  simulateCurrentKnockoutRound,
  simulatePenalties
} from "@/lib/tournament/simulation";
import { createEmptyTournamentState, initializeTournament } from "@/lib/tournament/state";
import type { Match, Team, TournamentState } from "@/lib/types/tournament";

function allKnockoutMatches(state: TournamentState): Match[] {
  return [
    ...state.r32Matches,
    ...state.r16Matches,
    ...state.quarterFinals,
    ...state.semiFinals,
    ...(state.thirdPlaceMatch ? [state.thirdPlaceMatch] : []),
    ...(state.finalMatch ? [state.finalMatch] : [])
  ];
}

function simulateToFinished(state: TournamentState, rng: Rng): TournamentState {
  let next = state;
  while (next.phase !== "FINISHED") {
    if (next.phase === "GROUP_STAGE") {
      next = simulateCurrentGroupMatchDay(next, rng);
    } else {
      next = simulateCurrentKnockoutRound(next, rng);
    }
  }
  return next;
}

describe("simulateCurrentGroupMatchDay - purity and no-op guards", () => {
  it("does not mutate the input state", () => {
    const state = initializeTournament(getAllTeams());
    const before = JSON.stringify(state);

    simulateCurrentGroupMatchDay(state, mulberry32(1));

    expect(JSON.stringify(state)).toBe(before);
  });

  it("returns the same reference for createEmptyTournamentState", () => {
    const empty = createEmptyTournamentState();
    const result = simulateCurrentGroupMatchDay(empty, mulberry32(1));

    expect(result).toBe(empty);
  });

  it("returns the same reference once past match day 3", () => {
    let state = initializeTournament(getAllTeams());
    state = simulateAllGroupMatchDays(state, mulberry32(1));

    expect(state.phase).not.toBe("GROUP_STAGE");

    const result = simulateCurrentGroupMatchDay(state, mulberry32(2));
    expect(result).toBe(state);
  });
});

describe("simulateCurrentKnockoutRound - purity", () => {
  it("does not mutate the input state", () => {
    let state = initializeTournament(getAllTeams());
    state = simulateAllGroupMatchDays(state, mulberry32(1));

    const before = JSON.stringify(state);
    simulateCurrentKnockoutRound(state, mulberry32(1));

    expect(JSON.stringify(state)).toBe(before);
  });
});

describe("score bounds across seeds", () => {
  for (const seed of [1, 2, 3]) {
    it(`every played group match scores 0-7 (seed ${seed})`, () => {
      let state = initializeTournament(getAllTeams());
      const rng = mulberry32(seed);

      for (let day = 0; day < 3; day += 1) {
        state = simulateCurrentGroupMatchDay(state, rng);
      }

      for (const group of state.groups) {
        for (const match of group.matches) {
          expect(match.played).toBe(true);
          expect(match.homeScore).toBeGreaterThanOrEqual(0);
          expect(match.homeScore).toBeLessThanOrEqual(7);
          expect(match.awayScore).toBeGreaterThanOrEqual(0);
          expect(match.awayScore).toBeLessThanOrEqual(7);
        }
      }
    });

    it(`every knockout match scores at most 9 (seed ${seed})`, () => {
      let state = initializeTournament(getAllTeams());
      const rng = mulberry32(seed);
      state = simulateToFinished(state, rng);

      for (const match of allKnockoutMatches(state)) {
        expect(match.played).toBe(true);
        expect(match.homeScore).toBeLessThanOrEqual(9);
        expect(match.awayScore).toBeLessThanOrEqual(9);
      }
    });
  }
});

describe("goal scorer integrity", () => {
  it("goalScorers length matches the score for both teams, and scorers belong to the team roster", () => {
    let state = initializeTournament(getAllTeams());
    const rng = mulberry32(7);
    state = simulateToFinished(state, rng);

    const allMatches: Match[] = [...state.groups.flatMap((group) => group.matches), ...allKnockoutMatches(state)];

    for (const match of allMatches) {
      if (!match.played) continue;

      const homeScorers = match.goalScorers[match.homeTeam.name] ?? [];
      const awayScorers = match.goalScorers[match.awayTeam.name] ?? [];

      expect(homeScorers).toHaveLength(match.homeScore);
      expect(awayScorers).toHaveLength(match.awayScore);

      const homeNames = new Set(match.homeTeam.players.map((player) => player.name));
      const awayNames = new Set(match.awayTeam.players.map((player) => player.name));

      for (const scorer of homeScorers) {
        expect(homeNames.has(scorer)).toBe(true);
      }
      for (const scorer of awayScorers) {
        expect(awayNames.has(scorer)).toBe(true);
      }
    }
  });
});

describe("knockout decisiveness", () => {
  it("every knockout match has a decisive winner, and penalties imply extra time with a differing shootout score", () => {
    let state = initializeTournament(getAllTeams());
    const rng = mulberry32(42);
    state = simulateToFinished(state, rng);

    expect(state.phase).toBe("FINISHED");
    expect(state.champion).not.toBeNull();
    expect(state.runnerUp).not.toBeNull();

    for (const match of allKnockoutMatches(state)) {
      const winner: Team | null =
        match.wentToPenalties
          ? match.homePenalties > match.awayPenalties
            ? match.homeTeam
            : match.awayTeam
          : match.homeScore !== match.awayScore
            ? match.homeScore > match.awayScore
              ? match.homeTeam
              : match.awayTeam
            : null;

      expect(winner).not.toBeNull();

      if (match.wentToPenalties) {
        expect(match.wentToExtraTime).toBe(true);
        expect(match.homePenalties).not.toBe(match.awayPenalties);
      }
    }
  });
});

describe("top scorer accumulation across phases", () => {
  it("total topScorers goals equals total regulation+ET goals across all played matches", () => {
    let state = initializeTournament(getAllTeams());
    const rng = mulberry32(5);
    state = simulateToFinished(state, rng);

    const allMatches: Match[] = [...state.groups.flatMap((group) => group.matches), ...allKnockoutMatches(state)];

    const totalGoals = allMatches.reduce((sum, match) => sum + match.homeScore + match.awayScore, 0);
    const totalScorerGoals = state.topScorers.reduce((sum, scorer) => sum + scorer.goals, 0);

    expect(totalScorerGoals).toBe(totalGoals);
  });
});

describe("simulatePenalties - scripted rng branches", () => {
  function scripted(values: number[]): Rng {
    let i = 0;
    return () => values[i++] ?? 0.99;
  }

  it("decides the shootout within the initial 5 kicks", () => {
    // Home scores all 5 kicks (rng < 0.7), away misses all 5 (rng >= 0.7).
    const values: number[] = [];
    for (let i = 0; i < 5; i += 1) {
      values.push(0.1, 0.9);
    }
    const rng = scripted(values);

    const [home, away] = simulatePenalties(rng);

    expect(home).toBe(5);
    expect(away).toBe(0);
    expect(home).not.toBe(away);
  });

  it("decides the shootout in sudden death", () => {
    // 5 kicks: both score every time -> 5-5 tie, enters sudden death.
    const values: number[] = [];
    for (let i = 0; i < 5; i += 1) {
      values.push(0.1, 0.1);
    }
    // Sudden death round: home scores, away misses -> home wins immediately.
    values.push(0.1, 0.9);
    const rng = scripted(values);

    const [home, away] = simulatePenalties(rng);

    expect(home).toBe(6);
    expect(away).toBe(5);
  });

  it("decides the 20-round deadlock with a coin flip favoring home", () => {
    // Both teams score on every kick: 5-5 after regulation (10 draws), then
    // both score on every sudden-death attempt for all 20 rounds (40 more
    // draws) -> perpetual 5-5 tie. The 51st draw is the deadlock coin flip:
    // < 0.5 awards home.
    const values = new Array(10 + 2 * 20).fill(0.1);
    values.push(0.1);
    const rng = scripted(values);

    const [home, away] = simulatePenalties(rng);

    expect(home).toBe(away + 1);
  });

  it("decides the 20-round deadlock with a coin flip favoring away", () => {
    // Same perpetual tie through regulation and sudden death, but the 51st
    // draw is >= 0.5, so the coin flip awards away instead.
    const values = new Array(10 + 2 * 20).fill(0.1);
    values.push(0.9);
    const rng = scripted(values);

    const [home, away] = simulatePenalties(rng);

    expect(away).toBe(home + 1);
  });

  it("never returns a tie across many seeded runs", () => {
    for (let seed = 0; seed < 200; seed += 1) {
      const [home, away] = simulatePenalties(mulberry32(seed));
      expect(home).not.toBe(away);
    }
  });
});
