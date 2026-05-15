import Link from "next/link";
import type { Metadata } from "next";
import { Flag } from "@/components/Flag";
import { getAllTeams } from "@/lib/teams";
import type { Team } from "@/lib/types/tournament";

export const metadata: Metadata = {
  title: "Teams — WC26 Simulator",
  description: "All 48 qualified national teams for the 2026 World Cup.",
};

const EYEBROW: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains-mono)",
  fontSize: "10px",
  letterSpacing: "0.24em",
  color: "#0d0d10",
  opacity: 0.55,
};

const GROUP_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const;

export default function TeamsIndexPage() {
  const all = getAllTeams();
  const byGroup = new Map<string, Team[]>();
  for (const team of all) {
    const list = byGroup.get(team.group) ?? [];
    list.push(team);
    byGroup.set(team.group, list);
  }

  return (
    <main className="flex-1 pb-16" style={{ background: "#fefaf0" }}>
      <header
        className="px-4 py-7 sm:px-6 sm:py-8"
        style={{ background: "#fefaf0", borderBottom: "3px solid #0d0d10" }}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div style={EYEBROW}>DATABASE</div>
            <h1
              className="mt-2"
              style={{
                fontFamily: "var(--font-archivo-black)",
                fontSize: "clamp(36px, 5vw, 56px)",
                lineHeight: 1,
                letterSpacing: "-0.03em",
                color: "#0d0d10",
              }}
            >
              TEAMS
            </h1>
          </div>
          <span
            className="self-start md:self-auto"
            style={{
              display: "inline-flex",
              alignItems: "center",
              fontFamily: "var(--font-jetbrains-mono)",
              fontSize: "10px",
              letterSpacing: "0.22em",
              padding: "5px 10px",
              border: "1px solid #0d0d10",
              background: "#fefaf0",
              color: "#0d0d10",
            }}
          >
            48 NATIONS · 12 GROUPS
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {GROUP_LETTERS.map((letter) => {
            const teams = byGroup.get(letter) ?? [];
            if (teams.length === 0) return null;

            return (
              <section
                key={letter}
                className="flex flex-col bg-white"
                style={{ border: "2px solid #0d0d10" }}
              >
                <header
                  className="flex items-center justify-between"
                  style={{ background: "#0d0d10", color: "#fff", padding: "10px 14px" }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-archivo-black)",
                      fontSize: "16px",
                      letterSpacing: "0.04em",
                    }}
                  >
                    GROUP {letter}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains-mono)",
                      fontSize: "10px",
                      letterSpacing: "0.22em",
                      opacity: 0.6,
                    }}
                  >
                    {teams.length.toString().padStart(2, "0")}
                  </span>
                </header>

                <ul>
                  {teams.map((team, index) => (
                    <li
                      key={team.countryCode}
                      style={{
                        borderTop: index === 0 ? "none" : "1px solid rgba(13,13,16,0.1)",
                      }}
                    >
                      <Link
                        href={`/teams/${team.countryCode}`}
                        className="flex items-center justify-between gap-3 px-3 py-3 transition-colors hover:bg-wc-paper"
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          <Flag
                            countryCode={team.countryCode}
                            label={team.name}
                            className="shrink-0 text-base"
                          />
                          <span
                            className="min-w-0 truncate"
                            style={{
                              fontFamily: "var(--font-space-grotesk)",
                              fontSize: "13px",
                              fontWeight: 600,
                              color: "#0d0d10",
                            }}
                          >
                            {team.name}
                          </span>
                        </span>
                        <span
                          className="shrink-0"
                          style={{
                            fontFamily: "var(--font-jetbrains-mono)",
                            fontSize: "10px",
                            letterSpacing: "0.18em",
                            color: "#0d0d10",
                            opacity: 0.5,
                          }}
                        >
                          #{team.fifaRanking}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
