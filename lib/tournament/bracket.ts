import type { KnockoutRound, Match, Team, WorldCupGroup } from "@/lib/types/tournament";
import { buildKnockoutMatch, getLoser, getWinner } from "@/lib/tournament/matches";

export function generateR32Bracket(groups: WorldCupGroup[], qualified3rd: Team[]): Match[] {
  const winners = new Map<string, Team>();
  const runners = new Map<string, Team>();
  for (const group of groups) {
    const first = group.teams.find((team) => team.name === group.standings[0]?.teamName);
    const second = group.teams.find((team) => team.name === group.standings[1]?.teamName);
    if (first) winners.set(group.letter, first);
    if (second) runners.set(group.letter, second);
  }

  const team = (map: Map<string, Team>, key: string) => {
    const value = map.get(key);
    if (!value) throw new Error(`Missing team for group ${key}`);
    return value;
  };
  const third = (index: number) => {
    const value = qualified3rd[index];
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
    firstLoser && secondLoser ? buildKnockoutMatch(firstLoser, secondLoser, 103, "THIRD_PLACE") : null,
    firstWinner && secondWinner ? buildKnockoutMatch(firstWinner, secondWinner, 104, "FINAL") : null
  ];
}
