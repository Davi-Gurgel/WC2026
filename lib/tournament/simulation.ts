import type { Match, Player, Scorer, Team, TournamentState } from "@/lib/types/tournament";
import { generateNextRound, generateR32Bracket, generateThirdAndFinal } from "@/lib/tournament/bracket";
import { getLoser, getWinner } from "@/lib/tournament/matches";
import { scorerMapToTopScorers, topScorersToMap } from "@/lib/tournament/scorers";
import { calculateQualifiedThirds, computeStandings } from "@/lib/tournament/standings";

export function simulateCurrentGroupMatchDay(state: TournamentState): TournamentState {
  if (state.phase !== "GROUP_STAGE" || state.currentGroupMatchDay > 3) return state;

  const day = state.currentGroupMatchDay;
  const scorerMap = topScorersToMap(state.topScorers);
  const groups = state.groups.map((group) => {
    const matches = group.matches.map((match) => {
      if (match.round !== day || match.played) return match;
      return simulateMatch(match, scorerMap, false);
    });

    return {
      ...group,
      matches,
      standings: computeStandings(group.teams, matches.filter((match) => match.played))
    };
  });

  let nextState: TournamentState = {
    ...state,
    groups,
    topScorers: scorerMapToTopScorers(scorerMap),
    currentGroupMatchDay: day + 1
  };

  if (nextState.currentGroupMatchDay > 3) {
    const qualified3rd = calculateQualifiedThirds(groups);
    nextState = {
      ...nextState,
      qualified3rd,
      r32Matches: generateR32Bracket(groups, qualified3rd),
      phase: "ROUND_OF_32"
    };
  }

  return nextState;
}

export function simulateAllGroupMatchDays(state: TournamentState): TournamentState {
  let next = state;
  while (next.phase === "GROUP_STAGE") {
    const updated = simulateCurrentGroupMatchDay(next);
    if (updated === next) break;
    next = updated;
  }
  return next;
}

export function simulateCurrentKnockoutRound(state: TournamentState): TournamentState {
  const scorerMap = topScorersToMap(state.topScorers);

  if (state.phase === "ROUND_OF_32") {
    const r32Matches = simulateRound(state.r32Matches, scorerMap);
    return { ...state, r32Matches, r16Matches: generateNextRound(r32Matches, 89, "ROUND_OF_16"), phase: "ROUND_OF_16", topScorers: scorerMapToTopScorers(scorerMap) };
  }

  if (state.phase === "ROUND_OF_16") {
    const r16Matches = simulateRound(state.r16Matches, scorerMap);
    return { ...state, r16Matches, quarterFinals: generateNextRound(r16Matches, 97, "QUARTERFINAL"), phase: "QUARTERFINAL", topScorers: scorerMapToTopScorers(scorerMap) };
  }

  if (state.phase === "QUARTERFINAL") {
    const quarterFinals = simulateRound(state.quarterFinals, scorerMap);
    return { ...state, quarterFinals, semiFinals: generateNextRound(quarterFinals, 101, "SEMIFINAL"), phase: "SEMIFINAL", topScorers: scorerMapToTopScorers(scorerMap) };
  }

  if (state.phase === "SEMIFINAL") {
    const semiFinals = simulateRound(state.semiFinals, scorerMap);
    const [thirdPlaceMatch, finalMatch] = generateThirdAndFinal(semiFinals);
    return { ...state, semiFinals, thirdPlaceMatch, finalMatch, phase: "FINISHED", topScorers: scorerMapToTopScorers(scorerMap) };
  }

  if (state.phase === "FINISHED") {
    const thirdPlaceMatch = state.thirdPlaceMatch?.played ? state.thirdPlaceMatch : state.thirdPlaceMatch ? simulateMatch(state.thirdPlaceMatch, scorerMap, true) : null;
    const finalMatch = state.finalMatch?.played ? state.finalMatch : state.finalMatch ? simulateMatch(state.finalMatch, scorerMap, true) : null;
    return {
      ...state,
      thirdPlaceMatch,
      finalMatch,
      champion: finalMatch?.played ? getWinner(finalMatch) : state.champion,
      runnerUp: finalMatch?.played ? getLoser(finalMatch) : state.runnerUp,
      topScorers: scorerMapToTopScorers(scorerMap)
    };
  }

  return state;
}

export function simulatePenalties(): [number, number] {
  const conversionRate = 0.7;
  let home = 0;
  let away = 0;
  for (let index = 0; index < 5; index += 1) {
    if (Math.random() < conversionRate) home += 1;
    if (Math.random() < conversionRate) away += 1;
  }

  let suddenDeath = 0;
  while (home === away && suddenDeath < 20) {
    const homeScores = Math.random() < conversionRate;
    const awayScores = Math.random() < conversionRate;
    if (homeScores && !awayScores) home += 1;
    if (!homeScores && awayScores) away += 1;
    suddenDeath += 1;
  }
  if (home === away) {
    home += 1;
  }
  return [home, away];
}

function simulateRound(matches: Match[], scorerMap: Map<string, Scorer>): Match[] {
  return matches.map((match) => (match.played ? match : simulateMatch(match, scorerMap, true)));
}

function simulateMatch(match: Match, scorerMap: Map<string, Scorer>, knockout: boolean): Match {
  const homeStrength = match.homeTeam.strength + 5;
  const awayStrength = match.awayTeam.strength;
  const homeGoalChance = (homeStrength * randomLuck()) / 380;
  const awayGoalChance = (awayStrength * randomLuck()) / 380;

  let homeScore = countGoals(homeGoalChance, 7);
  let awayScore = countGoals(awayGoalChance, 7);
  let wentToExtraTime = false;
  let wentToPenalties = false;
  let homePenalties = 0;
  let awayPenalties = 0;

  if (knockout && homeScore === awayScore) {
    wentToExtraTime = true;
    homeScore += countGoals((homeStrength * randomLuck()) / 380, 2);
    awayScore += countGoals((awayStrength * randomLuck()) / 380, 2);

    if (homeScore === awayScore) {
      wentToPenalties = true;
      [homePenalties, awayPenalties] = simulatePenalties();
    }
  }

  const goalScorers = {
    [match.homeTeam.name]: assignGoalScorers(match.homeTeam, homeScore, scorerMap),
    [match.awayTeam.name]: assignGoalScorers(match.awayTeam, awayScore, scorerMap)
  };

  return {
    ...match,
    homeScore,
    awayScore,
    played: true,
    wentToExtraTime,
    wentToPenalties,
    homePenalties,
    awayPenalties,
    goalScorers
  };
}

function countGoals(chance: number, events: number): number {
  let goals = 0;
  for (let index = 0; index < events; index += 1) {
    if (Math.random() < chance) goals += 1;
  }
  return Math.min(goals, 5);
}

function randomLuck(): number {
  return 0.85 + Math.random() * 0.3;
}

function assignGoalScorers(team: Team, goals: number, scorerMap: Map<string, Scorer>): string[] {
  const scorers: string[] = [];
  for (let index = 0; index < goals; index += 1) {
    const player = selectScorer(team);
    if (!player) continue;
    scorers.push(player.name);
    const key = `${player.name}|${team.name}`;
    const current = scorerMap.get(key) ?? { playerName: player.name, teamName: team.name, goals: 0 };
    scorerMap.set(key, { ...current, goals: current.goals + 1 });
  }
  return scorers;
}

function selectScorer(team: Team): Player | null {
  const byPosition = (position: Player["position"]) => team.players.filter((player) => player.position === position);
  const r = Math.random();
  if (r < 0.6) return selectPlayerWeightedByStrength(byPosition("FORWARD")) ?? selectPlayerWeightedByStrength(team.players);
  if (r < 0.85) return selectPlayerWeightedByStrength(byPosition("MIDFIELDER")) ?? selectPlayerWeightedByStrength(team.players);
  if (r < 0.97) return selectPlayerWeightedByStrength(byPosition("DEFENDER")) ?? selectPlayerWeightedByStrength(team.players);
  return selectPlayerWeightedByStrength(byPosition("GOALKEEPER")) ?? selectPlayerWeightedByStrength(team.players);
}

function selectPlayerWeightedByStrength(players: Player[]): Player | null {
  if (!players.length) return null;
  const total = players.reduce((sum, player) => sum + player.strength, 0);
  if (total <= 0) return players[Math.floor(Math.random() * players.length)];
  let target = Math.floor(Math.random() * total);
  for (const player of players) {
    target -= player.strength;
    if (target < 0) return player;
  }
  return players[players.length - 1];
}
