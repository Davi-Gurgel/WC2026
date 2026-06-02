"use client";

import { useMemo } from "react";
import { Flag } from "@/components/Flag";
import { useTournament } from "@/components/TournamentProvider";
import {
  collectTournamentMatches,
  getMatchActivityTime,
  getTournamentStats,
  scoreDisplay,
} from "@/lib/tournament";
import { StatBox } from "@/components/ui/StatBox";
import { PageHeader } from "@/components/ui/PageHeader";

const SECTION_TITLE: React.CSSProperties = {
  fontFamily: "var(--font-archivo-black)",
  fontSize: "18px",
  letterSpacing: "0.04em",
  color: "#0d0d10",
};

export default function StatsPage() {
  const { state } = useTournament();
  const { stats, latestMatches } = useMemo(() => {
    const matchCollections = collectTournamentMatches(state);

    const latestMatches = [
      ...matchCollections.playedKnockoutMatches,
      ...matchCollections.playedGroupMatches,
    ]
      .sort((a, b) => getMatchActivityTime(b) - getMatchActivityTime(a))
      .slice(0, 8);

    return {
      stats: getTournamentStats(state, matchCollections),
      latestMatches,
    };
  }, [state]);

  return (
    <main className="flex-1 pb-16" style={{ background: "#fefaf0" }}>
      <PageHeader eyebrow="ANALYTICS" title="STATISTICS" badge={stats.phase.toUpperCase()} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {state.champion && (
          <section
            className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between"
            style={{
              background: "#fff",
              border: "3px solid #0d0d10",
              boxShadow: "8px 8px 0 0 #D52B1E",
              padding: "22px 24px",
            }}
          >
            <div className="flex items-center gap-4">
              <Flag
                countryCode={state.champion.countryCode}
                label={state.champion.name}
                className="text-5xl shrink-0"
              />
              <div className="min-w-0">
                <div
                  style={{
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: "10px",
                    letterSpacing: "0.24em",
                    color: "#D52B1E",
                    marginBottom: "4px",
                  }}
                >
                  WORLD CHAMPION
                </div>
                <h2
                  className="break-words"
                  style={{
                    fontFamily: "var(--font-archivo-black)",
                    fontSize: "clamp(28px, 4vw, 40px)",
                    lineHeight: 0.95,
                    letterSpacing: "-0.02em",
                    color: "#0d0d10",
                  }}
                >
                  {state.champion.name.toUpperCase()}
                </h2>
              </div>
            </div>
          </section>
        )}

        <section className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatBox value={stats.totalMatches} label="Matches Resolved" />
          <StatBox value={stats.totalGoals} label="Total Goals" />
          <StatBox value={stats.averageGoals.toFixed(1)} label="Avg Goals / Match" />
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          {/* Top Scorers */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span aria-hidden="true" style={{ height: 4, flex: 1, background: "#0d0d10" }} />
              <h2 style={SECTION_TITLE}>TOP SCORERS</h2>
              <span aria-hidden="true" style={{ height: 4, flex: 1, background: "#0d0d10" }} />
            </div>
            <div className="overflow-x-auto" style={{ background: "#fff", border: "2px solid #0d0d10" }}>
              <table className="w-full text-left">
                <thead style={{ background: "#0d0d10", color: "#fff" }}>
                  <tr
                    style={{
                      fontFamily: "var(--font-jetbrains-mono)",
                      fontSize: "10px",
                      letterSpacing: "0.22em",
                    }}
                  >
                    <th className="px-3 py-2 font-normal opacity-60">#</th>
                    <th className="px-3 py-2 font-normal">PLAYER</th>
                    <th className="px-3 py-2 font-normal">TEAM</th>
                    <th className="px-3 py-2 text-right font-normal">GOALS</th>
                  </tr>
                </thead>
                <tbody>
                  {state.topScorers.slice(0, 20).map((scorer, index) => (
                    <tr
                      key={`${scorer.playerName}-${scorer.teamName}`}
                      style={{
                        background: index % 2 === 0 ? "#fff" : "#fefaf0",
                        borderTop: index === 0 ? "none" : "1px solid rgba(13,13,16,0.1)",
                      }}
                    >
                      <td
                        className="px-3 py-3"
                        style={{
                          fontFamily: "var(--font-jetbrains-mono)",
                          fontSize: "11px",
                          color: "#0d0d10",
                          opacity: 0.55,
                        }}
                      >
                        {(index + 1).toString().padStart(2, "0")}
                      </td>
                      <td
                        className="px-3 py-3"
                        style={{
                          fontFamily: "var(--font-space-grotesk)",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#0d0d10",
                        }}
                      >
                        {scorer.playerName}
                      </td>
                      <td
                        className="px-3 py-3"
                        style={{
                          fontFamily: "var(--font-space-grotesk)",
                          fontSize: "12px",
                          color: "#0d0d10",
                          opacity: 0.7,
                        }}
                      >
                        {scorer.teamName}
                      </td>
                      <td
                        className="px-3 py-3 text-right"
                        style={{
                          fontFamily: "var(--font-archivo-black)",
                          fontSize: "16px",
                          color: "#D52B1E",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {scorer.goals}
                      </td>
                    </tr>
                  ))}
                  {!state.topScorers.length && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-12 text-center"
                        style={{
                          fontFamily: "var(--font-jetbrains-mono)",
                          fontSize: "10px",
                          letterSpacing: "0.24em",
                          color: "#0d0d10",
                          opacity: 0.45,
                        }}
                      >
                        AWAITING DATA
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span aria-hidden="true" style={{ height: 4, flex: 1, background: "#0d0d10" }} />
              <h2 style={SECTION_TITLE}>RECENT ACTIVITY</h2>
              <span aria-hidden="true" style={{ height: 4, flex: 1, background: "#0d0d10" }} />
            </div>
            <div className="overflow-x-auto" style={{ background: "#fff", border: "2px solid #0d0d10" }}>
              <table className="w-full text-left">
                <thead style={{ background: "#0d0d10", color: "#fff" }}>
                  <tr
                    style={{
                      fontFamily: "var(--font-jetbrains-mono)",
                      fontSize: "10px",
                      letterSpacing: "0.22em",
                    }}
                  >
                    <th className="px-3 py-2 text-right font-normal">HOME</th>
                    <th className="w-20 px-3 py-2 text-center font-normal">SCORE</th>
                    <th className="px-3 py-2 font-normal">AWAY</th>
                  </tr>
                </thead>
                <tbody>
                  {latestMatches.length ? (
                    latestMatches.map((match, index) => (
                      <tr
                        key={match.id}
                        style={{
                          background: index % 2 === 0 ? "#fff" : "#fefaf0",
                          borderTop: index === 0 ? "none" : "1px solid rgba(13,13,16,0.1)",
                        }}
                      >
                        <td
                          className="px-3 py-3 text-right"
                          style={{
                            fontFamily: "var(--font-space-grotesk)",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#0d0d10",
                          }}
                        >
                          {match.homeTeam.name}
                        </td>
                        <td
                          className="px-3 py-3 text-center"
                          style={{
                            fontFamily: "var(--font-archivo-black)",
                            fontSize: "15px",
                            color: "#D52B1E",
                            letterSpacing: "-0.02em",
                          }}
                        >
                          {scoreDisplay(match)}
                        </td>
                        <td
                          className="px-3 py-3"
                          style={{
                            fontFamily: "var(--font-space-grotesk)",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#0d0d10",
                          }}
                        >
                          {match.awayTeam.name}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-12 text-center"
                        style={{
                          fontFamily: "var(--font-jetbrains-mono)",
                          fontSize: "10px",
                          letterSpacing: "0.24em",
                          color: "#0d0d10",
                          opacity: 0.45,
                        }}
                      >
                        AWAITING DATA
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
