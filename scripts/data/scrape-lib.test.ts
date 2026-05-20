import { describe, expect, it } from "vitest";
import {
  POSITION_MAP,
  WIKI_NAME_ALIASES,
  applyScrapeToTeams,
  parseSquadsWikitext,
  renderSeedPlayersSql
} from "./scrape-lib";
import type { ExportedTeam } from "./lib";

function makeTeam(overrides: Partial<ExportedTeam> & { countryCode: string; name: string }): ExportedTeam {
  return {
    name: overrides.name,
    countryCode: overrides.countryCode,
    confederation: overrides.confederation ?? "UEFA",
    group: overrides.group ?? "A",
    strength: overrides.strength ?? 70,
    attackStrength: overrides.attackStrength ?? 70,
    defenseStrength: overrides.defenseStrength ?? 70,
    midfieldStrength: overrides.midfieldStrength ?? 70,
    fifaRanking: overrides.fifaRanking ?? 50,
    players: overrides.players ?? [{ name: "Existing Keeper", position: "GOALKEEPER", strength: 70 }]
  };
}

function fakeSquadBlock(positions: string[]): string {
  const rows = positions
    .map((pos, index) => `{{nat fs g player|pos=${pos}|name=[[Player ${index + 1}]]|club=[[Club ${index + 1}]]|clubnat=ABC}}`)
    .join("\n");
  return `{{nat fs g start}}\n${rows}\n{{nat fs g end}}`;
}

const SAMPLE_WIKITEXT = `==Group A==

===Czech Republic===
Some prose with {{cite web|title=...}}.

{{nat fs g start}}
{{nat fs g player|pos=GK|name=[[Jindřich Staněk]]|age={{birth date and age2|2026|6|11|1996|4|27}}|caps=1|goals=0|club=[[Slavia]]|clubnat=CZE}}
{{nat fs g player|pos=GK|name=[[Tomáš Vaclík]]|caps=2|club=[[Sigma Olomouc]]|clubnat=CZE}}
{{nat fs g player|pos=DF|name=[[Vladimír Coufal]]|caps=3|club=[[West Ham United F.C.|West Ham United]]|clubnat=ENG}}
{{nat fs break}}
{{nat fs g player|pos=MF|name=[[Tomáš Souček]]|caps=4|club=[[West Ham]]|clubnat=ENG}}
{{nat fs g player|pos=FW|name=[[Patrik Schick]]|caps=5|club=[[Bayer 04 Leverkusen|Leverkusen]]|clubnat=GER}}
{{nat fs g end}}

===Mexico===
${fakeSquadBlock([
  "GK", "GK", "GK",
  "DF", "DF", "DF", "DF", "DF", "DF", "DF", "DF",
  "MF", "MF", "MF", "MF", "MF", "MF", "MF", "MF",
  "FW", "FW", "FW", "FW", "FW", "FW", "FW"
])}

===Brazil===
${fakeSquadBlock(Array.from({ length: 40 }, (_, i) => (i < 4 ? "GK" : i < 14 ? "DF" : i < 27 ? "MF" : "FW")))}

===South Africa===
TBD.

===Age===
Statistical aside, not a nation.
`;

const NAME_MAP = new Map<string, string>([
  ["Czechia", "CZE"],
  ["Mexico", "MEX"],
  ["Brazil", "BRA"],
  ["South Africa", "RSA"]
]);

describe("parseSquadsWikitext", () => {
  it("maps Wikipedia headings to country codes (including aliases)", () => {
    const result = parseSquadsWikitext(SAMPLE_WIKITEXT, NAME_MAP);
    expect([...result.byCountryCode.keys()].sort()).toEqual(["BRA", "CZE", "MEX", "RSA"]);
    // The "Czech Republic" alias resolves to CZE
    expect(result.byCountryCode.get("CZE")?.wikiName).toBe("Czech Republic");
  });

  it("extracts player rows and strips wikilinks (with and without pipes)", () => {
    const result = parseSquadsWikitext(SAMPLE_WIKITEXT, NAME_MAP);
    const cze = result.byCountryCode.get("CZE")!;
    expect(cze.players).toHaveLength(5);
    expect(cze.players[0]).toEqual({
      name: "Jindřich Staněk",
      position: "GOALKEEPER",
      club: "Slavia"
    });
    // Piped wikilink in club: [[West Ham United F.C.|West Ham United]] -> "West Ham United"
    expect(cze.players[2].club).toBe("West Ham United");
  });

  it("tolerates nested {{birth date}} templates inside the player template", () => {
    const result = parseSquadsWikitext(SAMPLE_WIKITEXT, NAME_MAP);
    const stanek = result.byCountryCode.get("CZE")!.players[0];
    expect(stanek.name).toBe("Jindřich Staněk");
    expect(stanek.position).toBe("GOALKEEPER");
  });

  it("flags non-nation headings as unknown", () => {
    const result = parseSquadsWikitext(SAMPLE_WIKITEXT, NAME_MAP);
    expect(result.unknownHeadings).toContain("Age");
  });

  it("returns empty players[] for nations with no squad block", () => {
    const result = parseSquadsWikitext(SAMPLE_WIKITEXT, NAME_MAP);
    expect(result.byCountryCode.get("RSA")?.players).toEqual([]);
  });

  it("exposes the expected position map and aliases", () => {
    expect(POSITION_MAP).toEqual({
      GK: "GOALKEEPER",
      DF: "DEFENDER",
      MF: "MIDFIELDER",
      FW: "FORWARD"
    });
    expect(WIKI_NAME_ALIASES["Czech Republic"]).toBe("Czechia");
    expect(WIKI_NAME_ALIASES.Turkey).toBe("Türkiye");
  });
});

describe("applyScrapeToTeams", () => {
  const teams: ExportedTeam[] = [
    makeTeam({
      countryCode: "CZE",
      name: "Czechia",
      group: "A",
      strength: 73,
      players: [{ name: "Patrik Schick", position: "FORWARD", strength: 79 }]
    }),
    makeTeam({
      countryCode: "MEX",
      name: "Mexico",
      group: "A",
      strength: 74,
      players: [{ name: "Existing Keeper", position: "GOALKEEPER", strength: 76 }]
    }),
    makeTeam({
      countryCode: "BRA",
      name: "Brazil",
      group: "C",
      strength: 85,
      players: [{ name: "Existing Keeper", position: "GOALKEEPER", strength: 80 }]
    }),
    makeTeam({
      countryCode: "RSA",
      name: "South Africa",
      group: "A",
      strength: 67,
      players: [{ name: "Existing Keeper", position: "GOALKEEPER", strength: 70 }]
    })
  ];

  it("applies updates only to nations with exactly 26 scraped players", () => {
    const scrape = parseSquadsWikitext(SAMPLE_WIKITEXT, NAME_MAP);
    const { teams: next, plan } = applyScrapeToTeams(teams, scrape);

    expect(plan.updated.map((u) => u.countryCode)).toEqual(["MEX"]);
    // CZE (5 players) and BRA (40 players) are both off the 26 target -> preliminary
    expect(plan.skippedPreliminary.map((s) => s.countryCode).sort()).toEqual(["BRA", "CZE"]);
    expect(plan.skippedEmpty.map((s) => s.countryCode)).toEqual(["RSA"]);
    expect(plan.skippedPreliminary).toContainEqual({ countryCode: "BRA", name: "Brazil", count: 40 });

    const mex = next.find((t) => t.countryCode === "MEX")!;
    expect(mex.players).toHaveLength(26);

    // Existing nations not in the 26-club retain their original players
    const rsa = next.find((t) => t.countryCode === "RSA")!;
    expect(rsa.players).toEqual(teams[3].players);
  });

  it("reuses existing strengths for matching names and defaults new players to team strength", () => {
    const scrape = parseSquadsWikitext(SAMPLE_WIKITEXT, NAME_MAP);
    const teamsWithSchick = [
      ...teams.slice(0, 1),
      // Replace MEX with a custom roster where one scraped player will match by name
      makeTeam({
        countryCode: "MEX",
        name: "Mexico",
        group: "A",
        strength: 74,
        players: [
          { name: "Player 1", position: "GOALKEEPER", strength: 88 },
          { name: "Player 20", position: "FORWARD", strength: 91 }
        ]
      }),
      ...teams.slice(2)
    ];

    const { plan } = applyScrapeToTeams(teamsWithSchick, scrape);
    const mexPlan = plan.updated.find((u) => u.countryCode === "MEX")!;
    expect(mexPlan.matched).toBe(2);
    expect(mexPlan.defaulted).toBe(24);
  });

  it("matches names that differ only by diacritics", () => {
    const wiki = `===Mexico===\n${fakeSquadBlock([
      "GK", "GK", "GK",
      "DF", "DF", "DF", "DF", "DF", "DF", "DF", "DF",
      "MF", "MF", "MF", "MF", "MF", "MF", "MF", "MF",
      "FW", "FW", "FW", "FW", "FW", "FW", "FW"
    ]).replace("Player 1]]", "Pláyer 1]]")}\n`;

    const scrape = parseSquadsWikitext(wiki, NAME_MAP);
    const oneTeam = [
      makeTeam({
        countryCode: "MEX",
        name: "Mexico",
        group: "A",
        strength: 74,
        players: [{ name: "Player 1", position: "GOALKEEPER", strength: 87 }]
      })
    ];

    const { teams: next, plan } = applyScrapeToTeams(oneTeam, scrape);
    expect(plan.updated[0]?.matched).toBe(1);
    const matchedPlayer = next[0].players.find((p) => p.name === "Pláyer 1");
    expect(matchedPlayer?.strength).toBe(87);
  });
});

describe("renderSeedPlayersSql", () => {
  it("wraps inserts in BEGIN/COMMIT and emits trailing newline", () => {
    const sql = renderSeedPlayersSql([
      makeTeam({
        countryCode: "MEX",
        name: "Mexico",
        players: [
          { name: "GK A", position: "GOALKEEPER", strength: 75 },
          { name: "FW B", position: "FORWARD", strength: 80 }
        ]
      })
    ]);
    expect(sql.startsWith("BEGIN TRANSACTION;\n")).toBe(true);
    expect(sql.endsWith("COMMIT;\n")).toBe(true);
    expect(sql.match(/INSERT INTO players/g)).toHaveLength(2);
  });

  it("escapes single quotes in player names", () => {
    const sql = renderSeedPlayersSql([
      makeTeam({
        countryCode: "CIV",
        name: "Ivory Coast",
        players: [{ name: "N'Golo Kanté", position: "MIDFIELDER", strength: 80 }]
      })
    ]);
    expect(sql).toContain("'N''Golo Kanté'");
  });

  it("assigns sort_order 0..n-1 per team independently", () => {
    const sql = renderSeedPlayersSql([
      makeTeam({
        countryCode: "AAA",
        name: "AAA",
        players: [
          { name: "A1", position: "GOALKEEPER", strength: 75 },
          { name: "A2", position: "FORWARD", strength: 80 }
        ]
      }),
      makeTeam({
        countryCode: "BBB",
        name: "BBB",
        players: [{ name: "B1", position: "GOALKEEPER", strength: 75 }]
      })
    ]);
    expect(sql).toContain("'AAA', 'A1', 'GOALKEEPER', 75, 0");
    expect(sql).toContain("'AAA', 'A2', 'FORWARD', 80, 1");
    expect(sql).toContain("'BBB', 'B1', 'GOALKEEPER', 75, 0");
  });
});
