import type { Match, Team, TeamGroupStats, WorldCupGroup } from "@/lib/types/tournament";

export function computeStandings(teams: Team[], matches: Match[]): TeamGroupStats[] {
  const stats = new Map<string, TeamGroupStats>();
  const rank = new Map<string, number>();

  for (const team of teams) {
    stats.set(team.name, {
      teamName: team.name,
      countryCode: team.countryCode,
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

  const overall = [...stats.values()].sort(
    (a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor
  );

  const result: TeamGroupStats[] = [];
  let cluster: TeamGroupStats[] = [];
  for (const row of overall) {
    if (cluster.length && !isOverallTied(cluster[0], row)) {
      result.push(...orderTiedTeams(cluster, matches, rank));
      cluster = [];
    }
    cluster.push(row);
  }
  if (cluster.length) result.push(...orderTiedTeams(cluster, matches, rank));
  return result;
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

function isOverallTied(a: TeamGroupStats, b: TeamGroupStats): boolean {
  return a.points === b.points && a.goalDifference === b.goalDifference && a.goalsFor === b.goalsFor;
}

/**
 * FIFA tiebreaker for teams still tied on overall points/GD/GF: build a mini-table from
 * only the matches played among the tied teams (points, then GD, then goals scored in
 * those matches), then fall back to `fifaRanking`.
 *
 * Known simplification: FIFA recursively re-applies the criteria to any subset that
 * remains tied after the mini-table; this implementation applies the mini-table once and
 * relies on `fifaRanking` as the deterministic final fallback (substituting for
 * fair-play points and drawing of lots, which this simulator does not model).
 */
function orderTiedTeams(cluster: TeamGroupStats[], matches: Match[], rank: Map<string, number>): TeamGroupStats[] {
  if (cluster.length === 1) return cluster;

  const tiedNames = new Set(cluster.map((row) => row.teamName));
  const mini = new Map<string, { points: number; gd: number; gf: number }>(
    cluster.map((row) => [row.teamName, { points: 0, gd: 0, gf: 0 }])
  );

  for (const match of matches) {
    if (!match.played || !tiedNames.has(match.homeTeam.name) || !tiedNames.has(match.awayTeam.name)) continue;

    const home = mini.get(match.homeTeam.name)!;
    const away = mini.get(match.awayTeam.name)!;

    home.gf += match.homeScore;
    home.gd += match.homeScore - match.awayScore;
    away.gf += match.awayScore;
    away.gd += match.awayScore - match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.points += 3;
    } else if (match.awayScore > match.homeScore) {
      away.points += 3;
    } else {
      home.points += 1;
      away.points += 1;
    }
  }

  return [...cluster].sort((a, b) => {
    const ma = mini.get(a.teamName)!;
    const mb = mini.get(b.teamName)!;
    return (
      mb.points - ma.points ||
      mb.gd - ma.gd ||
      mb.gf - ma.gf ||
      (rank.get(a.teamName) ?? 999) - (rank.get(b.teamName) ?? 999)
    );
  });
}
