import type { Metadata } from "next";
import Link from "next/link";
import { Flag } from "@/components/Flag";
import { getAllTeams } from "@/lib/teams";
import type { Team } from "@/lib/types/tournament";

export const metadata: Metadata = {
  title: "Teams | WC26 Simulator",
  description: "All 48 qualified nations in the 2026 World Cup.",
};

const EYEBROW: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains-mono)",
  fontSize: "10px",
  letterSpacing: "0.24em",
  color: "#0d0d10",
  opacity: 0.55,
};

const GROUP_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const;

export default function TeamsPage() {
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
            {all.length} NATIONS · 12 GROUPS
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-8">
          {GROUP_LETTERS.map((letter) => {
            const teams = byGroup.get(letter) ?? [];
            if (teams.length === 0) return null;

            return (
              <section key={letter}>
                <div className="mb-4 flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    style={{ height: 4, flex: 1, background: "#0d0d10" }}
                  />
                  <h2
                    style={{
                      fontFamily: "var(--font-archivo-black)",
                      fontSize: "16px",
                      letterSpacing: "0.22em",
                      color: "#0d0d10",
                      whiteSpace: "nowrap",
                    }}
                  >
                    GROUP {letter}
                  </h2>
                  <span
                    aria-hidden="true"
                    style={{ height: 4, flex: 1, background: "#0d0d10" }}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {teams.map((team) => (
                    <Link
                      key={team.countryCode}
                      href={`/teams/${team.countryCode}`}
                      className="group flex flex-col bg-white transition-transform hover:-translate-y-0.5"
                      style={{
                        border: "2px solid #0d0d10",
                        transitionDuration: "120ms",
                      }}
                    >
                      <div
                        className="flex items-center justify-between gap-3"
                        style={{
                          background: "#0d0d10",
                          color: "#fff",
                          padding: "8px 12px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-jetbrains-mono)",
                            fontSize: "10px",
                            letterSpacing: "0.22em",
                          }}
                        >
                          {team.countryCode}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-jetbrains-mono)",
                            fontSize: "10px",
                            letterSpacing: "0.18em",
                            opacity: 0.6,
                          }}
                        >
                          #{team.fifaRanking}
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-6 text-center">
                        <Flag
                          countryCode={team.countryCode}
                          label={team.name}
                          className="text-4xl transition-transform group-hover:scale-110"
                        />
                        <div
                          className="break-words"
                          style={{
                            fontFamily: "var(--font-archivo-black)",
                            fontSize: "16px",
                            letterSpacing: "-0.01em",
                            color: "#0d0d10",
                            lineHeight: 1.1,
                          }}
                        >
                          {team.name.toUpperCase()}
                        </div>
                      </div>

                      <div
                        className="grid grid-cols-2"
                        style={{ borderTop: "1px solid rgba(13,13,16,0.12)" }}
                      >
                        <div
                          className="text-center"
                          style={{
                            padding: "8px 6px",
                            borderRight: "1px solid rgba(13,13,16,0.12)",
                          }}
                        >
                          <div
                            style={{
                              fontFamily: "var(--font-jetbrains-mono)",
                              fontSize: "9px",
                              letterSpacing: "0.22em",
                              color: "#0d0d10",
                              opacity: 0.5,
                            }}
                          >
                            POWER
                          </div>
                          <div
                            style={{
                              fontFamily: "var(--font-archivo-black)",
                              fontSize: "18px",
                              letterSpacing: "-0.02em",
                              color: "#0d0d10",
                              lineHeight: 1,
                            }}
                          >
                            {team.strength}
                          </div>
                        </div>
                        <div className="text-center" style={{ padding: "8px 6px" }}>
                          <div
                            style={{
                              fontFamily: "var(--font-jetbrains-mono)",
                              fontSize: "9px",
                              letterSpacing: "0.22em",
                              color: "#0d0d10",
                              opacity: 0.5,
                            }}
                          >
                            CONF
                          </div>
                          <div
                            style={{
                              fontFamily: "var(--font-archivo-black)",
                              fontSize: "13px",
                              letterSpacing: "0.04em",
                              color: "#D52B1E",
                              lineHeight: 1.15,
                            }}
                          >
                            {team.confederation}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
