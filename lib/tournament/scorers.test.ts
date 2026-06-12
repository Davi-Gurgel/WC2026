import { describe, expect, it } from "vitest";
import { scorerMapToTopScorers, topScorersToMap } from "@/lib/tournament/scorers";
import type { Scorer } from "@/lib/types/tournament";

describe("topScorersToMap / scorerMapToTopScorers", () => {
  it("round-trips a list of scorers", () => {
    const scorers: Scorer[] = [
      { playerName: "Player A", teamName: "Brazil", goals: 3 },
      { playerName: "Player B", teamName: "Argentina", goals: 1 }
    ];

    const map = topScorersToMap(scorers);
    const result = scorerMapToTopScorers(map);

    expect(result).toHaveLength(2);
    for (const scorer of scorers) {
      expect(result).toContainEqual(scorer);
    }
  });

  it("sorts by goals descending, then player name ascending for ties", () => {
    const scorers: Scorer[] = [
      { playerName: "Zico", teamName: "Brazil", goals: 2 },
      { playerName: "Messi", teamName: "Argentina", goals: 5 },
      { playerName: "Alves", teamName: "Brazil", goals: 2 }
    ];

    const result = scorerMapToTopScorers(topScorersToMap(scorers));

    expect(result.map((s) => s.playerName)).toEqual(["Messi", "Alves", "Zico"]);
  });

  it("keeps two entries for the same player name on different teams", () => {
    const scorers: Scorer[] = [
      { playerName: "Silva", teamName: "Brazil", goals: 2 },
      { playerName: "Silva", teamName: "Portugal", goals: 4 }
    ];

    const map = topScorersToMap(scorers);
    expect(map.size).toBe(2);

    const result = scorerMapToTopScorers(map);
    expect(result).toHaveLength(2);
    expect(result.find((s) => s.teamName === "Brazil")?.goals).toBe(2);
    expect(result.find((s) => s.teamName === "Portugal")?.goals).toBe(4);
  });
});
