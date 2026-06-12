import type { Metadata } from "next";
import Link from "next/link";
import { Flag } from "@/components/Flag";
import { PageHeader } from "@/components/ui/PageHeader";
import { getAllTeams } from "@/lib/teams";
import type { Team } from "@/lib/types/tournament";

export const metadata: Metadata = {
  title: "Teams | WC26 Simulator",
  description: "All 48 qualified nations in the 2026 World Cup.",
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
    <main className="flex-1 pb-16" style={{ background: "var(--color-wc-cream)" }}>
      <PageHeader eyebrow="DATABASE" title="TEAMS" badge={`${all.length} NATIONS · 12 GROUPS`} />

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
                    style={{ height: 4, flex: 1, background: "var(--color-wc-ink)" }}
                  />
                  <h2
                    style={{
                      fontFamily: "var(--font-archivo-black)",
                      fontSize: "16px",
                      letterSpacing: "0.22em",
                      color: "var(--color-wc-ink)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    GROUP {letter}
                  </h2>
                  <span
                    aria-hidden="true"
                    style={{ height: 4, flex: 1, background: "var(--color-wc-ink)" }}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {teams.map((team) => (
                    <Link
                      key={team.countryCode}
                      href={`/teams/${team.countryCode}`}
                      className="group flex flex-col bg-white transition-transform hover:-translate-y-0.5"
                      style={{
                        border: "2px solid var(--color-wc-ink)",
                        transitionDuration: "120ms",
                      }}
                    >
                      <div
                        className="flex items-center justify-between gap-3"
                        style={{
                          background: "var(--color-wc-ink)",
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
                            color: "var(--color-wc-ink)",
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
                              color: "var(--color-wc-ink)",
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
                              color: "var(--color-wc-ink)",
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
                              color: "var(--color-wc-ink)",
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
                              color: "var(--color-wc-can-red)",
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
