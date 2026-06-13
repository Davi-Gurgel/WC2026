import type { BracketRound, KnockoutRound, Scorer, TournamentPhase } from "@/lib/types/tournament";

export const STORAGE_KEY = "wc26-tournament-state-v1";
export const STORAGE_VERSION = 4;

export type StoredTournamentState = StoredCompactTournamentState;

export type StoredCompactTournamentState = {
  version: typeof STORAGE_VERSION;
  state: CompactTournamentState;
};

export type CompactTournamentState = {
  groups: CompactGroup[];
  topScorers: Scorer[];
  rounds: CompactKnockoutRound[];
  thirdPlace: CompactMatch | null;
  phase: TournamentPhase;
  currentGroupMatchDay: number;
  active: boolean;
  championCode: string | null;
  runnerUpCode: string | null;
  qualified3rdCodes: string[];
};

export type CompactKnockoutRound = {
  round: BracketRound;
  matches: CompactMatch[];
};

export type CompactGroup = {
  letter: string;
  matches: CompactMatch[];
};

export type CompactMatch = {
  id: string;
  h: string;
  a: string;
  hs: number;
  as: number;
  d: string | null;
  r: number;
  p: boolean;
  g?: string;
  k: boolean;
  kr?: KnockoutRound;
  et: boolean;
  pen: boolean;
  hp: number;
  ap: number;
  v?: string;
  n?: number;
  hsc: string[];
  asc: string[];
};
