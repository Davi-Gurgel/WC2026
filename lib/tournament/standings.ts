import type { Match, Team, TeamGroupStats, WorldCupGroup } from "@/lib/types/tournament";

export function computeStandings(teams: Team[], matches: Match[]): TeamGroupStats[] {
  const stats = new Map<string, TeamGroupStats>();
  const rank = new Map<string, number>();

  for (const team of teams) {
    stats.set(team.name, {
      teamName: team.name,
      countryCode: team.countryCode,
      flagEmoji: team.flagEmoji,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0
    });
    rank.set(team.name, team.fifaRanking);
  }

  for (const match of matches) {
    const home = stats.get(match.homeTeam.name);
    const away = stats.get(match.awayTeam.name);
    if (!home || !away || !match.played) continue;

    if (match.homeScore > match.awayScore) {
      addResult(home, match.homeScore, match.awayScore, "win");
      addResult(away, match.awayScore, match.homeScore, "loss");
    } else if (match.awayScore > match.homeScore) {
      addResult(away, match.awayScore, match.homeScore, "win");
      addResult(home, match.homeScore, match.awayScore, "loss");
    } else {
      addResult(home, match.homeScore, match.awayScore, "draw");
      addResult(away, match.awayScore, match.homeScore, "draw");
    }
  }

  return [...stats.values()].sort((a, b) => {
    return (
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      compareHeadToHead(a, b, matches, "points") ||
      compareHeadToHead(a, b, matches, "gd") ||
      compareHeadToHead(a, b, matches, "gs") ||
      (rank.get(a.teamName) ?? 999) - (rank.get(b.teamName) ?? 999)
    );
  });
}

export function calculateQualifiedThirds(groups: WorldCupGroup[]): Team[] {
  return groups
    .map((group) => {
      const stats = group.standings[2];
      const team = stats ? group.teams.find((item) => item.name === stats.teamName) : undefined;
      return team && stats ? { team, stats } : null;
    })
    .filter((entry): entry is { team: Team; stats: TeamGroupStats } => Boolean(entry))
    .sort(
      (a, b) =>
        b.stats.points - a.stats.points ||
        b.stats.goalDifference - a.stats.goalDifference ||
        b.stats.goalsFor - a.stats.goalsFor ||
        a.team.fifaRanking - b.team.fifaRanking
    )
    .slice(0, 8)
    .map((entry) => entry.team);
}

function addResult(stats: TeamGroupStats, goalsFor: number, goalsAgainst: number, result: "win" | "draw" | "loss") {
  stats.played += 1;
  stats.goalsFor += goalsFor;
  stats.goalsAgainst += goalsAgainst;
  stats.goalDifference = stats.goalsFor - stats.goalsAgainst;
  if (result === "win") {
    stats.wins += 1;
    stats.points += 3;
  } else if (result === "draw") {
    stats.draws += 1;
    stats.points += 1;
  } else {
    stats.losses += 1;
  }
}

function compareHeadToHead(a: TeamGroupStats, b: TeamGroupStats, matches: Match[], criterion: "points" | "gd" | "gs"): number {
  const h2h = matches.find(
    (match) =>
      match.played &&
      ((match.homeTeam.name === a.teamName && match.awayTeam.name === b.teamName) ||
        (match.homeTeam.name === b.teamName && match.awayTeam.name === a.teamName))
  );
  if (!h2h) return 0;

  const aHome = h2h.homeTeam.name === a.teamName;
  const aGoals = aHome ? h2h.homeScore : h2h.awayScore;
  const bGoals = aHome ? h2h.awayScore : h2h.homeScore;
  if (criterion === "points") {
    const aPts = aGoals > bGoals ? 3 : aGoals === bGoals ? 1 : 0;
    const bPts = bGoals > aGoals ? 3 : bGoals === aGoals ? 1 : 0;
    return bPts - aPts;
  }
  if (criterion === "gd") return bGoals - aGoals - (aGoals - bGoals);
  return bGoals - aGoals;
}
