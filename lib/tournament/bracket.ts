import type { Bracket, BracketRound, KnockoutRound, KnockoutRoundData, Match, Team, WorldCupGroup } from "@/lib/types/tournament";
import { buildKnockoutMatch, getLoser, getWinner } from "@/lib/tournament/matches";
import type { Rng } from "@/lib/tournament/rng";

const THIRD_SLOT_GROUPS = ["E", "I", "A", "L", "D", "G", "B", "K"] as const;

/** The winners' rounds in order. THIRD_PLACE is deliberately absent — it is a sibling of the final. */
const KNOCKOUT_PROGRESSION: BracketRound[] = ["ROUND_OF_32", "ROUND_OF_16", "QUARTERFINAL", "SEMIFINAL", "FINAL"];

/** FIFA match numbers for the first match of each knockout round. */
const ROUND_FIRST_MATCH_NUMBER: Record<KnockoutRound, number> = {
  ROUND_OF_32: 73,
  ROUND_OF_16: 89,
  QUARTERFINAL: 97,
  SEMIFINAL: 101,
  THIRD_PLACE: 103,
  FINAL: 104
};

/**
 * Assigns ranked third-place teams to bracket slots so no team faces its own
 * group winner. Prefers rank order; a depth-first search resolves conflicts.
 * Simplification vs FIFA's published allocation annex, which fixes pairings
 * per combination of qualified groups.
 */
export function assignThirdsToSlots(
  qualified3rd: Team[],
  slotGroups: readonly string[] = THIRD_SLOT_GROUPS
): Team[] {
  const assignment: Team[] = [];
  const used = new Array<boolean>(qualified3rd.length).fill(false);

  const place = (slot: number): boolean => {
    if (slot === slotGroups.length) return true;
    for (let i = 0; i < qualified3rd.length; i += 1) {
      if (used[i] || qualified3rd[i].group.toUpperCase() === slotGroups[slot]) continue;
      used[i] = true;
      assignment[slot] = qualified3rd[i];
      if (place(slot + 1)) return true;
      used[i] = false;
    }
    return false;
  };

  if (!place(0)) throw new Error("No valid third-place allocation exists");
  return assignment;
}

export function generateR32Bracket(groups: WorldCupGroup[], qualified3rd: Team[]): Match[] {
  const winners = new Map<string, Team>();
  const runners = new Map<string, Team>();
  for (const group of groups) {
    const first = group.teams.find((team) => team.name === group.standings[0]?.teamName);
    const second = group.teams.find((team) => team.name === group.standings[1]?.teamName);
    if (first) winners.set(group.letter, first);
    if (second) runners.set(group.letter, second);
  }

  const slottedThirds = assignThirdsToSlots(qualified3rd);

  const team = (map: Map<string, Team>, key: string) => {
    const value = map.get(key);
    if (!value) throw new Error(`Missing team for group ${key}`);
    return value;
  };
  const third = (index: number) => {
    const value = slottedThirds[index];
    if (!value) throw new Error(`Missing third-place qualifier ${index + 1}`);
    return value;
  };

  return [
    buildKnockoutMatch(team(runners, "A"), team(runners, "B"), 73, "ROUND_OF_32"),
    buildKnockoutMatch(team(winners, "E"), third(0), 74, "ROUND_OF_32"),
    buildKnockoutMatch(team(winners, "F"), team(runners, "C"), 75, "ROUND_OF_32"),
    buildKnockoutMatch(team(winners, "C"), team(runners, "F"), 76, "ROUND_OF_32"),
    buildKnockoutMatch(team(winners, "I"), third(1), 77, "ROUND_OF_32"),
    buildKnockoutMatch(team(runners, "E"), team(runners, "I"), 78, "ROUND_OF_32"),
    buildKnockoutMatch(team(winners, "A"), third(2), 79, "ROUND_OF_32"),
    buildKnockoutMatch(team(winners, "L"), third(3), 80, "ROUND_OF_32"),
    buildKnockoutMatch(team(winners, "D"), third(4), 81, "ROUND_OF_32"),
    buildKnockoutMatch(team(winners, "G"), third(5), 82, "ROUND_OF_32"),
    buildKnockoutMatch(team(runners, "K"), team(runners, "L"), 83, "ROUND_OF_32"),
    buildKnockoutMatch(team(winners, "H"), team(runners, "J"), 84, "ROUND_OF_32"),
    buildKnockoutMatch(team(winners, "B"), third(6), 85, "ROUND_OF_32"),
    buildKnockoutMatch(team(winners, "J"), team(runners, "H"), 86, "ROUND_OF_32"),
    buildKnockoutMatch(team(winners, "K"), third(7), 87, "ROUND_OF_32"),
    buildKnockoutMatch(team(runners, "D"), team(runners, "G"), 88, "ROUND_OF_32")
  ];
}

export function generateNextRound(previous: Match[], firstMatchNumber: number, round: KnockoutRound): Match[] {
  const winners = previous.map(getWinner);
  const matches: Match[] = [];
  for (let index = 0; index < winners.length; index += 2) {
    const home = winners[index];
    const away = winners[index + 1];
    if (!home || !away) continue;
    matches.push(buildKnockoutMatch(home, away, firstMatchNumber + index / 2, round));
  }
  return matches;
}

export function generateThirdAndFinal(semiFinals: Match[]): [Match | null, Match | null] {
  const firstLoser = getLoser(semiFinals[0]);
  const secondLoser = getLoser(semiFinals[1]);
  const firstWinner = getWinner(semiFinals[0]);
  const secondWinner = getWinner(semiFinals[1]);
  return [
    firstLoser && secondLoser ? buildKnockoutMatch(firstLoser, secondLoser, ROUND_FIRST_MATCH_NUMBER.THIRD_PLACE, "THIRD_PLACE") : null,
    firstWinner && secondWinner ? buildKnockoutMatch(firstWinner, secondWinner, ROUND_FIRST_MATCH_NUMBER.FINAL, "FINAL") : null
  ];
}

// ── Bracket: the deep module over the knockout rounds ────────────────────────

/** Simulates one match. Injected so the bracket stays independent of the scoring model. */
export type SimulateKnockoutMatch = (match: Match, rng: Rng) => Match;

export function createEmptyBracket(): Bracket {
  return { rounds: [], thirdPlace: null };
}

/** Seeds the Round of 32 from group results; the rest of the bracket is advanced from it. */
export function createBracket(groups: WorldCupGroup[], qualified3rd: Team[]): Bracket {
  return {
    rounds: [{ round: "ROUND_OF_32", matches: generateR32Bracket(groups, qualified3rd) }],
    thirdPlace: null
  };
}

/** Matches of a single round (THIRD_PLACE resolves to the playoff). */
export function roundMatches(bracket: Bracket, round: KnockoutRound): Match[] {
  if (round === "THIRD_PLACE") return bracket.thirdPlace ? [bracket.thirdPlace] : [];
  return bracket.rounds.find((entry) => entry.round === round)?.matches ?? [];
}

export function bracketFinal(bracket: Bracket): Match | null {
  return roundMatches(bracket, "FINAL")[0] ?? null;
}

/** The first round still holding an unplayed match, or null when nothing is pending. */
export function currentRound(bracket: Bracket): KnockoutRoundData | null {
  return bracket.rounds.find((entry) => entry.matches.some((match) => !match.played)) ?? null;
}

export function isBracketComplete(bracket: Bracket): boolean {
  return bracketFinal(bracket)?.played ?? false;
}

export function allKnockoutMatches(bracket: Bracket): Match[] {
  return [
    ...bracket.rounds.flatMap((entry) => entry.matches),
    ...(bracket.thirdPlace ? [bracket.thirdPlace] : [])
  ];
}

export function knockoutMatchesForTeam(bracket: Bracket, teamName: string): Match[] {
  return allKnockoutMatches(bracket).filter(
    (match) => match.homeTeam.name === teamName || match.awayTeam.name === teamName
  );
}

/**
 * Plays the current round's unplayed matches and grows the bracket: appends the
 * next round, or — once the semi-finals are decided — spawns the final and the
 * third-place playoff together. Returns the bracket unchanged when nothing is pending.
 */
export function advanceBracket(bracket: Bracket, simulate: SimulateKnockoutMatch, rng: Rng): Bracket {
  const current = currentRound(bracket);
  if (!current) return bracket;

  const playMatch = (match: Match) => (match.played ? match : simulate(match, rng));

  if (current.round === "FINAL") {
    // Decide the third-place playoff before the final to keep RNG draw order stable.
    const thirdPlace = bracket.thirdPlace && !bracket.thirdPlace.played ? simulate(bracket.thirdPlace, rng) : bracket.thirdPlace;
    return { rounds: withRound(bracket.rounds, "FINAL", current.matches.map(playMatch)), thirdPlace };
  }

  const playedMatches = current.matches.map(playMatch);
  const rounds = withRound(bracket.rounds, current.round, playedMatches);

  if (current.round === "SEMIFINAL") {
    const [thirdPlace, final] = generateThirdAndFinal(playedMatches);
    return {
      rounds: final ? [...rounds, { round: "FINAL", matches: [final] }] : rounds,
      thirdPlace
    };
  }

  const nextRound = KNOCKOUT_PROGRESSION[KNOCKOUT_PROGRESSION.indexOf(current.round) + 1];
  const nextMatches = generateNextRound(playedMatches, ROUND_FIRST_MATCH_NUMBER[nextRound], nextRound);
  return { rounds: [...rounds, { round: nextRound, matches: nextMatches }], thirdPlace: bracket.thirdPlace };
}

function withRound(rounds: KnockoutRoundData[], round: KnockoutRound, matches: Match[]): KnockoutRoundData[] {
  return rounds.map((entry) => (entry.round === round ? { ...entry, matches } : entry));
}
