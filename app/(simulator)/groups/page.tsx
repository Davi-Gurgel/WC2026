"use client";

import { useMemo } from "react";
import { GroupCard, GroupLegend } from "@/components/simulator/GroupCard";
import { useTournament } from "@/components/TournamentProvider";
import { getTournamentStats } from "@/lib/tournament";
import { StatBox } from "@/components/ui/StatBox";
import { Button, LinkButton } from "@/components/ui/Button";
import { PageHeader, BADGE_STYLE } from "@/components/ui/PageHeader";

const PILL_BASE: React.CSSProperties = {
  ...BADGE_STYLE,
  gap: "8px",
};

export default function GroupsPage() {
  const { state, hydrated, startTournament, simulateGroupDay, simulateAllGroups } = useTournament();
  const stats = useMemo(() => getTournamentStats(state), [state]);
  const phaseDone = state.phase !== "GROUP_STAGE" && state.phase !== "NOT_STARTED";

  if (!state.active) {
    return (
      <main
        className="flex flex-1 items-center justify-center px-6 py-16"
        style={{ background: "var(--color-wc-cream)" }}
      >
        <div
          className="w-full max-w-md text-center"
          style={{
            background: "#fff",
            border: "3px solid var(--color-wc-ink)",
            boxShadow: "8px 8px 0 0 var(--color-wc-can-red)",
            padding: "32px 28px",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-jetbrains-mono)",
              fontSize: "10px",
              letterSpacing: "0.24em",
              color: "var(--color-wc-can-red)",
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
              color: "var(--color-wc-ink)",
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
              color: "var(--color-wc-ink)",
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
              background: "var(--color-wc-ink)",
              color: "#fff",
              fontFamily: "var(--font-archivo-black)",
              fontSize: "16px",
              letterSpacing: "0.04em",
              border: "none",
              padding: "14px 28px",
              cursor: "pointer",
              gap: "10px",
              boxShadow: "6px 6px 0 0 var(--color-wc-can-red)",
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
    <main className="flex-1 pb-16" style={{ background: "var(--color-wc-cream)" }}>
      <PageHeader eyebrow="PHASE · 01" title="GROUP STAGE" />

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
            <span style={PILL_BASE}>
              <span
                aria-hidden="true"
                style={{
                  width: 8,
                  height: 8,
                  background:
                    state.phase === "GROUP_STAGE"
                      ? "var(--color-wc-mex-green)"
                      : phaseDone
                        ? "var(--color-wc-ink)"
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
              border: "2px solid var(--color-wc-ink)",
              padding: "18px 20px",
            }}
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-1 inline-block shrink-0"
                style={{ width: 3, height: 28, background: "var(--color-wc-mex-green)" }}
              />
              <p
                style={{
                  fontFamily: "var(--font-space-grotesk)",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--color-wc-ink)",
                  lineHeight: 1.45,
                }}
              >
                Awaiting command to process the next match day.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="primary"
                disabled={!hydrated}
                className="disabled:cursor-not-allowed disabled:opacity-50"
                style={{ fontSize: "13px", padding: "12px 20px" }}
                onClick={() => {
                  if (hydrated) simulateGroupDay();
                }}
              >
                SIM MATCHDAY {state.currentGroupMatchDay}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={!hydrated}
                className="disabled:cursor-not-allowed disabled:opacity-50"
                style={{ fontSize: "13px", padding: "10px 18px" }}
                onClick={() => {
                  if (hydrated) simulateAllGroups();
                }}
              >
                AUTO-RESOLVE PHASE
              </Button>
            </div>
          </section>
        )}

        {phaseDone && (
          <section
            className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between"
            style={{
              background: "#fff",
              border: "2px solid var(--color-wc-ink)",
              boxShadow: "6px 6px 0 0 var(--color-wc-mex-green)",
              padding: "18px 20px",
            }}
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-1 inline-block shrink-0"
                style={{ width: 3, height: 28, background: "var(--color-wc-mex-green)" }}
              />
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: "10px",
                    letterSpacing: "0.24em",
                    color: "var(--color-wc-mex-green)",
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
                    color: "var(--color-wc-ink)",
                  }}
                >
                  32 qualifiers locked. Bracket is ready.
                </p>
              </div>
            </div>
            <LinkButton
              href="/bracket"
              variant="primary"
              style={{ fontSize: "13px", padding: "12px 20px", boxShadow: "4px 4px 0 0 var(--color-wc-can-red)" }}
            >
              VIEW BRACKET →
            </LinkButton>
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
