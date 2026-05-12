"use client";

import { useMemo, useState } from "react";
import { useTournament } from "@/components/TournamentProvider";
import { MatchRow } from "@/components/simulator/MatchRow";
import { getAllGroupMatches } from "@/lib/tournament/selectors";
import type { Match } from "@/lib/types/tournament";

import { Activity, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type MatchFilter = "GROUP" | "R32" | "R16" | "QF" | "SF" | "FINAL";

const MATCH_DAYS = [1, 2, 3] as const;

const filters: Array<[MatchFilter, string]> = [
  ["GROUP", "Group Stage"],
  ["R32", "Round of 32"],
  ["R16", "Round of 16"],
  ["QF", "Quarter Finals"],
  ["SF", "Semi Finals"],
  ["FINAL", "Finals"]
];

export default function MatchesPage() {
  const { state } = useTournament();
  const [phase, setPhase] = useState<MatchFilter>("GROUP");
  const [day, setDay] = useState(1);

  const matches = useMemo(() => {
    const byPhase: Record<MatchFilter, Match[]> = {
      GROUP: getAllGroupMatches(state).filter((match) => match.round === day),
      R32: state.r32Matches,
      R16: state.r16Matches,
      QF: state.quarterFinals,
      SF: state.semiFinals,
      FINAL: [state.thirdPlaceMatch, state.finalMatch].filter(Boolean) as Match[]
    };
    return byPhase[phase];
  }, [day, phase, state]);

  return (
    <main className="flex-1 pb-20">
      <header className="border-b border-glass-border bg-navy-panel/30 px-6 py-8 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 label-micro text-white/50">
              <Activity className="size-3" />
              <span>System Log</span>
            </div>
            <h1 className="font-outfit text-4xl font-black uppercase tracking-tight text-white">Match History</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 border border-glass-border bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map(([f, label]) => (
              <button
                key={f}
                className={cn(
                  "px-4 py-2 label-micro tracking-widest transition-colors",
                  phase === f 
                    ? "border border-wc-blue bg-wc-blue/20 text-wc-blue" 
                    : "border border-glass-border text-white/50 hover:bg-white/10 hover:text-white"
                )}
                onClick={() => setPhase(f)}
              >
                {label}
              </button>
            ))}
          </div>

          {phase === "GROUP" && (
            <div className="flex items-center gap-2 border-l border-glass-border pl-4">
              <span className="font-mono text-[10px] text-white/30 uppercase tracking-widest">Matchday</span>
              {MATCH_DAYS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDay(d)}
                  className={cn(
                    "flex size-8 items-center justify-center font-mono text-xs font-bold transition-colors",
                    day === d 
                      ? "bg-white text-navy" 
                      : "border border-glass-border text-white/50 hover:border-white/50 hover:text-white"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>

        {matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-glass-border py-20 text-center">
            <Clock className="mb-4 size-6 text-white/20" />
            <div className="font-mono text-xs uppercase tracking-widest text-white/30">No matches generated for this query</div>
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
