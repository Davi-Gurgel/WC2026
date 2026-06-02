import { describe, expect, it } from "vitest";
import { applyRatingsToTeams, buildRatingMap, parseCsvRatings, type RatingIndex } from "./ratings-lib";
import type { ExportedTeam } from "./lib";

function makeTeam(
  overrides: Partial<ExportedTeam> & { countryCode: string; name: string }
): ExportedTeam {
  return {
    confederation: "UEFA",
    group: "A",
    strength: 75,
    attackStrength: 75,
    defenseStrength: 75,
    midfieldStrength: 75,
    fifaRanking: 10,
    players: [{ name: "Default GK", position: "GOALKEEPER", strength: 75 }],
    ...overrides,
  };
}

const SAMPLE_CSV = `short_name,overall,nationality_name,player_positions
M. Salah,91,Egypt,RM
K. Mbappé,91,France,ST
L. Messi,90,Argentina,CF
N'Golo Kanté,84,France,CM
"Alisson",84,Brazil,GK
`;

describe("parseCsvRatings", () => {
  it("parses short_name and overall columns", () => {
    const rows = parseCsvRatings(SAMPLE_CSV);
    expect(rows).toHaveLength(5);
    expect(rows[0]).toEqual({ name: "M. Salah", overall: 91 });
  });

  it("handles quoted fields and apostrophes in names", () => {
    const rows = parseCsvRatings(SAMPLE_CSV);
    const kante = rows.find((r) => r.name.includes("Kant"));
    expect(kante).toBeDefined();
    expect(kante?.overall).toBe(84);
  });

  it("accepts 'name' column when 'short_name' is absent", () => {
    const csv = `name,overall\nRonaldo,88\nNeymar,87\n`;
    const rows = parseCsvRatings(csv);
    expect(rows[0]).toEqual({ name: "Ronaldo", overall: 88 });
  });

  it("parses optional country_code columns for scoped rating files", () => {
    const csv = `country_code,name,overall\nARG,Emiliano Martínez,85\nURU,Emiliano Martínez,70\n`;
    const rows = parseCsvRatings(csv);
    expect(rows).toEqual([
      { countryCode: "ARG", name: "Emiliano Martínez", overall: 85 },
      { countryCode: "URU", name: "Emiliano Martínez", overall: 70 },
    ]);
  });

  it("throws when no name column is found", () => {
    const csv = `player,overall\nFoo,80\n`;
    expect(() => parseCsvRatings(csv)).toThrow(/name column/i);
  });

  it("throws when no rating column is found", () => {
    const csv = `name,score\nFoo,80\n`;
    expect(() => parseCsvRatings(csv)).toThrow(/rating column/i);
  });
});

describe("buildRatingMap", () => {
  it("normalises diacritics and lowercases names", () => {
    const rows = parseCsvRatings(SAMPLE_CSV);
    const { byExact } = buildRatingMap(rows);
    expect(byExact.get("k mbappe")).toBeDefined();
    expect(byExact.get("l messi")).toBeDefined();
  });

  it("keeps the highest rating for duplicate normalised names", () => {
    const csv = `name,overall\nMessi,88\nMessi,90\n`;
    const { byExact } = buildRatingMap(parseCsvRatings(csv));
    expect(byExact.get("messi")).toBe(90);
  });

  it("indexes reversed token order for Asian name matching", () => {
    const csv = `name,overall\nHeung-Min Son,88\n`;
    const { byReversed } = buildRatingMap(parseCsvRatings(csv));
    // "son heungmin" reversed → "heungmin son" should be indexed
    expect([...byReversed.values()].length).toBeGreaterThan(0);
  });
});

describe("applyRatingsToTeams", () => {
  const teams: ExportedTeam[] = [
    makeTeam({
      countryCode: "EGY",
      name: "Egypt",
      strength: 75,
      players: [
        { name: "M. Salah", position: "MIDFIELDER", strength: 70 },
        { name: "Unknown Player", position: "GOALKEEPER", strength: 70 },
      ],
    }),
  ];

  it("matches reversed token order (e.g. Korean names)", () => {
    const csv = `name,overall\nHeung-Min Son,88\nMin-Jae Kim,85\n`;
    const index = buildRatingMap(parseCsvRatings(csv));
    const team = [
      makeTeam({
        countryCode: "KOR",
        name: "South Korea",
        strength: 75,
        players: [
          { name: "Son Heung-min", position: "FORWARD", strength: 70 },
          { name: "Kim Min-jae", position: "DEFENDER", strength: 70 },
        ],
      }),
    ];
    const { teams: next } = applyRatingsToTeams(team, index);
    expect(next[0].players[0].strength).toBe(88);
    expect(next[0].players[1].strength).toBe(85);
  });

  it("applies matched ratings and uses team median for unmatched players", () => {
    const rows = parseCsvRatings(SAMPLE_CSV);
    const map = buildRatingMap(rows);
    const { teams: next, plan } = applyRatingsToTeams(teams, map);

    const egy = next.find((t) => t.countryCode === "EGY")!;
    const salah = egy.players.find((p) => p.name === "M. Salah")!;
    expect(salah.strength).toBe(91);

    const unknown = egy.players.find((p) => p.name === "Unknown Player")!;
    // Median of matched (just Salah = 91), jitter is deterministic but small
    expect(unknown.strength).toBeGreaterThanOrEqual(88);
    expect(unknown.strength).toBeLessThanOrEqual(94);

    const egyPlan = plan.updated.find((u) => u.countryCode === "EGY")!;
    expect(egyPlan.matched).toBe(1);
    expect(egyPlan.defaulted).toBe(1);
    expect(egyPlan.teamMedian).toBe(91);
  });

  it("falls back to team strength as median when no players match", () => {
    const noMatchTeam: ExportedTeam[] = [
      makeTeam({
        countryCode: "TST",
        name: "Test",
        strength: 70,
        players: [{ name: "Nobody Here", position: "GOALKEEPER", strength: 60 }],
      }),
    ];
    const emptyIndex: RatingIndex = {
      byExact: new Map(),
      byReversed: new Map(),
      byLastName: new Map(),
      byCountryExact: new Map(),
      byCountryReversed: new Map(),
      byCountryLastName: new Map(),
    };
    const { teams: next, plan } = applyRatingsToTeams(noMatchTeam, emptyIndex);
    const p = plan.updated[0];
    expect(p.teamMedian).toBe(70);
    expect(next[0].players[0].strength).toBeGreaterThanOrEqual(67);
    expect(next[0].players[0].strength).toBeLessThanOrEqual(73);
  });

  it("keeps fallback strengths within valid bounds", () => {
    const emptyIndex: RatingIndex = {
      byExact: new Map(),
      byReversed: new Map(),
      byLastName: new Map(),
      byCountryExact: new Map(),
      byCountryReversed: new Map(),
      byCountryLastName: new Map(),
    };
    const { teams: next } = applyRatingsToTeams(
      [
        makeTeam({
          countryCode: "LOW",
          name: "Low",
          strength: 2,
          players: [{ name: "Low Default", position: "GOALKEEPER", strength: 60 }],
        }),
        makeTeam({
          countryCode: "HGH",
          name: "High",
          strength: 99,
          players: [{ name: "High Default", position: "GOALKEEPER", strength: 60 }],
        }),
      ],
      emptyIndex
    );

    expect(next[0].players[0].strength).toBeGreaterThanOrEqual(1);
    expect(next[0].players[0].strength).toBeLessThanOrEqual(5);
    expect(next[1].players[0].strength).toBeGreaterThanOrEqual(96);
    expect(next[1].players[0].strength).toBeLessThanOrEqual(100);
  });

  it("produces the same result on repeated calls (deterministic jitter)", () => {
    const rows = parseCsvRatings(SAMPLE_CSV);
    const map = buildRatingMap(rows);
    const { teams: a } = applyRatingsToTeams(teams, map);
    const { teams: b } = applyRatingsToTeams(teams, map);
    expect(a).toEqual(b);
  });

  it("keeps country-scoped ratings from leaking across same-name players", () => {
    const csv = `country_code,name,overall\nARG,Emiliano Martínez,85\nURU,Emiliano Martínez,70\n`;
    const index = buildRatingMap(parseCsvRatings(csv));
    const sameNameTeams = [
      makeTeam({
        countryCode: "ARG",
        name: "Argentina",
        players: [{ name: "Emiliano Martínez", position: "GOALKEEPER", strength: 75 }],
      }),
      makeTeam({
        countryCode: "URU",
        name: "Uruguay",
        players: [{ name: "Emiliano Martínez", position: "MIDFIELDER", strength: 75 }],
      }),
    ];

    const { teams: next } = applyRatingsToTeams(sameNameTeams, index);
    expect(next[0].players[0].strength).toBe(85);
    expect(next[1].players[0].strength).toBe(70);
  });

  it("does not use last-name fallback for country-scoped rating rows", () => {
    const csv = `country_code,name,overall\nCAN,Jonathan David,82\n`;
    const index = buildRatingMap(parseCsvRatings(csv));
    const canada = [
      makeTeam({
        countryCode: "CAN",
        name: "Canada",
        strength: 72,
        players: [
          { name: "Jonathan David", position: "FORWARD", strength: 75 },
          { name: "Promise David", position: "FORWARD", strength: 50 },
        ],
      }),
    ];

    const { teams: next, plan } = applyRatingsToTeams(canada, index);
    expect(plan.updated[0].matched).toBe(1);
    expect(next[0].players[0].strength).toBe(82);
    expect(next[0].players[1].strength).not.toBe(82);
  });
});
