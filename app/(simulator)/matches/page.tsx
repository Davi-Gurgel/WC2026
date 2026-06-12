"use client";

import { useMemo, useState } from "react";
import { useTournament } from "@/components/TournamentProvider";
import { MatchRow } from "@/components/simulator/MatchRow";
import { getGroupMatchesForDay } from "@/lib/tournament";
import type { Match } from "@/lib/types/tournament";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";

type MatchFilter = "GROUP" | "R32" | "R16" | "QF" | "SF" | "FINAL";

const MATCH_DAYS = [1, 2, 3] as const;

const filters: Array<[MatchFilter, string]> = [
  ["GROUP", "GROUP STAGE"],
  ["R32", "ROUND OF 32"],
  ["R16", "ROUND OF 16"],
  ["QF", "QUARTER FINALS"],
  ["SF", "SEMI FINALS"],
  ["FINAL", "FINALS"],
];

export default function MatchesPage() {
  const { state } = useTournament();
  const [phase, setPhase] = useState<MatchFilter>("GROUP");
  const [day, setDay] = useState(1);

  const matches = useMemo(() => {
    const byPhase: Record<MatchFilter, Match[]> = {
      GROUP: getGroupMatchesForDay(state, day),
      R32: state.r32Matches,
      R16: state.r16Matches,
      QF: state.quarterFinals,
      SF: state.semiFinals,
      FINAL: [state.thirdPlaceMatch, state.finalMatch].filter(Boolean) as Match[],
    };
    return byPhase[phase];
  }, [day, phase, state]);

  return (
    <main className="flex-1 pb-16" style={{ background: "var(--color-wc-cream)" }}>
      <PageHeader eyebrow="MATCH LOG" title="MATCHES" />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div
          className="mb-7 flex flex-col gap-3 p-3 sm:p-4"
          style={{ background: "#fff", border: "2px solid var(--color-wc-ink)" }}
        >
          <div className="flex flex-wrap gap-2">
            {filters.map(([f, label]) => {
              const active = phase === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setPhase(f)}
                  className="transition-transform hover:-translate-y-0.5"
                  style={{
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: "10px",
                    letterSpacing: "0.18em",
                    padding: "8px 12px",
                    border: "2px solid var(--color-wc-ink)",
                    background: active ? "var(--color-wc-ink)" : "#fff",
                    color: active ? "#fff" : "var(--color-wc-ink)",
                    cursor: "pointer",
                    transitionDuration: "120ms",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {phase === "GROUP" && (
            <div
              className="flex flex-wrap items-center gap-2"
              style={{
                paddingTop: "10px",
                borderTop: "1px solid rgba(13,13,16,0.15)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono)",
                  fontSize: "10px",
                  letterSpacing: "0.22em",
                  color: "var(--color-wc-ink)",
                  opacity: 0.55,
                }}
              >
                MATCHDAY
              </span>
              {MATCH_DAYS.map((d) => {
                const active = day === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDay(d)}
                    className={cn(
                      "flex size-8 items-center justify-center transition-transform hover:-translate-y-0.5"
                    )}
                    style={{
                      fontFamily: "var(--font-archivo-black)",
                      fontSize: "12px",
                      border: "2px solid var(--color-wc-ink)",
                      background: active ? "var(--color-wc-can-red)" : "#fff",
                      color: active ? "#fff" : "var(--color-wc-ink)",
                      cursor: "pointer",
                      transitionDuration: "120ms",
                    }}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {matches.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center px-6 py-16 text-center"
            style={{
              background: "#fff",
              border: "2px dashed var(--color-wc-ink)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: "10px",
                letterSpacing: "0.24em",
                color: "var(--color-wc-ink)",
                opacity: 0.55,
              }}
            >
              NO MATCHES YET
            </div>
            <p
              className="mt-3 max-w-sm"
              style={{
                fontFamily: "var(--font-space-grotesk)",
                fontSize: "13px",
                lineHeight: 1.55,
                color: "var(--color-wc-ink)",
                opacity: 0.55,
              }}
            >
              Run the simulation to populate this round.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {matches.map((match) => (
              <MatchRow key={match.id} match={match} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
