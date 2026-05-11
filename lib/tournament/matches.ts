import type { KnockoutRound, Match, Team } from "@/lib/types/tournament";

export function buildGroupMatch(homeTeam: Team, awayTeam: Team, date: Date, groupName: string, round: number, slot: number): Match {
  return baseMatch(`${groupName}-${round}-${slot}`, homeTeam, awayTeam, date.toISOString().slice(0, 10), round, {
    groupName,
    knockout: false
  });
}

export function buildKnockoutMatch(homeTeam: Team, awayTeam: Team, matchNumber: number, knockoutRound: KnockoutRound): Match {
  return baseMatch(`M${matchNumber}`, homeTeam, awayTeam, null, 0, {
    knockout: true,
    knockoutRound,
    matchNumber
  });
}

export function scoreDisplay(match: Match): string {
  if (!match.played) return "vs";
  const score = `${match.homeScore} - ${match.awayScore}`;
  if (match.wentToPenalties) return `${score} (pen: ${match.homePenalties}-${match.awayPenalties})`;
  if (match.wentToExtraTime) return `${score} (prorr.)`;
  return score;
}

export function getWinner(match: Match): Team | null {
  if (!match.played) return null;
  if (match.wentToPenalties) return match.homePenalties > match.awayPenalties ? match.homeTeam : match.awayTeam;
  if (match.homeScore > match.awayScore) return match.homeTeam;
  if (match.awayScore > match.homeScore) return match.awayTeam;
  return null;
}

export function getLoser(match: Match): Team | null {
  const winner = getWinner(match);
  if (!winner) return null;
  return winner.name === match.homeTeam.name ? match.awayTeam : match.homeTeam;
}

function baseMatch(
  id: string,
  homeTeam: Team,
  awayTeam: Team,
  date: string | null,
  round: number,
  partial: Partial<Match>
): Match {
  return {
    id,
    homeTeam,
    awayTeam,
    homeScore: 0,
    awayScore: 0,
    date,
    round,
    played: false,
    knockout: false,
    wentToExtraTime: false,
    wentToPenalties: false,
    homePenalties: 0,
    awayPenalties: 0,
    goalScorers: {
      [homeTeam.name]: [],
      [awayTeam.name]: []
    },
    ...partial
  };
}
