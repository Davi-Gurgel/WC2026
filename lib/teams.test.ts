import { describe, expect, it } from "vitest";
import { getAllTeams, getTeamByCodeOrName } from "@/lib/teams";

describe("team data access", () => {
  it("loads a valid 48-team tournament dataset with four teams per group", () => {
    const teams = getAllTeams();
    const groupCounts = new Map<string, number>();

    for (const team of teams) {
      groupCounts.set(team.group, (groupCounts.get(team.group) ?? 0) + 1);
      expect(Number.isFinite(team.strength)).toBe(true);
      expect(Object.isFrozen(team)).toBe(true);
      expect(Object.isFrozen(team.players)).toBe(true);
    }

    expect(teams).toHaveLength(48);
    expect([...groupCounts.values()]).toEqual(Array.from({ length: 12 }, () => 4));
  });

  it("resolves team routes by country code and decoded name", () => {
    expect(getTeamByCodeOrName("MEX")?.name).toBe("Mexico");
    expect(getTeamByCodeOrName(encodeURIComponent("Ivory Coast"))?.countryCode).toBe("CIV");
  });
});
