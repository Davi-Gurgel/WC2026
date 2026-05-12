import type { Scorer } from "@/lib/types/tournament";

export function topScorersToMap(topScorers: Scorer[]): Map<string, Scorer> {
  return new Map(topScorers.map((scorer) => [`${scorer.playerName}|${scorer.teamName}`, scorer]));
}

export function scorerMapToTopScorers(scorerMap: Map<string, Scorer>): Scorer[] {
  return [...scorerMap.values()].sort((a, b) => b.goals - a.goals || a.playerName.localeCompare(b.playerName));
}
