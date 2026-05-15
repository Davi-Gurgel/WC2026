"use client";

import Link from "next/link";
import { useMemo } from "react";
import { GroupCard, GroupLegend } from "@/components/simulator/GroupCard";
import { useTournament } from "@/components/TournamentProvider";
import { getTournamentStats } from "@/lib/tournament/selectors";
import { StatBox } from "@/components/ui/StatBox";

const EYEBROW: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains-mono)",
  fontSize: "10px",
  letterSpacing: "0.24em",
  color: "#0d0d10",
  opacity: 0.55,
};

const H1: React.CSSProperties = {
  fontFamily: "var(--font-archivo-black)",
  fontSize: "clamp(36px, 5vw, 56px)",
  lineHeight: 1,
  letterSpacing: "-0.03em",
  color: "#0d0d10",
};

const PILL_BASE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  fontFamily: "var(--font-jetbrains-mono)",
  fontSize: "10px",
  letterSpacing: "0.22em",
  padding: "5px 10px",
  border: "1px solid #0d0d10",
  background: "#fefaf0",
  color: "#0d0d10",
};

export default function GroupsPage() {
  const { state, hydrated, startTournament, simulateGroupDay, simulateAllGroups } = useTournament();
  const stats = useMemo(() => getTournamentStats(state), [state]);
  const phaseDone = state.phase !== "GROUP_STAGE" && state.phase !== "NOT_STARTED";

  if (!state.active) {
    return (
      <main
        className="flex flex-1 items-center justify-center px-6 py-16"
        style={{ background: "#fefaf0" }}
      >
        <div
          className="w-full max-w-md text-center"
          style={{
            background: "#fff",
            border: "3px solid #0d0d10",
            boxShadow: "8px 8px 0 0 #D52B1E",
            padding: "32px 28px",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-jetbrains-mono)",
              fontSize: "10px",
              letterSpacing: "0.24em",
              color: "#D52B1E",
              marginBottom: "12px",
            }}
          >
            NOT STARTED
          </div>
          <h2
            style={{
              fontFamily: "var(--font-archivo-black)",
              fontSize: "28px",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "#0d0d10",
              marginBottom: "12px",
            }}
          >
            NO SIMULATION ACTIVE
          </h2>
          <p
            style={{
              fontFamily: "var(--font-space-grotesk)",
              fontSize: "14px",
              lineHeight: 1.55,
              color: "#0d0d10",
              opacity: 0.6,
              marginBottom: "24px",
            }}
          >
            Start the tournament to draw groups and begin Phase 01.
          </p>
          <button
            type="button"
            disabled={!hydrated}
            onClick={() => {
              if (hydrated) startTournament();
            }}
            className="inline-flex items-center transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: "#0d0d10",
              color: "#fff",
              fontFamily: "var(--font-archivo-black)",
              fontSize: "16px",
              letterSpacing: "0.04em",
              border: "none",
              padding: "14px 28px",
              cursor: "pointer",
              gap: "10px",
              boxShadow: "6px 6px 0 0 #D52B1E",
              transitionDuration: "120ms",
            }}
          >
            <span
              style={{
                width: 0,
                height: 0,
                borderLeft: "8px solid #fff",
                borderTop: "6px solid transparent",
                borderBottom: "6px solid transparent",
                display: "inline-block",
              }}
            />
            START TOURNAMENT
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 pb-16" style={{ background: "#fefaf0" }}>
      <header
        className="px-4 py-7 sm:px-6 sm:py-8"
        style={{ background: "#fefaf0", borderBottom: "3px solid #0d0d10" }}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div style={EYEBROW}>PHASE · 01</div>
            <h1 className="mt-2" style={H1}>
              GROUP STAGE
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span style={PILL_BASE}>
              <span
                aria-hidden="true"
                style={{
                  width: 8,
                  height: 8,
                  background:
                    state.phase === "GROUP_STAGE"
                      ? "#006847"
                      : phaseDone
                        ? "#0d0d10"
                        : "rgba(13,13,16,0.3)",
                }}
              />
              {state.phase === "GROUP_STAGE" ? "ACTIVE" : phaseDone ? "COMPLETED" : "PENDING"}
            </span>
            <span style={PILL_BASE}>
              MATCHDAY {Math.min(state.currentGroupMatchDay, 3)}/3
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatBox value={stats.simulatedGroupMatches} label="Matches Sim'd" />
          <StatBox value={stats.totalGoals} label="Total Goals" />
          <StatBox value={stats.averageGoals.toFixed(1)} label="Avg Goals" />
          <StatBox value={state.groups.length} label="Groups" />
        </section>

        {state.phase === "GROUP_STAGE" && (
          <section
            className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            style={{
              background: "#fff",
              border: "2px solid #0d0d10",
              padding: "18px 20px",
            }}
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-1 inline-block shrink-0"
                style={{ width: 3, height: 28, background: "#006847" }}
              />
              <p
                style={{
                  fontFamily: "var(--font-space-grotesk)",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#0d0d10",
                  lineHeight: 1.45,
                }}
              >
                Awaiting command to process the next match day.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={!hydrated}
                className="inline-flex items-center transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: "#0d0d10",
                  color: "#fff",
                  fontFamily: "var(--font-archivo-black)",
                  fontSize: "13px",
                  letterSpacing: "0.04em",
                  border: "none",
                  padding: "12px 20px",
                  cursor: "pointer",
                  boxShadow: "6px 6px 0 0 #D52B1E",
                  transitionDuration: "120ms",
                }}
                onClick={() => {
                  if (hydrated) simulateGroupDay();
                }}
              >
                SIM MATCHDAY {state.currentGroupMatchDay}
              </button>
              <button
                type="button"
                disabled={!hydrated}
                className="inline-flex items-center transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: "#fff",
                  color: "#0d0d10",
                  fontFamily: "var(--font-archivo-black)",
                  fontSize: "13px",
                  letterSpacing: "0.04em",
                  border: "2px solid #0d0d10",
                  padding: "10px 18px",
                  cursor: "pointer",
                  transitionDuration: "120ms",
                }}
                onClick={() => {
                  if (hydrated) simulateAllGroups();
                }}
              >
                AUTO-RESOLVE PHASE
              </button>
            </div>
          </section>
        )}

        {phaseDone && (
          <section
            className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between"
            style={{
              background: "#fff",
              border: "2px solid #0d0d10",
              boxShadow: "6px 6px 0 0 #006847",
              padding: "18px 20px",
            }}
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-1 inline-block shrink-0"
                style={{ width: 3, height: 28, background: "#006847" }}
              />
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: "10px",
                    letterSpacing: "0.24em",
                    color: "#006847",
                    marginBottom: "4px",
                  }}
                >
                  PHASE 01 COMPLETE
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-space-grotesk)",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#0d0d10",
                  }}
                >
                  32 qualifiers locked. Bracket is ready.
                </p>
              </div>
            </div>
            <Link
              href="/bracket"
              className="inline-flex items-center transition-transform hover:-translate-y-0.5"
              style={{
                background: "#0d0d10",
                color: "#fff",
                fontFamily: "var(--font-archivo-black)",
                fontSize: "13px",
                letterSpacing: "0.04em",
                border: "none",
                padding: "12px 20px",
                boxShadow: "4px 4px 0 0 #D52B1E",
                transitionDuration: "120ms",
              }}
            >
              VIEW BRACKET →
            </Link>
          </section>
        )}

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {state.groups.map((group) => (
            <GroupCard key={group.letter} group={group} />
          ))}
        </section>

        <GroupLegend />
      </div>
    </main>
  );
}
