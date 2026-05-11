"use client";

import Link from "next/link";
import { useMemo } from "react";
import { GroupCard, GroupLegend } from "@/components/simulator/GroupCard";
import { useTournament } from "@/components/TournamentProvider";
import { getTournamentStats } from "@/lib/tournament/selectors";
import { LayoutGrid, AlertCircle, FastForward, Play, CheckCircle2 } from "lucide-react";
import { StatBox } from "@/components/ui/StatBox";
import { cn } from "@/lib/utils";

export default function GroupsPage() {
  const { state, hydrated, startTournament, simulateGroupDay, simulateAllGroups } = useTournament();
  const stats = useMemo(() => getTournamentStats(state), [state]);
  const phaseDone = state.phase !== "GROUP_STAGE" && state.phase !== "NOT_STARTED";

  if (!state.active) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="flex max-w-md flex-col items-center border border-wc-red/30 bg-wc-red/5 p-8 text-center backdrop-blur-md">
          <AlertCircle className="mb-4 size-8 text-wc-red" />
          <h2 className="mb-2 font-outfit text-xl font-bold uppercase tracking-widest text-white">System Offline</h2>
          <p className="mb-6 font-mono text-xs text-white/50">Simulation requires initialization sequence.</p>
          <button
            type="button"
            disabled={!hydrated}
            onClick={() => {
              if (hydrated) startTournament();
            }}
            className="flex items-center gap-2 border border-glass-border bg-white/5 px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-navy disabled:pointer-events-none disabled:opacity-45"
          >
            <Play className="size-3 fill-current" />
            Initialize Now
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 pb-20">
      <header className="border-b border-glass-border bg-navy-panel/30 px-6 py-8 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 label-micro text-wc-blue">
              <LayoutGrid className="size-3" />
              <span>Phase 01</span>
            </div>
            <h1 className="font-outfit text-4xl font-black uppercase tracking-tight text-white">Group Stage</h1>
          </div>
          
          <div className="flex gap-2 font-mono text-xs">
            <span className={cn(
              "border px-3 py-1 uppercase tracking-widest text-[10px]",
              state.phase === "GROUP_STAGE" ? "border-wc-green/30 bg-wc-green/10 text-success-bright" : "border-glass-border bg-white/5 text-white/50"
            )}>
              {state.phase === "GROUP_STAGE" ? "Active" : phaseDone ? "Completed" : "Pending"}
            </span>
            <span className="border border-glass-border bg-white/5 px-3 py-1 uppercase tracking-widest text-[10px] text-white/50">
              Round {Math.min(state.currentGroupMatchDay, 3)}/3
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <section className="mb-10 grid grid-cols-2 gap-px border border-glass-border bg-glass-border md:grid-cols-4">
          <StatBox value={stats.simulatedGroupMatches} label="Matches Sim'd" />
          <StatBox value={stats.totalGoals} label="Total Goals" />
          <StatBox value={stats.averageGoals.toFixed(1)} label="Avg Goals/Match" />
          <StatBox value={state.groups.length} label="Groups Active" />
        </section>

        {state.phase === "GROUP_STAGE" && (
          <section className="mb-10 flex flex-wrap items-center justify-between gap-4 border border-wc-blue/30 bg-wc-blue/5 p-6">
            <p className="font-mono text-xs text-wc-blue">Awaiting command to process next match day.</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={!hydrated}
                className="flex items-center gap-2 border border-glass-border bg-white/5 px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-navy disabled:pointer-events-none disabled:opacity-45"
                onClick={() => {
                  if (hydrated) simulateGroupDay();
                }}
              >
                <FastForward className="size-3" />
                Sim Round {state.currentGroupMatchDay}
              </button>
              <button
                type="button"
                disabled={!hydrated}
                className="flex items-center gap-2 border border-wc-red bg-wc-red/10 px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest text-wc-red transition-colors hover:bg-wc-red hover:text-white disabled:pointer-events-none disabled:opacity-45"
                onClick={() => {
                  if (hydrated) simulateAllGroups();
                }}
              >
                <FastForward className="size-3 fill-current" />
                Auto-Resolve Phase
              </button>
            </div>
          </section>
        )}

        {phaseDone && (
          <section className="mb-10 flex items-center justify-between border border-wc-green/30 bg-wc-green/10 p-6 text-success-bright">
            <div className="flex items-center gap-3 font-mono text-sm">
              <CheckCircle2 className="size-5" />
              <span>Phase 01 data finalized. 32 qualifiers locked.</span>
            </div>
            <Link 
              href="/bracket" 
              className="border border-wc-green px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest transition-colors hover:bg-wc-green hover:text-white"
            >
              Access Bracket
            </Link>
          </section>
        )}

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {state.groups.map((group) => (
            <GroupCard key={group.letter} group={group} />
          ))}
        </section>

        <GroupLegend />
      </div>
    </main>
  );
}


