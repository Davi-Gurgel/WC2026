import type { TournamentPhase } from "@/lib/types/tournament";

export const GROUP_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

const PHASE_LABELS_BY_LOCALE = {
  "pt-BR": {
    NOT_STARTED: "Não iniciada",
    GROUP_STAGE: "Fase de grupos",
    ROUND_OF_32: "16 avos de final",
    ROUND_OF_16: "Oitavas de final",
    QUARTERFINAL: "Quartas de final",
    SEMIFINAL: "Semifinais",
    FINISHED: "Finais"
  },
  en: {
    NOT_STARTED: "Not started",
    GROUP_STAGE: "Group stage",
    ROUND_OF_32: "Round of 32",
    ROUND_OF_16: "Round of 16",
    QUARTERFINAL: "Quarterfinals",
    SEMIFINAL: "Semifinals",
    FINISHED: "Finals"
  }
} satisfies Record<string, Record<TournamentPhase, string>>;

export type PhaseLabelLocale = keyof typeof PHASE_LABELS_BY_LOCALE;

export function getPhaseLabels(locale: PhaseLabelLocale = "pt-BR"): Record<TournamentPhase, string> {
  return PHASE_LABELS_BY_LOCALE[locale];
}

export function phaseLabel(phase: TournamentPhase, locale: PhaseLabelLocale = "pt-BR"): string {
  return getPhaseLabels(locale)[phase];
}
