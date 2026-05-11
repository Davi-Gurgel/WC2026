import { computeStandings } from "@/lib/tournament/standings";
import { STORAGE_VERSION } from "@/lib/tournament/storage-schema";
import type { CompactMatch, CompactTournamentState, StoredCompactTournamentState } from "@/lib/tournament/storage-schema";
import type { Match, Team, TournamentState, WorldCupGroup } from "@/lib/types/tournament";

export function toStoredTournamentState(state: TournamentState): StoredCompactTournamentState {
  return {
    version: STORAGE_VERSION,
    state: {
      groups: state.groups.map((group) => ({
        letter: group.letter,
        matches: group.matches.map(compactMatch)
      })),
      topScorers: state.topScorers,
      r32Matches: state.r32Matches.map(compactMatch),
      r16Matches: state.r16Matches.map(compactMatch),
      quarterFinals: state.quarterFinals.map(compactMatch),
      semiFinals: state.semiFinals.map(compactMatch),
      thirdPlaceMatch: state.thirdPlaceMatch ? compactMatch(state.thirdPlaceMatch) : null,
      finalMatch: state.finalMatch ? compactMatch(state.finalMatch) : null,
      phase: state.phase,
      currentGroupMatchDay: state.currentGroupMatchDay,
      active: state.active,
      championCode: state.champion?.countryCode ?? null,
      runnerUpCode: state.runnerUp?.countryCode ?? null,
      qualified3rdCodes: state.qualified3rd.map((team) => team.countryCode)
    }
  };
}

export function expandCompactTournamentState(compact: CompactTournamentState, teams: Team[]): TournamentState {
  const teamByCode = new Map(teams.map((team) => [team.countryCode.toUpperCase(), team]));
  const teamFromCode = (code: string) => {
    const team = teamByCode.get(code.toUpperCase());
    if (!team) throw new Error(`Missing team for country code ${code}`);
    return team;
  };
  const nullableTeamFromCode = (code: string | null) => (code ? teamFromCode(code) : null);

  const groups = compact.groups.map<WorldCupGroup>((group) => {
    const groupTeams = teams.filter((team) => team.group.toUpperCase() === group.letter.toUpperCase());
    const matches = group.matches.map((match) => expandCompactMatch(match, teamFromCode));
    return {
      letter: group.letter,
      teams: groupTeams,
      matches,
      standings: computeStandings(groupTeams, matches.filter((match) => match.played))
    };
  });

  return {
    allTeams: compact.active || compact.groups.length ? teams : [],
    groups,
    topScorers: compact.topScorers,
    r32Matches: compact.r32Matches.map((match) => expandCompactMatch(match, teamFromCode)),
    r16Matches: compact.r16Matches.map((match) => expandCompactMatch(match, teamFromCode)),
    quarterFinals: compact.quarterFinals.map((match) => expandCompactMatch(match, teamFromCode)),
    semiFinals: compact.semiFinals.map((match) => expandCompactMatch(match, teamFromCode)),
    thirdPlaceMatch: compact.thirdPlaceMatch ? expandCompactMatch(compact.thirdPlaceMatch, teamFromCode) : null,
    finalMatch: compact.finalMatch ? expandCompactMatch(compact.finalMatch, teamFromCode) : null,
    phase: compact.phase,
    currentGroupMatchDay: compact.currentGroupMatchDay,
    active: compact.active,
    champion: nullableTeamFromCode(compact.championCode),
    runnerUp: nullableTeamFromCode(compact.runnerUpCode),
    qualified3rd: compact.qualified3rdCodes.map(teamFromCode)
  };
}

function compactMatch(match: Match): CompactMatch {
  return {
    id: match.id,
    h: match.homeTeam.countryCode,
    a: match.awayTeam.countryCode,
    hs: match.homeScore,
    as: match.awayScore,
    d: match.date,
    r: match.round,
    p: match.played,
    g: match.groupName,
    k: match.knockout,
    kr: match.knockoutRound,
    et: match.wentToExtraTime,
    pen: match.wentToPenalties,
    hp: match.homePenalties,
    ap: match.awayPenalties,
    v: match.venue,
    n: match.matchNumber,
    hsc: match.goalScorers[match.homeTeam.name] ?? [],
    asc: match.goalScorers[match.awayTeam.name] ?? []
  };
}

function expandCompactMatch(match: CompactMatch, teamFromCode: (code: string) => Team): Match {
  const homeTeam = teamFromCode(match.h);
  const awayTeam = teamFromCode(match.a);

  return {
    id: match.id,
    homeTeam,
    awayTeam,
    homeScore: match.hs,
    awayScore: match.as,
    date: match.d,
    round: match.r,
    played: match.p,
    groupName: match.g,
    knockout: match.k,
    knockoutRound: match.kr,
    wentToExtraTime: match.et,
    wentToPenalties: match.pen,
    homePenalties: match.hp,
    awayPenalties: match.ap,
    venue: match.v,
    matchNumber: match.n,
    goalScorers: {
      [homeTeam.name]: match.hsc,
      [awayTeam.name]: match.asc
    }
  };
}
