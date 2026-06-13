type Position = "GOALKEEPER" | "DEFENDER" | "MIDFIELDER" | "FORWARD";

export type Player = {
  name: string;
  strength: number;
  position: Position;
};

export type Team = {
  name: string;
  strength: number;
  players: Player[];
  attackStrength: number;
  defenseStrength: number;
  midfieldStrength: number;
  maxPlayerStrength?: number;
  countryCode: string;
  confederation: string;
  group: string;
  fifaRanking: number;
};

export type TournamentPhase =
  | "NOT_STARTED"
  | "GROUP_STAGE"
  | "ROUND_OF_32"
  | "ROUND_OF_16"
  | "QUARTERFINAL"
  | "SEMIFINAL"
  | "FINAL"
  | "FINISHED";

export type KnockoutRound =
  | "ROUND_OF_32"
  | "ROUND_OF_16"
  | "QUARTERFINAL"
  | "SEMIFINAL"
  | "THIRD_PLACE"
  | "FINAL";

export type Match = {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  date: string | null;
  round: number;
  played: boolean;
  groupName?: string;
  knockout: boolean;
  knockoutRound?: KnockoutRound;
  wentToExtraTime: boolean;
  wentToPenalties: boolean;
  homePenalties: number;
  awayPenalties: number;
  venue?: string;
  matchNumber?: number;
  goalScorers: Record<string, string[]>;
};

export type TeamGroupStats = {
  teamName: string;
  countryCode?: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export type WorldCupGroup = {
  letter: string;
  teams: Team[];
  matches: Match[];
  standings: TeamGroupStats[];
};

export type Scorer = {
  playerName: string;
  teamName: string;
  goals: number;
};

/** A round in the winners' chain — every knockout round except the third-place playoff. */
export type BracketRound = Exclude<KnockoutRound, "THIRD_PLACE">;

/** One stage of the knockout bracket and its matches as a unit. */
export type KnockoutRoundData = {
  round: BracketRound;
  matches: Match[];
};

/**
 * The whole single-elimination structure after the group stage: the ordered
 * winners' rounds (ROUND_OF_32 → FINAL) plus the third-place playoff, which is
 * a sibling of the final, never a link in the rounds chain.
 */
export type Bracket = {
  rounds: KnockoutRoundData[];
  thirdPlace: Match | null;
};

export type TournamentState = {
  allTeams: Team[];
  groups: WorldCupGroup[];
  topScorers: Scorer[];
  bracket: Bracket;
  phase: TournamentPhase;
  currentGroupMatchDay: number;
  active: boolean;
  champion: Team | null;
  runnerUp: Team | null;
  qualified3rd: Team[];
};
